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


export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);

    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if ('speechSynthesis' in window) {
            const handleVoicesChanged = () => {
                setVoices(window.speechSynthesis.getVoices());
            };
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
            handleVoicesChanged(); // Initial load
            
            return () => {
                window.speechSynthesis.onvoiceschanged = null;
                 if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                }
            };
        }
    }, []);

    const cleanup = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
    }, []);

    useEffect(() => {
      // Cleanup on component unmount
      return () => {
        cleanup();
      };
    }, [cleanup]);

    const handlePlayPause = useCallback(async () => {
        if (!('speechSynthesis' in window)) {
            toast({
                title: "Desteklenmiyor",
                description: "Tarayıcınız sesli anlatım özelliğini desteklemiyor.",
                variant: "destructive"
            });
            return;
        }

        if (window.speechSynthesis.speaking) {
            if (window.speechSynthesis.paused) {
                 window.speechSynthesis.resume();
                 setIsPlaying(true);
            } else {
                window.speechSynthesis.pause();
                setIsPlaying(false);
            }
            return;
        }
        
        cleanup(); // Start fresh

        const utterance = new SpeechSynthesisUtterance(poi.longDescription);
        utterance.lang = "tr-TR";
        
        // Find a male Turkish voice
        const maleVoice = voices.find(voice => voice.lang === 'tr-TR' && voice.name.toLowerCase().includes('male'));
        if (maleVoice) {
            utterance.voice = maleVoice;
        } else {
            const turkishVoice = voices.find(voice => voice.lang === 'tr-TR');
            if (turkishVoice) utterance.voice = turkishVoice;
        }
        
        utteranceRef.current = utterance;

        utterance.onstart = () => {
            setIsPlaying(true);
        };

        utterance.onpause = () => {
            setIsPlaying(false);
        };
        
        utterance.onresume = () => {
            setIsPlaying(true);
        }

        utterance.onend = () => {
           cleanup();
        };

        utterance.onerror = (event) => {
            toast({
                title: "Ses Hatası",
                description: `Sesli anlatım sırasında bir hata oluştu: ${event.error}`,
                variant: "destructive"
            });
            cleanup();
        };

        window.speechSynthesis.speak(utterance);

    }, [poi.longDescription, cleanup, toast, voices]);

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
                         <p className="mt-2 text-lg text-white/90 capitalize">{poi.category}</p>
                    </div>
                </section>
                
                <div className="container py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                         <div className="lg:col-span-2">
                             <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-2xl font-headline font-bold">Detaylı Bilgi</h2>
                                <Button
                                    variant="outline"
                                    onClick={handlePlayPause}
                                    aria-label={isPlaying ? "Anlatımı duraklat" : "Anlatımı dinle"}
                                >
                                    {isPlaying ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isPlaying ? 'Duraklat' : 'Sesli Dinle'}
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
                                    <h2 className="text-2xl font-headline font-bold mb-4">Harita</h2>
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
