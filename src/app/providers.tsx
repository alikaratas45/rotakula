
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
            <div className="flex flex-col items-center gap-4">
                 <Image src="/logo.png" alt="RotaKula Logo" width={100} height={100} className="h-24 w-24 mb-4" />
                 <h1 className="text-2xl font-headline font-bold">RotaKula</h1>
                 <p className="text-muted-foreground">Kula'nın dijital rehberine hoş geldiniz.</p>
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
