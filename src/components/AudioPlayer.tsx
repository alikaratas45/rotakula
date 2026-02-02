
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useApp } from '@/context/app-context';

interface AudioPlayerProps {
  audioUrl: string | null;
  textToNarrate: string;
  autoPlay?: boolean;
}

const chunkText = (text: string): string[] => {
  if (!text) return [];
  const chunks = text.match(/[^.!?]+[.!?]+(\s|$)|\S+/g);
  return chunks || [text];
};

export default function AudioPlayer({ audioUrl, textToNarrate, autoPlay = false }: AudioPlayerProps) {
  const { translations, language } = useApp();
  const isTurkish = language === 'tr';

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef(0);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (synthRef.current?.speaking) {
      isCancelledRef.current = true;
      synthRef.current.cancel();
    }
    chunksRef.current = chunkText(textToNarrate);
    currentChunkIndexRef.current = 0;
    setIsPlaying(false);
    isCancelledRef.current = false;
  }, [textToNarrate, language]);

  const speakChunk = useCallback((chunkIndex: number) => {
    const synth = synthRef.current;
    const chunks = chunksRef.current;
    if (!synth || chunkIndex >= chunks.length) {
      setIsPlaying(false);
      return;
    }
    isCancelledRef.current = false;
    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = language;
    utterance.onend = () => {
      if (isCancelledRef.current) return;
      currentChunkIndexRef.current++;
      if (currentChunkIndexRef.current < chunks.length) {
        speakChunk(currentChunkIndexRef.current);
      } else {
        setIsPlaying(false);
        currentChunkIndexRef.current = 0;
      }
    };
    utterance.onerror = (event) => {
      console.warn("Speech synthesis error:", event.error);
      setIsPlaying(false);
    };
    synth.speak(utterance);
  }, [language]);

  const handleTogglePlay = useCallback(() => {
    if (isTurkish) {
      const audio = audioRef.current;
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play();
        }
      }
    } else {
      const synth = synthRef.current;
      if (!synth) return;
      if (isPlaying) {
        isCancelledRef.current = true;
        synth.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (synth.getVoices().length === 0) {
          synth.onvoiceschanged = () => {
            speakChunk(currentChunkIndexRef.current);
          };
        } else {
          speakChunk(currentChunkIndexRef.current);
        }
      }
    }
  }, [isTurkish, isPlaying, speakChunk]);

  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(() => {
        if (!isPlaying) {
          handleTogglePlay();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, audioUrl, textToNarrate]);

  const canPlay = (isTurkish && audioUrl) || (!isTurkish && textToNarrate);

  return (
    <div className="w-full space-y-3">
      {isTurkish && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleTogglePlay}
          disabled={!canPlay}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
          aria-label={isPlaying ? translations.pois.pause : translations.pois.listen}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span className="ml-2">
            {isPlaying
              ? translations.pois.pause
              : (!isTurkish && currentChunkIndexRef.current > 0 ? translations.pois.continueNarration : translations.pois.listen)}
          </span>
        </Button>
      </div>
    </div>
  );
}
