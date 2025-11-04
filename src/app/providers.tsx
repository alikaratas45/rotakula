
"use client"

import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { type PropsWithChildren, useState, useEffect } from 'react';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4 perspective-1000">
                 <Image src="/logo.png" alt="RotaKula Logo" width={400} height={400} className="h-48 w-48 mb-4 animate-spin-slow preserve-3d" />
                 <p className="text-2xl text-foreground text-center">Kula'nın dijital rehberine hoş geldiniz.</p>
            </div>
        </div>
    )
}


function AppBody({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
        setAnimationClass('animate-fade-out');
        setTimeout(() => setLoading(false), 500); // Wait for fade out to complete
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
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Toaster />
    </>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        <AppBody>{children}</AppBody>
      </LanguageProvider>
    </ThemeProvider>
  );
}
