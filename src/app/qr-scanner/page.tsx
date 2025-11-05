"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrReader } from 'react-qr-reader';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CameraOff, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


export default function QRScannerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { translations } = useLanguage();
    const [error, setError] = useState<string | null>(null);

    const handleScanResult = (result: any, error: any) => {
        if (!!result) {
            try {
                const url = new URL(result?.text);
                 // Sadece bu uygulamaya ait URL'leri kabul et
                if (url.hostname === window.location.hostname) {
                    router.push(url.pathname + url.search + url.hash);
                } else {
                     toast({
                        variant: 'destructive',
                        title: translations.qrScanner.invalidCodeTitle,
                        description: translations.qrScanner.invalidCodeDescription,
                    });
                }
            } catch (e) {
                 toast({
                    variant: 'destructive',
                    title: translations.qrScanner.invalidCodeTitle,
                    description: translations.qrScanner.invalidCodeDescription,
                });
            }
        }

        if (!!error) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                setError(translations.qrScanner.permissionDenied);
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                setError(translations.qrScanner.noCameraFound);
            } else if (error.name !== "ReaderException") { // Okuma hatalarını yoksay
                setError(translations.qrScanner.genericError);
                console.error("QR Reader Error:", error);
            }
        }
    };

    return (
        <div className="container py-8 md:py-12 flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-6 w-6" />
                        <span>{translations.qrScanner.title}</span>
                    </CardTitle>
                    <CardDescription>{translations.qrScanner.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full aspect-square rounded-md overflow-hidden border">
                         {error ? (
                            <div className="bg-destructive text-destructive-foreground p-4 h-full flex flex-col items-center justify-center text-center">
                                <CameraOff className="h-12 w-12 mb-4" />
                                <AlertTitle className="font-bold">{translations.toast.errorTitle}</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </div>
                        ) : (
                            <QrReader
                                constraints={{ facingMode: 'environment' }}
                                onResult={handleScanResult}
                                containerStyle={{ width: '100%', height: '100%' }}
                                videoContainerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
                                videoStyle={{ objectFit: 'cover' }}
                            />
                        )}
                        {/* Köşeler için çerçeve */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-white/80 rounded-tl-lg"></div>
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-white/80 rounded-tr-lg"></div>
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-white/80 rounded-bl-lg"></div>
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-white/80 rounded-br-lg"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
