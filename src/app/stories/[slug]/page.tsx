
"use client"

import { getStoryBySlug } from '@/lib/kula-data';
import Image from 'next/image';
import { Calendar, User, PlayIcon, PauseIcon } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function StoryPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
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
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug, language);
        if (storyData) {
          setStory(storyData);
          const fullText = storyData.content || '';
          setNarrationText(fullText);
          setRemainingText(fullText);
        }
        setLoading(false);
      }
      fetchData();

      // Clean up synth on slug/language change
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
        // General cleanup
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, []);

    const startPlayback = (textToSpeak: string) => {
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
            setRemainingText(narrationText); // Reset for next play
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
            setRemainingText(narrationText); // Reset on error
        };
        
        setTimeout(() => {
            synth.speak(utterance);
            setIsPlaying(true);
            setIsPaused(false);
        }, 100);
    };

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

        if (synth.speaking && !isPaused) { // Is playing, so pause it
            // Calculate remaining text based on the original full text
            const fullText = utteranceRef.current?.text || narrationText;
            const spokenTextLength = charIndexRef.current;
            const remaining = fullText.substring(spokenTextLength);
            
            synth.cancel(); // Use cancel() which is more reliable
            setRemainingText(remaining);
            setIsPaused(true);
            setIsPlaying(false);

        } else { // Is paused or not started, so play
             if (synth.getVoices().length === 0) {
                 synth.onvoiceschanged = () => startPlayback(remainingText);
            } else {
                startPlayback(remainingText);
            }
        }
    }, [isPaused, remainingText, narrationText, toast, translations, language]);


    if (loading) {
      return <div className="container px-4 py-8">{translations.common.loading}...</div>;
    }

    if (!story) {
        notFound();
    }

    const storyImage = getImageById(story.imageId);
    
    const displayDate = story.date;

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
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{story.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={story.date}>{displayDate}</time>
                        </div>
                    </div>

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
