
"use-client"

import { getStoryBySlug } from '@/lib/kula-data';
import Image from 'next/image';
import { Calendar, User, PlayIcon, PauseIcon } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState, use, useRef, useCallback } from 'react';
import type { Story } from '@/lib/types';
import { notFound } from 'next/navigation';
import { getImageById } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function StoryPage({ params }: { params: { slug: string } }) {
    const { slug } = use(params);
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
      async function fetchData() {
        setLoading(true);
        const storyData = await getStoryBySlug(slug, language);
        if (storyData) {
          setStory(storyData);
        }
        setLoading(false);
      }
      fetchData();
    }, [slug, language]);

    const narrationText = story?.content || '';

    useEffect(() => {
        if (!narrationText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const synth = window.speechSynthesis;
        synthRef.current = synth;

        const utterance = new SpeechSynthesisUtterance(narrationText);
        utteranceRef.current = utterance;

        const onEnd = () => {
            setIsPlaying(false);
            setIsPaused(false);
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
        const onError = (event: SpeechSynthesisErrorEvent) => {
            if (event.error !== 'interrupted') {
                 toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.addEventListener('end', onEnd);
        utterance.addEventListener('error', onError);

        const updateVoice = () => {
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice && utteranceRef.current) {
                utteranceRef.current.voice = voice;
            }
            if (utteranceRef.current) {
                utteranceRef.current.lang = language;
                utteranceRef.current.text = narrationText;
            }
        };

        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', updateVoice);
        } else {
            updateVoice();
        }

        return () => {
            utterance.removeEventListener('end', onEnd);
            utterance.removeEventListener('error', onError);
            synth.removeEventListener('voiceschanged', updateVoice);
            if (synth.speaking) {
                synth.cancel();
            }
        };
    }, [narrationText, language, toast, translations]);


    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        if (!synth || !utteranceRef.current) {
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.toast.unsupportedDescription,
                variant: "destructive"
            });
            return;
        }

        const utterance = utteranceRef.current;

        const startPlayback = () => {
             if (synth.speaking) {
                synth.cancel(); // Cancel any previous speech
            }
            // Re-check and set voice right before speaking
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = language;
            utterance.text = narrationText; // Ensure text is current
            
            setTimeout(() => { // Small delay can help
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            }, 100);
        }

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
                setIsPaused(false);
            } else {
                synth.pause();
                setIsPaused(true);
            }
        } else {
             if (synth.getVoices().length === 0) {
                synth.onvoiceschanged = startPlayback;
            } else {
                startPlayback();
            }
        }
    }, [language, narrationText, toast, translations]);

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
                            aria-label={isPlaying && !isPaused ? translations.pois.pauseNarration : translations.pois.listenNarration}
                        >
                            {isPlaying && !isPaused ? (
                                <PauseIcon className="mr-2 h-4 w-4" />
                            ) : (
                                <PlayIcon className="mr-2 h-4 w-4" />
                            )}
                            {isPlaying && !isPaused ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen)}
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
