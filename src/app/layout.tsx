"use client"

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useEffect, useState, useRef } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { haversineDistance } from '@/lib/utils';
import { ProximityDialog } from '@/components/proximity-dialog';
import { textToSpeech } from '@/ai/flows/tts-flow';

const PROXIMITY_THRESHOLD = 50; // meters
const LOCATION_CHECK_INTERVAL = 10000; // 10 seconds

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyPoi, setNearbyPoi] = useState<PointOfInterest | null>(null);
  const [triggeredPois, setTriggeredPois] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all POIs on initial load
  useEffect(() => {
    async function fetchPois() {
      const allPois = await getPois();
      setPois(allPois);
    }
    fetchPois();
  }, []);

  // Set up interval for location checking
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Could not get user location:", error.message);
        setUserLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Check for nearby POIs when user location changes
  useEffect(() => {
    if (userLocation && pois.length > 0 && !nearbyPoi && !isGenerating) {
      for (const poi of pois) {
        if (triggeredPois.has(poi.id)) {
          continue; // Skip if already triggered
        }

        const distance = haversineDistance(
          { lat: userLocation.lat, lon: userLocation.lng },
          { lat: poi.latitude, lon: poi.longitude }
        );

        if (distance < PROXIMITY_THRESHOLD) {
          setNearbyPoi(poi);
          setTriggeredPois(prev => new Set(prev).add(poi.id));
          break; // Found a nearby POI, stop checking
        }
      }
    }
  }, [userLocation, pois, nearbyPoi, triggeredPois, isGenerating]);


  const handlePlayAudio = async () => {
    if (!nearbyPoi) return;

    setIsGenerating(true);
    try {
      const { media } = await textToSpeech(nearbyPoi.description);
      if (media) {
        if (audioRef.current) {
          audioRef.current.src = media;
        } else {
          audioRef.current = new Audio(media);
        }
        audioRef.current.play();
        audioRef.current.onended = () => {
          // Reset states after audio finishes
          setNearbyPoi(null); 
        };
      }
    } catch (error) {
      console.error("Failed to generate or play audio", error);
    } finally {
      setIsGenerating(false);
      // Close dialog immediately after trying to play
      if (nearbyPoi) setNearbyPoi(null); 
    }
  };
  
  const handleCloseDialog = () => {
    setNearbyPoi(null);
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>RotaKula - Kula Gezi Rehberi</title>
        <meta name="description" content="Manisa'nın Kula ilçesine özel tematik seyahat rotalarını, tarihi yerleri, doğal güzellikleri ve yöresel lezzetleri keşfedin." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4E342E" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        {loading ? (
          <SplashScreen />
        ) : (
          <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
            <ProximityDialog
              poi={nearbyPoi}
              isGenerating={isGenerating}
              onConfirm={handlePlayAudio}
              onCancel={handleCloseDialog}
            />
          </>
        )}
      </body>
    </html>
  );
}
