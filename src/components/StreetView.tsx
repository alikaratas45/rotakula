
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
      const panorama = new google.maps.StreetViewPanorama(containerRef.current!, {
        position: { lat: latitude, lng: longitude },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
        addressControl: false,
        showRoadLabels: true,
        motionTracking: true,
        motionTrackingControl: true,
      });

      // Check if street view is available at this location
      const svService = new google.maps.StreetViewService();
      svService.getPanorama({ location: { lat: latitude, lng: longitude }, radius: 50 }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK) {
          setIsLoading(false);
        } else {
          setError("Sokak Görünümü bu konum için henüz mevcut değil.");
          setIsLoading(false);
        }
      });
    };

    if (window.google && window.google.maps) {
      initializeStreetView();
    } else {
      const timer = setTimeout(() => {
        if (window.google && window.google.maps) {
          initializeStreetView();
        } else {
          setError("Harita servisi yüklenemedi.");
          setIsLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className="h-80 w-full flex items-center justify-center bg-muted rounded-lg text-muted-foreground p-4 text-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full rounded-lg overflow-hidden border">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
