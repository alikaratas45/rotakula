"use client";

import Image from 'next/image';
import { APIProvider } from '@vis.gl/react-google-maps';
import EmbeddedMap from '@/components/map';
import { getImageById } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import { useState, useRef, useCallback } from 'react';
import { streamFlow } from '@genkit-ai/next/client';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { PlayIcon, PauseIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

// Web Audio API helper
class StreamingAudioPlayer {
  private audioContext: AudioContext | null = null;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private startTime = 0;
  private onFinishedCallback: (() => void) | null = null;

  constructor(onFinished: () => void) {
    this.onFinishedCallback = onFinished;
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
      });
    }
  }

  private async decodeAndSchedule(chunk: ArrayBuffer) {
    if (!this.audioContext) return;
    try {
        const audioBuffer = await this.audioContext.decodeAudioData(chunk);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;
        if (currentTime < this.startTime) {
            source.start(this.startTime);
            this.startTime += audioBuffer.duration;
        } else {
            source.start(currentTime);
            this.startTime = currentTime + audioBuffer.duration;
        }

        this.sourceNodes.push(source);
        source.onended = () => {
            this.sourceNodes = this.sourceNodes.filter(s => s !== source);
            if (this.sourceNodes.length === 0) {
                this.onFinishedCallback?.();
            }
        };
    } catch (e) {
        console.error("Error decoding audio data", e);
    }
  }

  public playChunk(base64Chunk: string) {
    // Convert base64 to ArrayBuffer
    const binaryString = window.atob(base64Chunk);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // The received data is raw PCM, we need to wrap it in a WAV header to be decoded.
    const wavHeader = this.createWavHeader(bytes.length);
    const wavBytes = new Uint8Array(wavHeader.length + bytes.length);
    wavBytes.set(wavHeader, 0);
    wavBytes.set(bytes, wavHeader.length);

    this.decodeAndSchedule(wavBytes.buffer);
  }

  public pause() {
    if (!this.audioContext) return;
    this.audioContext.suspend();
  }

  public resume() {
    if (!this.audioContext) return;
    this.audioContext.resume();
  }

  public stop() {
    this.sourceNodes.forEach(source => source.stop());
    this.sourceNodes = [];
    if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().then(() => {
             this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });
        });
    }
    this.startTime = 0;
  }
  
  // Helper to create a WAV header for raw PCM data
  private createWavHeader(dataLength: number): Uint8Array {
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);
      const fileSize = 36 + dataLength;

      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);

      // RIFF identifier
      this.writeString(view, 0, 'RIFF');
      // file length
      view.setUint32(4, fileSize, true);
      // RIFF type
      this.writeString(view, 8, 'WAVE');
      // format chunk identifier
      this.writeString(view, 12, 'fmt ');
      // format chunk length
      view.setUint32(16, 16, true);
      // sample format (raw)
      view.setUint16(20, 1, true);
      // channel count
      view.setUint16(22, numChannels, true);
      // sample rate
      view.setUint32(24, sampleRate, true);
      // byte rate (sample rate * block align)
      view.setUint32(28, byteRate, true);
      // block align (channel count * bytes per sample)
      view.setUint16(32, blockAlign, true);
      // bits per sample
      view.setUint16(34, bitsPerSample, true);
      // data chunk identifier
      this.writeString(view, 36, 'data');
      // data chunk length
      view.setUint32(40, dataLength, true);

      return new Uint8Array(buffer);
  }

  private writeString(view: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
      }
  }
}


export default function PoiClientPage({ poi }: { poi: PointOfInterest }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
    const heroImage = getImageById(poi.imageId);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const playerRef = useRef<StreamingAudioPlayer | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { toast } = useToast();

    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (playerRef.current) {
            playerRef.current.stop();
            playerRef.current = null;
        }
        setIsPlaying(false);
        setIsGenerating(false);
    }, []);

    const handlePlayPause = useCallback(async () => {
        if (isPlaying) {
            playerRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        if (!isPlaying && playerRef.current) {
            playerRef.current.resume();
            setIsPlaying(true);
            return;
        }
        
        cleanup();
        setIsGenerating(true);

        try {
            abortControllerRef.current = new AbortController();
            const newPlayer = new StreamingAudioPlayer(() => {
                cleanup();
            });
            playerRef.current = newPlayer;

            const stream = await streamFlow({
                flow: textToSpeech,
                input: poi.longDescription,
                signal: abortControllerRef.current.signal,
            });

            let firstChunkReceived = false;
            const reader = stream.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              const chunk = decoder.decode(value);
              if (!firstChunkReceived) {
                setIsGenerating(false);
                setIsPlaying(true);
                firstChunkReceived = true;
              }
              newPlayer.playChunk(chunk);
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Failed to stream or play audio", error);
                toast({
                    title: "Ses Hatası",
                    description: "Sesli anlatım oluşturulurken bir hata oluştu.",
                    variant: "destructive"
                });
            }
            cleanup();
        }
    }, [poi.longDescription, isPlaying, cleanup, toast]);

     const handleStop = useCallback(() => {
        cleanup();
    }, [cleanup]);

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
                                    onClick={isPlaying ? handleStop : handlePlayPause}
                                    disabled={isGenerating}
                                    aria-label={isPlaying ? "Anlatımı durdur" : "Anlatımı dinle"}
                                >
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isPlaying ? (
                                        <PauseIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <PlayIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {isGenerating ? 'Hazırlanıyor...' : isPlaying ? 'Durdur' : 'Sesli Dinle'}
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
