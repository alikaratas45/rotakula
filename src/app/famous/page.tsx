
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from 'lucide-react';

const audioFile = '/sesler/kulahakkinda.mp3';

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    // State for MP3 player
    const [isPlaying, setIsPlaying] = useState(false);
    // State for TTS player
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Refs for both audio systems
    const audioRef = useRef<HTMLAudioElement | null>(null); // For MP3
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // For TTS
    const synthRef = useRef<SpeechSynthesis | null>(null); // For TTS

    const narrationText = translations.famous.historyContent;

    // General cleanup effect for both audio systems
    useEffect(() => {
        return () => {
            // Stop MP3 playback
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
                audioRef.current = null;
            }
            // Stop TTS playback
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
            setIsPlaying(false);
            setIsPaused(false);
            setIsSpeaking(false);
        };
    }, [language]);


    // Effect for setting up MP3 player (Turkish only)
    useEffect(() => {
        if (language === 'tr') {
            const audio = new Audio(audioFile);
            audioRef.current = audio;

            const handleTrackEnd = () => setIsPlaying(false);
            const handleError = (e: ErrorEvent) => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: `MP3 dosyası yüklenemedi: ${audio.src.split('/').pop()}`,
                    variant: "destructive"
                });
                setIsPlaying(false);
            };

            audio.addEventListener('ended', handleTrackEnd);
            audio.addEventListener('error', handleError);
            
            return () => {
                 if (audio) {
                    audio.removeEventListener('ended', handleTrackEnd);
                    audio.removeEventListener('error', handleError);
                }
            };
        }
    }, [language, toast, translations]);


    // Effect for setting up TTS (Non-Turkish languages)
    useEffect(() => {
        if (language !== 'tr' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(narrationText);
            utterance.lang = language;
            
            utterance.onstart = () => {
                setIsSpeaking(true);
                setIsPaused(false);
            };
            utterance.onpause = () => {
                setIsPaused(true);
            };
            utterance.onresume = () => {
                setIsPaused(false);
            };
            utterance.onend = () => {
                setIsSpeaking(false);
                setIsPaused(false);
            };
            utterance.onerror = (event) => {
                if (event.error === 'interrupted') return;
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
                setIsSpeaking(false);
                setIsPaused(false);
            };
            utteranceRef.current = utterance;
        }
    }, [language, narrationText, toast, translations]);


    const handlePlayPause = useCallback(() => {
        if (language === 'tr') {
            const audio = audioRef.current;
            if (!audio) return;
            
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                 audio.play().catch(e => {
                    console.error("Audio play failed:", e);
                    toast({
                        title: translations.toast.audioErrorTitle,
                        description: "Ses dosyası oynatılamadı.",
                        variant: "destructive"
                    });
                    setIsPlaying(false);
                 });
                 setIsPlaying(true);
            }
        } else {
            // TTS Logic
            const synth = synthRef.current;
            const utterance = utteranceRef.current;

            if (!synth || !utterance) {
                toast({
                    title: translations.toast.unsupportedTitle,
                    description: translations.toast.unsupportedDescription,
                    variant: "destructive"
                });
                return;
            }

            const startPlayback = () => {
                const voices = synth.getVoices();
                const voice = voices.find(v => v.lang.startsWith(language) && v.default) || voices.find(v => v.lang.startsWith(language));
                if (voice) {
                    utterance.voice = voice;
                }
                synth.speak(utterance);
            }
            
            if (synth.speaking && !synth.paused) {
                synth.pause();
            } else if (synth.speaking && synth.paused) {
                synth.resume();
            } else {
                if (synth.speaking) synth.cancel();
                if (synth.getVoices().length === 0) {
                     synth.onvoiceschanged = startPlayback;
                } else {
                    startPlayback();
                }
            }
        }
    }, [isPlaying, language, toast, translations]);
    
    // Determine button text and icon based on state
    const getButtonLabel = () => {
        if (language === 'tr') {
            return isPlaying ? translations.pois.pause : translations.pois.listen;
        }
        // TTS states
        if (isSpeaking && !isPaused) return translations.pois.pause;
        if (isSpeaking && isPaused) return translations.famous.continueNarration;
        return translations.pois.listen;
    };
    
    const showPauseIcon = (language === 'tr' && isPlaying) || (language !== 'tr' && isSpeaking && !isPaused);

    return (
        <div>
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
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
                        <Button
                            variant="outline"
                            onClick={handlePlayPause}
                            aria-label={showPauseIcon ? translations.pois.pauseNarration : translations.pois.listenNarration}
                        >
                            {showPauseIcon ? (
                                <PauseIcon className="mr-2 h-4 w-4" />
                            ) : (
                                <PlayIcon className="mr-2 h-4 w-4" />
                            )}
                            {getButtonLabel()}
                        </Button>
                    </div>
                    <div className="prose prose-lg max-w-none text-foreground/90">
                         {narrationText.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
