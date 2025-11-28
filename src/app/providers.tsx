

"use client"

import { type PropsWithChildren, useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import IntroTour from '@/components/intro-tour';

function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4 perspective-1000">
                 <Image 
                    src="/belediye.png" 
                    alt="Kula Belediyesi Logo" 
                    width={400} 
                    height={400} 
                    priority
                    unoptimized
                    className="h-96 w-96 mb-4 animate-spin-slow preserve-3d" 
                  />
                 <p className="text-2xl text-foreground text-center">Kula'nın dijital rehberine hoş geldiniz.</p>
            </div>
        </div>
    )
}

export function Providers({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
        // Wait for fade out to complete before removing the splash screen
        setTimeout(() => setLoading(false), 500); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
      return (
        <div className={cn("fixed inset-0 bg-background z-[100]", animationClass)}>
            <SplashScreen />
        </div>
      );
  }

  return (
    <>
        <IntroTour />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
    </>
  );
}
