
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/app-context';
import { Camera, Download, Loader2, RefreshCw, Sparkles, Smile, ShieldAlert, SwitchCamera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const filters = [
    { src: "/frames/kula-geopark.svg", name: "UNESCO Global Geopark" },
    { src: "/frames/kula-houses.svg", name: "Tarihi Evler" },
    { src: "/frames/kula-peribacalari.svg", name: "Peri Bacaları" },
    { src: "/frames/kula-volcanic.svg", name: "Volkanik Park" },
];

export default function SelfieSpotPage() {
    const { translations } = useApp();
    const { toast } = useToast();

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<string>(filters[0].src);
    const [isProcessing, setIsProcessing] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isPreview, setIsPreview] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

     const stopCameraStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

     const startCameraStream = useCallback(async (mode: 'user' | 'environment') => {
        stopCameraStream();

        if (!navigator.mediaDevices?.getUserMedia) {
            setHasCameraPermission(false);
            toast({
                title: translations.toast.unsupportedTitle,
                description: translations.selfieSpot.cameraUnsupported,
                variant: 'destructive',
            });
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            if (mode === 'environment' && (error as Error).name === 'OverconstrainedError') {
                 toast({
                    variant: 'destructive',
                    title: "Arka Kamera Bulunamadı",
                    description: "Cihazınızda arka kamera bulunmuyor veya erişilemiyor. Ön kameraya geçiliyor.",
                });
                setFacingMode('user'); // Fallback to user camera
            } else {
                toast({
                    variant: 'destructive',
                    title: translations.selfieSpot.cameraAccessDeniedTitle,
                    description: translations.selfieSpot.cameraAccessDenied,
                });
            }
        }
    }, [toast, translations, stopCameraStream]);

    useEffect(() => {
        startCameraStream(facingMode);
        return () => {
            stopCameraStream();
        };
    }, [facingMode, startCameraStream, stopCameraStream]);

    const takeSelfie = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsProcessing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsProcessing(false);
            return;
        }

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        if (facingMode === 'user') {
            ctx.translate(videoWidth, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const filterImg = new window.Image();
        filterImg.src = selectedFilter;
        filterImg.crossOrigin = "anonymous";
        
        filterImg.onload = () => {
            ctx.drawImage(filterImg, 0, 0, videoWidth, videoHeight);
            setSelfie(canvas.toDataURL('image/png'));
            setIsProcessing(false);
            stopCameraStream();
            setIsPreview(true);
        };
        
        filterImg.onerror = () => {
            toast({
                title: translations.toast.errorTitle,
                description: "Çerçeve yüklenirken bir hata oluştu.",
                variant: 'destructive',
            });
            setIsProcessing(false);
        };

    }, [selectedFilter, toast, facingMode, stopCameraStream]);
    
    const downloadSelfie = () => {
        if (!selfie) return;
        const link = document.createElement('a');
        link.download = 'rota-kula-selfie.png';
        link.href = selfie;
        link.click();
    };

    const retakeSelfie = () => {
        setSelfie(null);
        setIsPreview(false);
        startCameraStream(facingMode);
    };

    const toggleFacingMode = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="container px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.selfieSpot.title}</h1>
                    <p className="text-muted-foreground mt-2">{translations.selfieSpot.subtitle}</p>
                </div>

                <div className="relative w-full aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden border">
                    {selfie ? (
                        <Image src={selfie} alt={translations.selfieSpot.selfieAlt} layout="fill" objectFit="contain" />
                    ) : (
                        <>
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : {}} />
                            {selectedFilter && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <Image src={selectedFilter} alt="Filter preview" layout="fill" objectFit="contain" />
                                </div>
                            )}
                            {hasCameraPermission === false && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
                                    <Alert variant="destructive">
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle>{translations.selfieSpot.cameraAccessDeniedTitle}</AlertTitle>
                                        <AlertDescription>{translations.selfieSpot.cameraAccessDenied}</AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {hasCameraPermission && (
                    <div className="space-y-6">
                        {isPreview ? (
                            <div className="grid grid-cols-2 gap-4">
                                <Button size="lg" onClick={retakeSelfie}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {translations.selfieSpot.retake}
                                </Button>
                                <Button size="lg" onClick={downloadSelfie}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {translations.digitalMemory.downloadButton}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <Button size="lg" className="flex-grow" onClick={takeSelfie} disabled={isProcessing}>
                                        {isProcessing ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <Camera className="mr-2 h-5 w-5" />
                                        )}
                                        {translations.selfieSpot.takeSelfie}
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={toggleFacingMode} aria-label="Kamerayı değiştir">
                                        <SwitchCamera className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-center mb-4">{translations.selfieSpot.chooseFilter}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {filters.map((f) => (
                                            <button
                                                key={f.src}
                                                onClick={() => setSelectedFilter(f.src)}
                                                className={cn(
                                                    "border-2 p-1 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                                                    selectedFilter === f.src ? "border-primary" : "border-transparent hover:border-primary/50"
                                                )}
                                            >
                                                <Image src={f.src} alt={f.name} width={150} height={150} className="w-full h-auto aspect-square object-contain rounded-md bg-muted" />
                                                <p className="text-xs font-semibold mt-1 text-center">{f.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
        </div>
    );
}
