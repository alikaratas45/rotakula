
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X, Compass } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Button } from "./ui/button";

interface StreetViewProps {
  latitude: number;
  longitude: number;
  onClose?: () => void;
  isHistoricRoute?: boolean;
}

export default function StreetView({ latitude, longitude, onClose, isHistoricRoute }: StreetViewProps) {
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
      
      // Define search radius based on route type
      const searchRadius = isHistoricRoute ? 10 : 1000;
      
      svService.getPanorama({ 
        location: { lat: latitude, lng: longitude }, 
        radius: searchRadius,
        source: google.maps.StreetViewSource.DEFAULT
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data && data.location && data.location.latLng) {
          const panorama = new google.maps.StreetViewPanorama(containerRef.current!, {
            position: data.location.latLng,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            motionTracking: true, // Telefon hareketine göre bakış açısını değiştirir
            motionTrackingControl: true, // Kullanıcıya jiroskopu açma/kapama ikonu gösterir
            clickToGo: true,
            fullscreenControl: false,
            panControl: false,
          });
          setIsLoading(false);
        } else {
          // Specific error message for historic route within 10m
          const msg = isHistoricRoute 
            ? "Bu bölgede sokak görünümü yok." 
            : (translations.map.noStreetView || "Bu konum için yakınlarda 360 derece görüntü bulunamadı.");
          setError(msg);
          setIsLoading(false);
        }
      });
    };

    // DOM'un hazır olduğundan emin olmak için kısa bir gecikme
    const timer = setTimeout(initializeStreetView, 500);
    return () => clearTimeout(timer);
  }, [latitude, longitude, translations, isHistoricRoute]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden touch-none">
      {/* Üst Bar */}
      <div className="absolute top-0 left-0 right-0 z-[210] p-4 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <Compass className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-black uppercase tracking-wider">Sanal Tur Aktif</span>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={onClose}
          className="rounded-full shadow-lg bg-white/90 hover:bg-white text-black font-bold h-10 px-4"
        >
          <X className="mr-2 h-5 w-5" />
          {translations.common.close}
        </Button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <span className="text-sm font-medium tracking-widest uppercase">{translations.map.loading}</span>
        </div>
      )}

      {error ? (
        <div className="flex-grow flex items-center justify-center p-6 text-center text-white bg-neutral-900">
          <div className="max-w-xs">
            <p className="mb-6 text-lg font-medium leading-relaxed">{error}</p>
            <Button variant="outline" onClick={onClose} className="text-white border-white hover:bg-white hover:text-black w-full py-6">
                {translations.common.back}
            </Button>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full" />
      )}
      
      {/* Hareket Bildirimi (Sadece yüklendiğinde kısa süreli görünür) */}
      {!isLoading && !error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[210] pointer-events-none animate-fade-out animation-delay-3000">
          <div className="bg-black/50 backdrop-blur-md text-white text-[10px] px-4 py-2 rounded-full border border-white/20 uppercase tracking-widest">
            Etrafınıza bakmak için telefonu döndürün
          </div>
        </div>
      )}
    </div>
  );
}
