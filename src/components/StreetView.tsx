
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Button } from "./ui/button";

interface StreetViewProps {
  latitude: number;
  longitude: number;
  onClose?: () => void;
}

export default function StreetView({ latitude, longitude, onClose }: StreetViewProps) {
  const { translations } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const initializeStreetView = () => {
      if (!window.google || !window.google.maps) {
        setError("Harita servisi yüklenemedi.");
        setIsLoading(false);
        return;
      }

      const svService = new google.maps.StreetViewService();
      
      // 1000 metre yarıçap ve Photosphere (kullanıcı görselleri) desteği
      svService.getPanorama({ 
        location: { lat: latitude, lng: longitude }, 
        radius: 1000,
        source: google.maps.StreetViewSource.DEFAULT
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
          new google.maps.StreetViewPanorama(containerRef.current!, {
            position: data.location.latLng,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            motionTracking: true,
            motionTrackingControl: true,
            clickToGo: true,
          });
          setIsLoading(false);
        } else {
          const msg = translations.map.noStreetView || "Bu konum için yakınlarda 360 derece görüntü bulunamadı.";
          setError(msg);
          setIsLoading(false);
        }
      });
    };

    const timer = setTimeout(initializeStreetView, 500);
    return () => clearTimeout(timer);
  }, [latitude, longitude, translations]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="absolute top-4 right-4 z-[110] flex gap-2">
         <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
            className="rounded-full shadow-lg bg-white/90 hover:bg-white text-black font-bold"
          >
            <X className="mr-2 h-4 w-4" />
            {translations.common.close}
          </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <span className="text-sm font-medium">{translations.map.loading}</span>
        </div>
      )}

      {error ? (
        <div className="flex-grow flex items-center justify-center p-6 text-center text-white bg-neutral-900">
          <div className="max-w-xs">
            <p className="mb-6 text-lg">{error}</p>
            <Button variant="outline" onClick={onClose} className="text-white border-white hover:bg-white hover:text-black">
                {translations.common.back}
            </Button>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
    </div>
  );
}
