
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useApp } from "@/context/app-context";

interface StreetViewProps {
  latitude: number;
  longitude: number;
}

export default function StreetView({ latitude, longitude }: StreetViewProps) {
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
      
      // Arama parametreleri: 
      // - 1000 metre yarıçap (daha geniş alan taraması)
      // - google.maps.StreetViewSource.DEFAULT (Hem Google hem de kullanıcıların yüklediği 360 görselleri içerir)
      svService.getPanorama({ 
        location: { lat: latitude, lng: longitude }, 
        radius: 1000,
        source: google.maps.StreetViewSource.DEFAULT
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
          // Bulunan en yakın 360 görselde panoramayı başlat
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

    // API'nin hazır olmasını bekle
    const timer = setTimeout(initializeStreetView, 500);
    return () => clearTimeout(timer);
  }, [latitude, longitude, translations]);

  if (error) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-muted rounded-lg text-muted-foreground p-6 text-center border border-dashed">
        <p className="max-w-[250px]">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full rounded-lg overflow-hidden border shadow-inner bg-black">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs font-medium text-muted-foreground">{translations.map.loading}</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
