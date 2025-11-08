
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon } from 'lucide-react';

const audioFiles = ['/sesler/kulahakkinda.mp3'];

// Component for MP3 Playback (Turkish)
function AudioPlayer({ files, onPlaybackStateChange }: { files: string[], onPlaybackStateChange: (isPlaying: boolean) => void }) {
    const { toast, dismiss } = useToast();
    const { translations } = useLanguage();
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Setup new audio object
        const audio = new Audio(files[currentTrackIndex]);
        audioRef.current = audio;

        const handleTrackEnd = () => {
            if (currentTrackIndex < files.length - 1) {
                setCurrentTrackIndex(prev => prev + 1);
            } else {
                onPlaybackStateChange(false);
                setCurrentTrackIndex(0);
            }
        };

        const handleError = () => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: `MP3 dosyası yüklenemedi: ${files[currentTrackIndex].split('/').pop()}`,
                variant: "destructive"
            });
            onPlaybackStateChange(false);
        };
        
        audio.addEventListener('ended', handleTrackEnd);
        audio.addEventListener('error', handleError);

        // Auto-play next track
        if (currentTrackIndex > 0) {
            audio.play().catch(handleError);
            onPlaybackStateChange(true);
        }

        // Cleanup function
        return () => {
            dismiss();
            if (audio) {
                audio.pause();
                audio.removeEventListener('ended', handleTrackEnd);
                audio.removeEventListener('error', handleError);
                audio.src = '';
            }
            audioRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackIndex, files]);

    const handlePlayPause = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        if (audio.paused) {
             audio.play().catch(e => {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: "Ses dosyası oynatılamadı.",
                    variant: "destructive"
                });
                onPlaybackStateChange(false);
             });
             onPlaybackStateChange(true);
        } else {
            audio.pause();
            onPlaybackStateChange(false);
        }
    }, [onPlaybackStateChange, toast, translations]);
    
    // Expose the play/pause handler via a ref or a different mechanism if needed,
    // but for now, we assume the button is rendered within this component's scope
    // For simplicity, we'll pass the handler up to the parent.
    // This is a bit of prop drilling, but it keeps components separate.
     useEffect(() => {
        (window as any).handlePlayPause = handlePlayPause;
        return () => { delete (window as any).handlePlayPause; }
    }, [handlePlayPause]);

    return null; // This component doesn't render anything itself
}

// Component for Text-to-Speech (Other Languages)
function TTSPlayer({ text, onPlaybackStateChange }: { text: string, onPlaybackStateChange: (isPlaying: boolean, isPaused: boolean) => void }) {
    const { language, translations } = useLanguage();
    const { toast, dismiss } = useToast();
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const [isComponentMounted, setIsComponentMounted] = useState(false);

    useEffect(() => {
        setIsComponentMounted(true);
        synthRef.current = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        
        utterance.onstart = () => onPlaybackStateChange(true, false);
        utterance.onpause = () => onPlaybackStateChange(true, true);
        utterance.onresume = () => onPlaybackStateChange(true, false);
        utterance.onend = () => onPlaybackStateChange(false, false);
        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                toast({
                    title: translations.toast.audioErrorTitle,
                    description: `${translations.toast.audioErrorDescription} (${event.error})`,
                    variant: "destructive"
                });
            }
            onPlaybackStateChange(false, false);
        };
        utteranceRef.current = utterance;
        
        return () => {
            dismiss();
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
            utteranceRef.current = null;
            synthRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, language]);
    
    const handlePlayPause = useCallback(() => {
        const synth = synthRef.current;
        const utterance = utteranceRef.current;
        if (!synth || !utterance) {
            toast({ title: "TTS not ready" });
            return;
        }

        if (synth.speaking) {
            if (synth.paused) {
                synth.resume();
            } else {
                synth.pause();
            }
        } else {
             // Handle voice loading
            const voices = synth.getVoices();
            if (voices.length > 0) {
                const voice = voices.find(v => v.lang.startsWith(language));
                if (voice) utterance.voice = voice;
                synth.speak(utterance);
            } else {
                synth.onvoiceschanged = () => {
                    const voices = synth.getVoices();
                    const voice = voices.find(v => v.lang.startsWith(language));
                    if (voice) utterance.voice = voice;
                    synth.speak(utterance);
                }
            }
        }
    }, [language, toast]);
    
     useEffect(() => {
        (window as any).handlePlayPause = handlePlayPause;
        return () => { delete (window as any).handlePlayPause; }
    }, [handlePlayPause]);

    return null;
}


export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const narrationText = translations.famous.historyContent;

    const handleGlobalPlayPause = () => {
        if ((window as any).handlePlayPause) {
            (window as any).handlePlayPause();
        }
    };
    
    const showButton = language === 'tr' || (typeof window !== 'undefined' && 'speechSynthesis' in window);

    const getButtonLabel = () => {
        if (isPlaying && !isPaused) return translations.pois.pause;
        if (isPlaying && isPaused) return translations.famous.continueNarration;
        return translations.pois.listen;
    };
    
    const showPauseIcon = isPlaying && !isPaused;

    return (
        <div>
            {language === 'tr' ? (
                <AudioPlayer files={audioFiles} onPlaybackStateChange={(playing) => { setIsPlaying(playing); setIsPaused(false); }} />
            ) : (
                <TTSPlayer text={narrationText} onPlaybackStateChange={(playing, paused) => { setIsPlaying(playing); setIsPaused(paused); }} />
            )}

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
                        {showButton && (
                             <Button
                                variant="outline"
                                onClick={handleGlobalPlayPause}
                                aria-label={showPauseIcon ? translations.pois.pauseNarration : translations.pois.listenNarration}
                            >
                                {showPauseIcon ? (
                                    <PauseIcon className="mr-2 h-4 w-4" />
                                ) : (
                                    <PlayIcon className="mr-2 h-4 w-4" />
                                )}
                                {getButtonLabel()}
                            </Button>
                        )}
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

