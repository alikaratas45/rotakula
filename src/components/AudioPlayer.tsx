
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ text, autoPlay = false }: AudioPlayerProps) {
  const { toast } = useToast();
  const { translations } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  const fetchAudio = async () => {
    if (!text) return;
    setIsLoading(true);
    setProgress(0);
    setAudioSrc(null);
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      setAudioSrc(data.audio);
    } catch (error) {
      console.error(error);
      toast({
        title: translations.toast.audioErrorTitle,
        description: translations.toast.audioErrorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // This effect handles creating and managing the Audio element
    // when the audioSrc is available.
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      const handleTimeUpdate = () => {
        setProgress((audio.currentTime / audio.duration) * 100);
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
       const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);

      if (autoPlay || isPlaying) {
          audio.play().catch(e => console.error("Autoplay failed", e));
          setIsPlaying(true);
      }

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc]);

  useEffect(() => {
    // If text changes, we should stop any current playback and reset.
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioSrc(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setIsLoading(false);
  }, [text]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioSrc && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        fetchAudio();
        // Play will be triggered by the useEffect when audioSrc is set
        setIsPlaying(true); 
      }
    }
  };
  
   const handleDownload = () => {
    if (audioSrc) {
      const link = document.createElement('a');
      link.href = audioSrc;
      link.download = 'anlatim.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "Ses Hazır Değil",
        description: "İndirmeden önce sesi en az bir kez oynatın.",
        variant: "destructive"
      })
    }
  };


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-3">
        <div className="flex items-center gap-4">
            <Button
                onClick={handlePlayPause}
                disabled={isLoading || !text}
                size="lg"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                <Pause className="h-5 w-5" />
                ) : (
                <Play className="h-5 w-5" />
                )}
            </Button>
            <div className="flex-grow flex items-center gap-3">
                <Progress value={progress} className="w-full h-2" />
                <span className="text-xs font-mono text-muted-foreground">
                {audioRef.current ? formatTime(audioRef.current.currentTime) : '0:00'} / {duration ? formatTime(duration) : '0:00'}
                </span>
            </div>
             <Button
                onClick={handleDownload}
                disabled={!audioSrc}
                variant="outline"
                size="icon"
                aria-label="Download audio"
            >
                <Download className="h-5 w-5" />
            </Button>
        </div>
    </div>
  );
}
