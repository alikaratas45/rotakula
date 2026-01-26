
"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult, Html5QrcodeScanType } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, ShieldAlert } from "lucide-react";
import { BackButton } from "@/components/back-button";

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
                
                // Check if the scanned text is a valid relative path for the app
                // It should start with a '/' and not contain a full domain.
                if (decodedText && decodedText.startsWith("/") && !decodedText.includes('//')) {
                    const destinationPath = `${decodedText}?autoplay=true`;
                    router.push(destinationPath);
                } else {
                   setErrorMessage(translations.qrScanner.invalidQrCode);
                }

            }).catch(err => console.error("Failed to stop scanner", err));
        }
    };

    const onError = (error: Html5QrcodeError) => {
      // Ignore "QR code not found" errors, as they are very frequent.
      if (error.message.includes("QR code not found")) {
        return;
      }
      // Log other warnings to the console, but don't show to the user unless it's a critical failure.
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
        let userFriendlyMessage = translations.qrScanner.cameraError;
        if (err.name === 'NotAllowedError') {
            userFriendlyMessage = translations.qrScanner.cameraPermissionError;
        } else if (err.name === 'NotReadableError') {
            userFriendlyMessage = translations.qrScanner.cameraNotReadableError;
        } else if (err.message && err.message.includes("already under transition")) {
            // This is a known benign error in the library, ignore it.
            console.warn("Scanner transition error ignored.");
            return;
        }
        setErrorMessage(userFriendlyMessage);
      }
    };
    
    // Check for camera permissions before attempting to start.
    Html5Qrcode.getCameras().then(cameras => {
        if (cameras && cameras.length) {
            startScanner();
        } else {
            setErrorMessage(translations.qrScanner.noCameraFound);
        }
    }).catch(err => {
        // This catch block is crucial for permission denied errors.
        setErrorMessage(translations.qrScanner.cameraAccessDenied);
    });


    // Cleanup function to stop the scanner when the component unmounts.
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
            // It's possible the scanner is already stopped or in the process of stopping.
            // Log this as a warning instead of an error to avoid console noise.
            console.warn("Failed to stop scanner on cleanup, possibly because it was already stopped.", err)
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container px-4 py-8 md:py-12">
      <BackButton className="mb-8" />
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
