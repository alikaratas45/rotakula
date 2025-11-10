
"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PlaceClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const { toast } = useToast();

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
            
            // Re-check voices right before speaking
            const voices = synth.getVoices();
            const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
            if (voice) {
                utterance.voice = voice;
            }

            utterance.lang = language;
            utterance.text = poi.longDescription;
            
            setTimeout(() => {
                synth.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
            }, 100); // A small delay can help in some browsers
        };

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
                setIsPaused(false);
            } else {
                synth.pause();
                setIsPaused(true);
            }
        } else {
            // If voices are not loaded yet, wait for them.
            if (synth.getVoices().length === 0) {
                 synth.onvoiceschanged = () => {
                    // Need to re-check inside the event listener scope
                    if (synth.getVoices().length > 0) {
                        startPlayback();
                    }
                 };
            } else {
                startPlayback();
            }
        }
    }, [poi.longDescription, language, toast, translations]);
    
    
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return;
        }

        const synth = window.speechSynthesis;
        synthRef.current = synth;

        const utterance = new SpeechSynthesisUtterance();
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

        const shouldAutoplay = searchParams.get('autoplay') === 'true';

        const setupAndPlay = () => {
             if (shouldAutoplay) {
                const newPath = `/places/${poi.slug}`;
                router.replace(newPath, { scroll: false });
                setTimeout(() => {
                    handlePlayPause();
                }, 500); 
            }
        }

        if (synth.getVoices().length === 0) {
            synth.addEventListener('voiceschanged', setupAndPlay);
        } else {
            setupAndPlay();
        }

        return () => {
             if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
            utterance.removeEventListener('end', onEnd);
            utterance.removeEventListener('error', onError);
            synth.removeEventListener('voiceschanged', setupAndPlay);
            setIsPlaying(false);
            setIsPaused(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poi.slug, language]);


    return (
        <APIProvider apiKey={apiKey}>
            <article>
                <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
                    {heroImage && (
                        <Image
                            src={heroImage.imageUrl}
                            alt={heroImage.description}
                            fill
                            priority
                            className="object-cover"
                            data-ai-hint={heroImage.imageHint}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="relative z-10 container px-4 py-8">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">
                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                         </p>
                    </div>
                </section>
                
                <div className="container px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
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
                                {poi.longDescription.split('\n').map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-headline font-bold mb-4">{translations.common.map}</h2>
                                    <EmbeddedMap pois={[poi]} />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </article>
        </APIProvider>
    );
}
