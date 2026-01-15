
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const { translations } = useApp();

  useEffect(() => {
    // Hide splash screen after a delay
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000); // Start fading after 2 seconds

    const visibilityTimer = setTimeout(() => {
        setIsVisible(false);
    }, 2500); // Completely hide after 2.5 seconds

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(visibilityTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out",
        isFading ? "opacity-50" : "opacity-100"
      )}
    >
      <div className="text-center animate-fade-in-up perspective-1000">
        <div className="preserve-3d">
             <Image
                src="/belediye.png"
                alt="Kula Belediyesi Logo"
                width={700}
                height={700}
                priority
                className="animate-spin-slow"
            />
        </div>
      </div>
    </div>
  );
}
