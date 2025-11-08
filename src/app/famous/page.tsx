
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from 'lucide-react';

const audioFile = '/sesler/kulahakkinda.mp3';

// --- MP3 Player Component (for Turkish) ---
function AudioPlayer() {
    const { translations } = useLanguage();
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        // Create audio instance on mount
        const audio = new Audio(audioFile);
        audioRef.current = audio;

        const handleEnded = () => setIsPlaying(false);
        const handleError = () => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `MP3 dosyası yüklenemedi: ${audioFile.split('/').pop()}`,
                variant: "destructive"
            });
            setIsPlaying(false);
        };
        
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Cleanup on unmount
        return () => {
            if (audio) {
                audio.pause();
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
                audioRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(() => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: "Ses dosyası oynatılamadı.",
                    variant: "destructive"
                });
                setIsPlaying(false);
            });
            setIsPlaying(true);
        }
    };
    
    return (
        <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
            <Button
                variant="outline"
                onClick={handlePlayPause}
                aria-label={isPlaying ? translations.pois.pauseNarration : translations.pois.listenNarration}
            >
                {isPlaying ? <PauseIcon className="mr-2 h-4 w-4" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                {isPlaying ? translations.pois.pause : translations.pois.listen}
            </Button>
        </div>
    );
}


// --- TTS Player Component (for other languages) ---
function TTSPlayer({ text }: { text: string }) {
    const { language, translations } = useLanguage();
    const { toast } = useToast();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

     useEffect(() => {
        synthRef.current = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        
        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };
        utterance.onpause = () => {
            setIsSpeaking(true);
            setIsPaused(true);
        };
        utterance.onresume = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };
        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            setIsSpeaking(false);
            setIsPaused(false);
        };
        utteranceRef.current = utterance;

        // Cleanup: cancel speech on unmount or language change
        return () => {
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, language]);


    const handlePlayPause = () => {
        const synth = synthRef.current;
        const utterance = utteranceRef.current;
        if (!synth || !utterance) return;
        
        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
            } else {
                synth.pause();
            }
        } else {
            const voices = synth.getVoices();
            if (voices.length > 0) {
                 const voice = voices.find(v => v.lang.startsWith(language));
                 if (voice) utterance.voice = voice;
                 synth.speak(utterance);
            } else {
                // If voices are not loaded, wait for them
                synth.onvoiceschanged = () => {
                     const availableVoices = synth.getVoices();
                     const voice = availableVoices.find(v => v.lang.startsWith(language));
                     if (voice) utterance.voice = voice;
                     synth.speak(utterance);
                }
            }
        }
    };
    
    const getButtonLabel = () => {
        if (isSpeaking && !isPaused) return translations.pois.pause;
        if (isSpeaking && isPaused) return translations.famous.continueNarration;
        return translations.pois.listen;
    };

    return (
        <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-headline font-bold">{translations.pois.details}</h2>
            <Button
                variant="outline"
                onClick={handlePlayPause}
                aria-label={getButtonLabel()}
            >
                {(isSpeaking && !isPaused) ? <PauseIcon className="mr-2 h-4 w-4" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                {getButtonLabel()}
            </Button>
        </div>
    );
}


// --- Main Page Component ---
export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const narrationText = translations.famous.historyContent;

    const showButton = language === 'tr' || (typeof window !== 'undefined' && 'speechSynthesis' in window);

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
                    
                    {showButton && (
                         language === 'tr' ? <AudioPlayer /> : <TTSPlayer text={narrationText} />
                    )}
                   
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

