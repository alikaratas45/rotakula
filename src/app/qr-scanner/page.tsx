"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult, Html5QrcodeScanType } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
  const qrboxSize = Math.floor(minEdge * 0.7);
  return {
    width: qrboxSize,
    height: qrboxSize,
  };
};

export default function QRScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { translations } = useLanguage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setErrorMessage("Bu cihazda kamera bulunamadı.");
          return;
        }

        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        const onSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
          console.log(`Scan result: ${decodedText}`, decodedResult);
          try {
            const url = new URL(decodedText);
            // Basic security check: ensure it's a relative path or same origin
            if (url.origin === window.location.origin || decodedText.startsWith('/')) {
                router.push(decodedText);
            } else {
                setErrorMessage("Geçersiz QR Kod. Lütfen sadece bu uygulamaya ait kodları tarayın.");
            }
          } catch(e) {
            // If it's not a valid URL, check if it's a relative path
             if (decodedText.startsWith('/')) {
                router.push(decodedText);
             } else {
                setErrorMessage("Geçersiz QR Kod. Lütfen sadece bu uygulamaya ait kodları tarayın.");
             }
          }
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
          }
        };

        const onError = (error: Html5QrcodeError) => {
          // Ignore "QR code not found" errors
          if (!error.message.includes("QR code not found")) {
            console.warn(`QR error: ${error.message}`);
          }
        };

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: qrboxFunction,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          },
          onSuccess,
          onError
        );
      } catch (err: any) {
        console.error("Failed to start scanner", err);
        setErrorMessage(err.message || "Kamera başlatılırken bir hata oluştu.");
      }
    };
    
    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast, translations]);

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
            <QrCode className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.nav.qrScanner}</h1>
        </div>
         <p className="text-muted-foreground mb-8">{translations.qrScanner.description}</p>
        
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-muted">
          <div id={scannerContainerId} className="w-full h-full"></div>
        </div>

        {errorMessage && (
            <Alert variant="destructive" className="mt-6">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{translations.toast.errorTitle}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
