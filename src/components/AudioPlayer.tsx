"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useApp } from '@/context/app-context';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

// Function to split text into manageable chunks (e.g., by sentences)
const chunkText = (text: string): string[] => {
  if (!text) return [];
  // Split by sentences, but also handle paragraphs. This regex is not perfect but a good start.
  const chunks = text.match(/[^.!?]+[.!?]+(\s|$)|\S+/g);
  return chunks || [text]; // Fallback to the whole text if splitting fails
};


export default function AudioPlayer({ text, autoPlay = false }: AudioPlayerProps) {
    const { translations, language } = useApp();
    const [isPlaying, setIsPlaying] = useState(false);
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const chunksRef = useRef<string[]>([]);
    const currentChunkIndexRef = useRef(0);
    const isCancelledRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }

        // Cleanup function to stop any ongoing speech when the component unmounts
        // or when the text changes.
        return () => {
            if (synthRef.current?.speaking) {
                isCancelledRef.current = true;
                synthRef.current.cancel();
            }
        };
    }, []);

    // Effect to handle text changes
    useEffect(() => {
        // When text or language changes, stop any current playback and reset.
        if (synthRef.current?.speaking) {
            isCancelledRef.current = true;
            synthRef.current.cancel();
        }
        chunksRef.current = chunkText(text);
        currentChunkIndexRef.current = 0;
        setIsPlaying(false);
        isCancelledRef.current = false;
        
    }, [text, language]);
    
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
            // If cancel was called, don't proceed to the next chunk.
            if (isCancelledRef.current) {
                return;
            }
            
            // Move to the next chunk
            currentChunkIndexRef.current++;
            if (currentChunkIndexRef.current < chunks.length) {
                speakChunk(currentChunkIndexRef.current);
            } else {
                // End of playback
                setIsPlaying(false);
                currentChunkIndexRef.current = 0; // Reset for next play
            }
        };

        utterance.onerror = (event) => {
            console.warn("Speech synthesis error:", event.error);
            setIsPlaying(false);
        };
        
        synth.speak(utterance);
    }, [language]);


    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        if (!synth) return;

        if (isPlaying) { // If playing, then pause
            isCancelledRef.current = true;
            synth.cancel();
            setIsPlaying(false);
        } else { // If paused, then play
            setIsPlaying(true);
            // Ensure voices are loaded before speaking
             if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = () => {
                    speakChunk(currentChunkIndexRef.current);
                };
            } else {
                speakChunk(currentChunkIndexRef.current);
            }
        }
    }, [isPlaying, speakChunk]);

    // Effect for autoplay
    useEffect(() => {
        if (autoPlay && text && chunksRef.current.length > 0) {
            const timer = setTimeout(() => {
                // Ensure it's not already playing from a previous action
                if (!isPlaying) {
                    handlePlayPause();
                }
            }, 500); // Small delay to ensure everything is ready
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlay, text]);


    return (
        <div className="w-full space-y-3">
            <div className="flex items-center gap-4">
                <Button
                    onClick={handlePlayPause}
                    disabled={!text}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                    aria-label={isPlaying ? translations.pois.pause : translations.pois.listen}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    <span className="ml-2">
                        {isPlaying 
                            ? translations.pois.pause 
                            : (currentChunkIndexRef.current > 0 ? translations.pois.continueNarration : translations.pois.listen)
                        }
                    </span>
                </Button>
            </div>
        </div>
    );
}
