
"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useRouter, useSearchParams } from 'next/navigation';

const MAX_CHUNK_LENGTH = 200; // Max characters per speech chunk

export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);
    const { language, translations } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const textChunksRef = useRef<string[]>([]);
    const currentChunkIndexRef = useRef<number>(0);

    const { toast } = useToast();

    const cleanupSpeech = useCallback(() => {
        if (speechUtteranceRef.current) {
            speechUtteranceRef.current.onend = null;
            speechUtteranceRef.current.onerror = null;
        }
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
        currentChunkIndexRef.current = 0;
    }, []);

    useEffect(() => {
        // Cleanup on language or component change
        return () => {
            cleanupSpeech();
        };
    }, [poi, language, cleanupSpeech]);

    const speakChunk = useCallback((chunkIndex: number) => {
        if (chunkIndex >= textChunksRef.current.length) {
            cleanupSpeech();
            return;
        }

        const chunk = textChunksRef.current[chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        speechUtteranceRef.current = utterance;
        
        const voiceLang = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : language === 'fr' ? 'fr-FR' : 'de-DE';
        utterance.lang = voiceLang;
        
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('erkek') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('männlich')));
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === voiceLang);
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
            setTimeout(() => {
                currentChunkIndexRef.current++;
                speakChunk(currentChunkIndexRef.current);
            }, 500); // Add a small delay between chunks
        };

        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: translations.toast.audioErrorDescription,
                    variant: "destructive"
                });
            }
            cleanupSpeech();
        };
        
        window.speechSynthesis.speak(utterance);
    }, [language, cleanupSpeech, toast, translations]);


    const handlePlayPause = async () => {
        if (isGenerating) return;

        // If it's currently playing and not paused, we want to pause it.
        if (isPlaying && !isPaused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            return;
        }

        // If it's paused, we want to resume.
        if (isPlaying && isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            return;
        }

        // If it's not playing at all, we start from the beginning.
        if (!isPlaying) {
            setIsGenerating(true);
            
            const startPlayback = () => {
                cleanupSpeech();
                setIsPlaying(true);
                setIsPaused(false);
                setIsGenerating(false);

                const fullText = poi.longDescription;
                const sentences = fullText.match(/[^.!?]+[.!?\n]+/g) || [fullText];
                const chunks: string[] = [];
                let currentChunk = "";
                
                sentences.forEach(sentence => {
                    const trimmedSentence = sentence.trim();
                    if (!trimmedSentence) return;
                    if ((currentChunk + ' ' + trimmedSentence).length > MAX_CHUNK_LENGTH && currentChunk) {
                        chunks.push(currentChunk);
                        currentChunk = trimmedSentence;
                    } else {
                        currentChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
                    }
                });
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                textChunksRef.current = chunks;
                currentChunkIndexRef.current = 0;
                speakChunk(0);
            }
            
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) {
                     window.speechSynthesis.onvoiceschanged = () => {
                        startPlayback();
                     };
                } else {
                     startPlayback();
                }
            } else {
                 toast({
                    title: translations.toast.unsupportedTitle,
                    description: translations.toast.unsupportedDescription,
                    variant: "destructive"
                });
                setIsGenerating(false);
            }
        }
    };
    
    useEffect(() => {
        if (searchParams.get('autoplay') === 'true') {
            handlePlayPause();
            // Clean up URL
            const newPath = `/pois/${poi.slug}`;
            router.replace(newPath, { scroll: false });
        }
    }, [searchParams, poi.slug, router]);


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
                    <div className="relative z-10 container py-8">
                        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                            {poi.name}
                        </h1>
                         <p className="mt-2 text-lg text-white/90 capitalize">
                            {translations.category[poi.category as keyof typeof translations.category] || poi.category}
                         </p>
                    </div>
                </section>
                
                <div className="container py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                                <Button
                                    variant="outline"
                                    onClick={handlePlayPause}
                                    disabled={isGenerating}
                                    aria-label={isPlaying && !isPaused ? translations.pois.pauseNarration : translations.pois.listenNarration}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isPlaying && !isPaused ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isGenerating ? translations.audioGuide.generating : (isPlaying && !isPaused ? translations.pois.pause : (isPaused ? translations.famous.continueNarration : translations.pois.listen))}
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
