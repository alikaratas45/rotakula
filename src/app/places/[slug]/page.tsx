
"use client"

import { getPoiBySlug } from '@/lib/kula-data';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import { Survey } from '@/components/survey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlaceDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { language, translations, addBadge } = useApp();
    const [poi, setPoi] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [showSurvey, setShowSurvey] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const { toast } = useToast();
    
    const [narrationText, setNarrationText] = useState('');
    const [remainingText, setRemainingText] = useState('');
    const charIndexRef = useRef(0);

    useEffect(() => {
        setPoi(null);
        setNarrationText('');
        setRemainingText('');
        setIsPlaying(false);
        setIsPaused(false);
        
        async function fetchPoi() {
            setLoading(true);
            const poiData = await getPoiBySlug(slug, language);
            if (poiData) {
                setPoi(poiData);
                const fullText = poiData.longDescription || '';
                setNarrationText(fullText);
                setRemainingText(fullText);
                if (poiData.badgeId) {
                    addBadge(poiData.id);
                }
            } else {
                setPoi(null);
            }
            setLoading(false);
        }
        fetchPoi();

        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    }, [slug, language, addBadge]);


    const startPlayback = useCallback((textToSpeak: string) => {
        const synth = synthRef.current;
        if (!synth || !textToSpeak) return;

        if (synth.speaking) {
            synth.cancel();
        }

        const textForSpeech = language === 'tr' ? textToSpeak.replace(/UNESCO/g, 'Unesko') : textToSpeak;

        const utterance = new SpeechSynthesisUtterance(textForSpeech);
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
                 synth.onvoiceschanged = () => startPlayback(remainingText || narrationText);
            } else {
                startPlayback(remainingText || narrationText);
            }
        }
    }, [isPaused, remainingText, narrationText, toast, translations, startPlayback]);

     useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        
        const shouldAutoplay = searchParams.get('autoplay') === 'true';
        if (shouldAutoplay && poi) {
            setShowSurvey(true);
            const newPath = `/places/${poi.slug}`;
            router.replace(newPath, { scroll: false });
            
            const safeStartPlayback = () => startPlayback(poi.longDescription);

            setTimeout(() => {
                const synth = synthRef.current;
                if (synth && synth.getVoices().length > 0) {
                    safeStartPlayback();
                } else if (synth) {
                    synth.onvoiceschanged = safeStartPlayback;
                }
            }, 500); 
        }

        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poi, searchParams]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (!poi) {
        notFound();
    }
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);

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

                {showSurvey && (
                    <section className="py-12 bg-muted">
                        <div className="container px-4">
                            <div className="max-w-2xl mx-auto">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{translations.survey.title.replace('{poiName}', poi.name)}</CardTitle>
                                        <CardDescription>
                                            {translations.survey.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Survey poiId={poi.id} poiName={poi.name} onSubmitted={() => setShowSurvey(false)} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                )}
            </article>
        </APIProvider>
    );
}

    

    