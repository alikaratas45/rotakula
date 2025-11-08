
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
function AudioPlayer({ 
    files, 
    onPlaybackStateChange 
}: { 
    files: string[], 
    onPlaybackStateChange: (isPlaying: boolean) => void 
}) {
    const { toast, dismiss } = useToast();
    const { translations } = useLanguage();
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // This effect handles the setup and teardown of the audio element.
    useEffect(() => {
        const audio = new Audio(files[currentTrackIndex]);
        audioRef.current = audio;

        const handleTrackEnd = () => {
            if (currentTrackIndex < files.length - 1) {
                setCurrentTrackIndex(prev => prev + 1);
            } else {
                onPlaybackStateChange(false);
                setCurrentTrackIndex(0); // Reset for next play
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

        // Auto-play next track if it's not the first one
        if (currentTrackIndex > 0) {
            audio.play().catch(handleError);
            onPlaybackStateChange(true);
        }

        // Cleanup function: essential to prevent memory leaks and errors
        return () => {
            dismiss();
            if (audio) {
                audio.pause();
                audio.removeEventListener('ended', handleTrackEnd);
                audio.removeEventListener('error', handleError);
                audio.src = ''; // Release memory
            }
            audioRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackIndex, files]);

    // This effect exposes the play/pause handler to the parent via a global function.
    // This is a workaround to control this component from the parent.
    useEffect(() => {
        const handlePlayPause = () => {
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
        };

        (window as any).handleGlobalPlayPause = handlePlayPause;
        return () => {
            delete (window as any).handleGlobalPlayPause;
        };
    }, [onPlaybackStateChange, toast, translations]);

    return null; // This component does not render any UI itself.
}

// Component for Text-to-Speech (Other Languages)
function TTSPlayer({ 
    text, 
    onPlaybackStateChange 
}: { 
    text: string, 
    onPlaybackStateChange: (isPlaying: boolean, isPaused: boolean) => void 
}) {
    const { language, translations } = useLanguage();
    const { toast, dismiss } = useToast();
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // This effect sets up the SpeechSynthesis utterance and cleans up.
    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;

        utterance.onstart = () => onPlaybackStateChange(true, false);
        utterance.onpause = () => onPlaybackStateChange(true, true);
        utterance.onresume = () => onPlaybackStateChange(true, false);
        utterance.onend = () => onPlaybackStateChange(false, false);
        utterance.onerror = (event) => {
            // Avoid showing an error if speech was interrupted (e.g., by language change)
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

        // Cleanup function: crucial to stop speech when the component unmounts
        return () => {
            dismiss();
            if (synthRef.current?.speaking) {
                synthRef.current.cancel();
            }
            utteranceRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, language]);

    // This effect exposes the play/pause handler to the parent.
    useEffect(() => {
        const handlePlayPause = () => {
            const synth = synthRef.current;
            const utterance = utteranceRef.current;
            if (!synth || !utterance) {
                return;
            }

            if (synth.speaking) {
                if (synth.paused) {
                    synth.resume();
                } else {
                    synth.pause();
                }
            } else {
                // If voices aren't loaded yet, the browser will load them.
                // We set an onvoiceschanged event to handle this case.
                const voices = synth.getVoices();
                if (voices.length > 0) {
                    const voice = voices.find(v => v.lang.startsWith(language));
                    if (voice) utterance.voice = voice;
                    synth.speak(utterance);
                } else {
                    synth.onvoiceschanged = () => {
                        const availableVoices = synth.getVoices();
                        const voice = availableVoices.find(v => v.lang.startsWith(language));
                        if (voice) utterance.voice = voice;
                        synth.speak(utterance);
                    };
                }
            }
        };

        (window as any).handleGlobalPlayPause = handlePlayPause;
        return () => {
            delete (window as any).handleGlobalPlayPause;
        };
    }, [language, toast]);

    return null; // This component also renders no UI.
}


export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    
    // State to manage the UI of the play/pause button
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const narrationText = translations.famous.historyContent;

    // This function calls the globally exposed play/pause handler.
    const handlePlayPause = () => {
        if ((window as any).handleGlobalPlayPause) {
            (window as any).handleGlobalPlayPause();
        }
    };
    
    // Determine if the button should be shown.
    const showButton = language === 'tr' || (typeof window !== 'undefined' && 'speechSynthesis' in window);

    const getButtonLabel = () => {
        if (isPlaying && !isPaused) return translations.pois.pause;
        if (isPlaying && isPaused) return translations.famous.continueNarration;
        return translations.pois.listen;
    };
    
    const showPauseIcon = isPlaying && !isPaused;

    return (
        <div>
            {/* Conditionally render the correct audio player component based on language */}
            {language === 'tr' ? (
                <AudioPlayer 
                    files={audioFiles} 
                    onPlaybackStateChange={(playing) => { 
                        setIsPlaying(playing);
                        setIsPaused(false); // MP3 player doesn't have a 'paused' state in this logic
                    }} 
                />
            ) : (
                <TTSPlayer 
                    text={narrationText} 
                    onPlaybackStateChange={(playing, paused) => { 
                        setIsPlaying(playing);
                        setIsPaused(paused);
                    }} 
                />
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

