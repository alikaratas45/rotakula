
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if the splash screen has already been shown in this session
    const hasBeenShown = sessionStorage.getItem('splashScreenShown');
    if (hasBeenShown) {
      setIsVisible(false);
      return;
    }

    // If not shown, make it visible and set the flag in session storage
    setIsVisible(true);
    sessionStorage.setItem('splashScreenShown', 'true');

    // Hide splash screen after a delay
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1200); // Start fading after 1.2 seconds

    const visibilityTimer = setTimeout(() => {
        setIsVisible(false);
    }, 1700); // Completely hide after 1.7 seconds

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
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ease-in-out",
        isFading ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="text-center animate-fade-in-up perspective-1000">
        <div className="preserve-3d">
             <Image
                src="https://i.imgur.com/PS0UgvO.png"
                alt="RotaKula Logo"
                width={200}
                height={200}
                priority
                className="animate-spin-slow"
            />
        </div>
      </div>
    </div>
  );
}
