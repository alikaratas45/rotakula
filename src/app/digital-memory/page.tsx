
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const frames = [
    { src: "/frames/kula-geopark.png", name: "UNESCO Global Geopark" },
    { src: "/frames/kula-houses.png", name: "Tarihi Evler" },
    { src: "/frames/kula-peribacalari.png", name: "Peri Bacaları" },
    { src: "/frames/kula-volcanic.png", name: "Volkanik Park" },
];

export default function DigitalMemoryPage() {
    const { translations } = useLanguage();
    const { toast } = useToast();
    const [photo, setPhoto] = useState<string | null>(null);
    const [selectedFrame, setSelectedFrame] = useState<string>(frames[0].src);
    const [mergedImage, setMergedImage] = useState<string | null>(null);
    const [isMerging, setIsMerging] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setPhoto(reader.result as string);
            setMergedImage(null); // Yeni fotoğraf yüklendiğinde birleştirilmiş resmi temizle
        };
        reader.readAsDataURL(file);
    };

    const mergePhoto = useCallback(() => {
        if (!canvasRef.current || !photo) return;
        setIsMerging(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setIsMerging(false);
            return;
        }

        const photoImg = new window.Image();
        photoImg.src = photo;
        
        photoImg.onload = () => {
            const frameImg = new window.Image();
            frameImg.src = selectedFrame;
            frameImg.crossOrigin = "anonymous"; // CORS hatalarını önlemek için

            frameImg.onload = () => {
                // Fotoğrafın en-boy oranını koruyarak canvas'ı ayarla
                const maxCanvasWidth = 1080;
                const scale = Math.min(maxCanvasWidth / photoImg.width, 1);
                canvas.width = photoImg.width * scale;
                canvas.height = photoImg.height * scale;

                // Fotoğrafı çiz
                ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);

                // Çerçeveyi üstüne ekle
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

                setMergedImage(canvas.toDataURL("image/png"));
                setIsMerging(false);
                toast({
                    title: translations.digitalMemory.toastSuccessTitle,
                    description: translations.digitalMemory.toastSuccessDescription,
                });
            };

            frameImg.onerror = () => {
                setIsMerging(false);
                toast({
                    title: translations.toast.errorTitle,
                    description: translations.digitalMemory.toastErrorDescription,
                    variant: "destructive"
                });
            };
        };

        photoImg.onerror = () => {
            setIsMerging(false);
            toast({
                title: translations.toast.errorTitle,
                description: translations.digitalMemory.toastErrorDescription,
                variant: "destructive"
            });
        };

    }, [photo, selectedFrame, translations, toast]);

    const download = () => {
        if (!mergedImage) return;
        const link = document.createElement("a");
        link.download = "kula-dijital-hatira.png";
        link.href = mergedImage;
        link.click();
    };

    return (
        <div className="container px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.digitalMemory.title}</h1>
                    <p className="text-muted-foreground mt-2">{translations.digitalMemory.subtitle}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{translations.digitalMemory.step1Title}</CardTitle>
                        <CardDescription>{translations.digitalMemory.step1Description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {translations.digitalMemory.uploadButton}
                        </Button>
                    </CardContent>
                </Card>

                {photo && (
                    <>
                        <Card>
                             <CardHeader>
                                <CardTitle>{translations.digitalMemory.step2Title}</CardTitle>
                                <CardDescription>{translations.digitalMemory.step2Description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full aspect-square max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center">
                                    <Image src={photo} alt="Yüklenen fotoğraf" layout="fill" objectFit="contain" className="rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle>{translations.digitalMemory.step3Title}</CardTitle>
                                <CardDescription>{translations.digitalMemory.step3Description}</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {frames.map((f) => (
                                        <button
                                            key={f.src}
                                            onClick={() => setSelectedFrame(f.src)}
                                            className={cn(
                                                "border-2 p-1 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                                                selectedFrame === f.src ? "border-primary" : "border-transparent hover:border-primary/50"
                                            )}
                                        >
                                            <Image src={f.src} alt={f.name} width={150} height={150} className="w-full h-auto aspect-square object-cover rounded-md bg-muted" />
                                            <p className="text-xs font-semibold mt-1 text-center">{f.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Button className="w-full" onClick={mergePhoto} disabled={isMerging}>
                            {isMerging ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {translations.digitalMemory.applyingFrame}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {translations.digitalMemory.applyFrameButton}
                                </>
                            )}
                        </Button>

                        <canvas ref={canvasRef} className="hidden"></canvas>

                        {mergedImage && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{translations.digitalMemory.step4Title}</CardTitle>
                                    <CardDescription>{translations.digitalMemory.step4Description}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <Image src={mergedImage} alt="Çerçeveli hatıra fotoğrafı" width={540} height={540} className="rounded-lg mx-auto border" />
                                </CardContent>
                                <div className="p-6 pt-0">
                                     <Button className="w-full" onClick={download}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {translations.digitalMemory.downloadButton}
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </>
                )}

                 {!photo && (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{translations.digitalMemory.waitingForPhoto}</p>
                    </div>
                 )}
            </div>
        </div>
    );
}

    