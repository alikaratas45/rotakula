
"use client"

import { getStoryBySlug } from '@/lib/kula-data';
import Image from 'next/image';
import { Calendar, User, PlayIcon, PauseIcon } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function StoryPage() {
    const params = useParams();
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
    const { language, translations } = useApp();
    const { toast } = useToast();
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [narrationText, setNarrationText] = useState('');
    const [remainingText, setRemainingText] = useState('');
    const charIndexRef = useRef(0);

    useEffect(() => {
      if (!slug) return;
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug as string, language);
        if (storyData) {
          setStory(storyData);
          const fullText = storyData.content || '';
          setNarrationText(fullText);
          setRemainingText(fullText);
        } else {
          setStory(null);
          setNarrationText('');
          setRemainingText('');
        }
        setLoading(false);
      }
      fetchData();

       return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, [slug, language]);


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
            if (event.error !== 'interrupted' && event.error !== 'canceled') {
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
            startPlayback(remainingText || narrationText);
        }
    }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);


    if (loading) {
      return <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>;
    }

    if (!story) {
        notFound();
    }

    const storyImage = getImageById(story.imageId);
    
    return (
        <article>
            <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                {storyImage && (
                    <Image
                        src={storyImage.imageUrl}
                        alt={storyImage.description}
                        fill
                        priority
                        className="object-cover"
                        data-ai-hint={storyImage.imageHint}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10 container px-4 py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {story.title}
                    </h1>
                </div>
            </section>
            
            <div className="container px-4 py-8 md:py-12">
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
                         {story.content.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
}

