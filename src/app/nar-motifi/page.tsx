
"use client";

import { getImageById } from '@/lib/placeholder-images';
import { Gem, PlayIcon, PauseIcon } from 'lucide-react';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function NarMotifiPage() {
  const { language, translations } = useApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const narrationText = [...translations.narMotifi.content, ...translations.narMotifi.poem].join(' ');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [remainingText, setRemainingText] = useState(narrationText);
  const charIndexRef = useRef(0);

  const heroImage = getImageById('poi-essanlar-konagi');

  const startPlayback = useCallback((textToSpeak: string) => {
    const synth = synthRef.current;
    if (!synth || !textToSpeak) return;

    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
    const voices = synth.getVoices();
    const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = language;

    utterance.onboundary = (event) => {
      charIndexRef.current = event.charIndex;
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      charIndexRef.current = 0;
      setRemainingText(narrationText); 
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        toast({
          title: translations.toast.audioErrorTitle,
          description: `${translations.toast.audioErrorDescription} (${event.error})`,
          variant: "destructive"
        });
      }
      setIsPlaying(false);
      setIsPaused(false);
      charIndexRef.current = 0;
      setRemainingText(narrationText); 
    };
    
    setTimeout(() => {
      synth.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }, 100);
  }, [language, narrationText, toast, translations]);

  const handlePlayPause = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) {
      toast({
        title: translations.toast.unsupportedTitle,
        description: translations.toast.unsupportedDescription,
        variant: "destructive"
      });
      return;
    }

    if (synth.speaking && !isPaused) {
      const fullText = utteranceRef.current?.text || narrationText;
      const spokenTextLength = charIndexRef.current;
      const remaining = fullText.substring(spokenTextLength);
      
      synth.cancel();
      setRemainingText(remaining);
      setIsPaused(true);
      setIsPlaying(false);
    } else {
      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = () => startPlayback(remainingText);
      } else {
        startPlayback(remainingText);
      }
    }
  }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);

  useEffect(() => {
    setRemainingText(narrationText);
  }, [narrationText]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    const shouldAutoplay = searchParams.get('autoplay') === 'true';
    if (shouldAutoplay) {
      const synth = synthRef.current;
      if (synth && synth.getVoices().length > 0) {
        startPlayback(narrationText);
      } else if (synth) {
        synth.onvoiceschanged = () => startPlayback(narrationText);
      }
    }

    return () => {
      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }
    };
  }, [searchParams, narrationText, startPlayback]);


  return (
    <article>
        <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint="pomegranate detail wood carving"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="relative z-10 container px-4 py-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg flex items-center gap-3">
                    <Gem className="h-10 w-10" />
                    {translations.narMotifi.title}
                </h1>
            </div>
        </section>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
           <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
              <Button
                  variant="outline"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? translations.pois.pauseNarration : translations.pois.listenNarration}
              >
                  {isPlaying ? (
                      <PauseIcon className="mr-2 h-4 w-4" />
                  ) : (
                      <PlayIcon className="mr-2 h-4 w-4" />
                  )}
                  {isPlaying ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen)}
              </Button>
           </div>
          <div className="prose prose-lg max-w-none text-foreground/90">
            {translations.narMotifi.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <blockquote className="border-l-4 border-primary pl-4 italic my-8 text-center">
                 {translations.narMotifi.poem.map((line, index) => (
                    <p key={index} className="my-1">{line}</p>
                ))}
            </blockquote>
          </div>
        </div>
      </div>
    </article>
  );
}
