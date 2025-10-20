
"use client";

import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { getImageById } from '@/lib/placeholder-images';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlayIcon, PauseIcon, Loader2 } from 'lucide-react';

const MAX_CHUNK_LENGTH = 200; // Max characters per speech chunk

export default function FamousPage() {
    const { language, translations } = useLanguage();
    const heroImage = getImageById('hero-home');
    const { toast } = useToast();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const textChunksRef = useRef<string[]>([]);
    const currentChunkIndexRef = useRef<number>(0);


    const cleanupSpeech = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsPaused(false);
        currentChunkIndexRef.current = 0;
    }, []);

    useEffect(() => {
        // Cleanup on language change or component unmount
        return () => {
            cleanupSpeech();
        };
    }, [language, cleanupSpeech]);
    
    const speakChunk = useCallback((chunkIndex: number) => {
        if (chunkIndex >= textChunksRef.current.length) {
            cleanupSpeech();
            return;
        }

        const chunk = textChunksRef.current[chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        speechUtteranceRef.current = utterance;

        const voices = window.speechSynthesis.getVoices();
        const voiceLang = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'fr-FR';
        
        let selectedVoice = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('erkek') || v.name.toLowerCase().includes('male')));
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang === voiceLang && (v.name.toLowerCase().includes('kadın') || v.name.toLowerCase().includes('female')));
        }
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
            }, 500); // Add a small delay
        };

        utterance.onerror = () => {
            toast({
                title: translations.toast.audioErrorTitle,
                description: translations.toast.audioErrorDescription,
                variant: "destructive"
            });
            cleanupSpeech();
        };
        
        window.speechSynthesis.speak(utterance);
    }, [language, cleanupSpeech, toast, translations]);


    const handlePlayPause = async () => {
        if (isGenerating) return;

        if (isPlaying) {
            if (isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
            } else {
                window.speechSynthesis.pause();
                setIsPaused(true);
            }
        } else {
            setIsGenerating(true); // Show loader while preparing
            
            const startPlayback = () => {
                cleanupSpeech(); // Reset before starting new playback
                setIsPlaying(true);
                setIsPaused(false);
                setIsGenerating(false);

                const fullText = translations.famous.historyContent;
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

            // Ensure voices are loaded before starting playback
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                 window.speechSynthesis.onvoiceschanged = () => {
                    startPlayback();
                 };
            } else {
                 startPlayback();
            }
        }
    };
    
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
                <div className="relative z-10 container py-8">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
                        {translations.famous.pageTitle}
                    </h1>
                </div>
            </section>
            <div className="container py-8 md:py-12">
                <div className="max-w-4xl mx-auto">
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
                         {translations.famous.historyContent.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
