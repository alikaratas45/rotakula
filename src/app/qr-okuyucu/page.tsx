
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult, Html5QrcodeScanType } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/app-context";
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
  const { translations } = useApp();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScannerInitialized = useRef(false);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    if (typeof window === "undefined" || isScannerInitialized.current) {
        return;
    }
    
    isScannerInitialized.current = true;

    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;


    const onSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().then(() => {
                console.log(`Scan result: ${decodedText}`, decodedResult);
                
                // This is a much more robust check. It doesn't rely on full URL parsing.
                // It just looks for the essential part of our content path.
                const contentPathIndex = decodedText.indexOf('/content/');

                if (contentPathIndex > -1) {
                    const path = decodedText.substring(contentPathIndex);
                    router.push(`${path}?autoplay=true`);
                } else {
                    setErrorMessage("Geçersiz QR Kod. Lütfen sadece bu uygulamaya ait ve bir içerik sayfasına yönlendiren bir kod tarayın.");
                }

            }).catch(err => console.error("Failed to stop scanner", err));
        }
    };

    const onError = (error: Html5QrcodeError) => {
      if (error.message.includes("QR code not found")) {
        return;
      }
      console.warn(`QR error: ${error.message}`);
    };

    const startScanner = async () => {
      if (!scannerRef.current || scannerRef.current.isScanning) {
          return;
      }
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: qrboxFunction,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          },
          onSuccess,
          onError
        );
         setErrorMessage(null);
      } catch (err: any) {
        console.error("Failed to start scanner", err);
        let userFriendlyMessage = "Kamera başlatılırken bir hata oluştu. Lütfen başka bir uygulamanın kamerayı kullanmadığından emin olun.";
        if (err.name === 'NotAllowedError') {
            userFriendlyMessage = "Kamera erişimine izin vermeniz gerekiyor. Lütfen tarayıcı ayarlarınızı kontrol edin.";
        } else if (err.name === 'NotReadableError') {
            userFriendlyMessage = "Kamera şu anda kullanılamıyor. Başka bir uygulama veya sekme tarafından kullanılıyor olabilir veya donanımsal bir sorun olabilir.";
        } else if (err.message.includes("already under transition")) {
            console.warn("Scanner transition error ignored.");
            return;
        }
        setErrorMessage(userFriendlyMessage);
      }
    };
    
    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on cleanup", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container px-4 py-8 md:py-12">
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

