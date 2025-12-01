'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, PlayIcon, PauseIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';

type Content = {
  id: string;
  title: string;
  slug: string;
  body: string;
  imageUrl?: string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
};

// A simple markdown renderer
const MarkdownRenderer = ({ text }: { text: string | undefined | null }) => {
    if (!text) {
        return null;
    }
    const paragraphs = String(text).split('\n').filter(p => p.trim() !== '');
    return (
        <div className="prose prose-lg max-w-none text-foreground/90">
            {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
        </div>
    );
};


export default function ContentPage({ params }: { params: { slug: string } }) {
  const { slug: contentSlug } = params;
  const firestore = useFirestore();
  const { language, translations } = useApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const contentRef = useMemoFirebase(() => {
    if (!firestore || !contentSlug) return null;
    return doc(firestore, 'content', contentSlug);
  }, [firestore, contentSlug]);

  const { data: content, isLoading, error } = useDoc<Content>(contentRef);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const narrationText = content?.body || '';
  const [remainingText, setRemainingText] = useState(narrationText);
  const charIndexRef = useRef(0);
  
  // This effect ensures we handle the case where the document doesn't exist.
  useEffect(() => {
    if (!isLoading && !content && contentSlug) {
      notFound();
    }
  }, [isLoading, content, contentSlug]);


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

  // Main effect for initializing speech and handling autoplay
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
    }

    // If content is loaded, set up the text for narration
    if (content) {
        setRemainingText(content.body);
        charIndexRef.current = 0;
    }
    
    // Only attempt to autoplay if content is fully loaded
    const shouldAutoplay = searchParams.get('autoplay') === 'true';
    if (shouldAutoplay && content?.body) {
        const synth = synthRef.current;
        // Function to start playback safely
        const safeStartPlayback = () => startPlayback(content.body);

        // Check if voices are loaded. If not, wait for them.
        if (synth && synth.getVoices().length > 0) {
            safeStartPlayback();
        } else if (synth) {
            synth.onvoiceschanged = safeStartPlayback;
        }
    }

    // Cleanup function: stop speech when component unmounts or content changes
    return () => {
        if (synthRef.current?.speaking) {
            synthRef.current.cancel();
        }
    };
  }, [content, searchParams, startPlayback]);

  // Loading state
  if (isLoading || !content) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">İçerik yükleniyor...</p>
      </div>
    );
  }
  
  // Error state is handled by the notFound() call in the effect hook

  return (
    <article className="container mx-auto px-4 py-8 md:py-12">
      {content.imageUrl && (
        <div className="relative h-[40vh] md:h-[60vh] w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              {content.title}
            </h1>
            {narrationText && (
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
            )}
        </div>
        <MarkdownRenderer text={content.body} />
      </div>
    </article>
  );
}
