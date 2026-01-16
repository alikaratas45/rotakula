"use client"

import { type PropsWithChildren, useEffect } from 'react';
import Image from 'next/image';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';
import SplashScreen from '@/components/splash-screen';


function AppContent({ children }: PropsWithChildren) {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'http:' &&
      process.env.NODE_ENV === 'production'
    ) {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }, []);

  return (
    <>
        <SplashScreen />
        <Header />
        <div className="hidden md:block fixed top-16 left-4 z-50">
            <Image src="/belediye.png" alt="Kula Belediyesi Logosu" width={100} height={100} />
        </div>
        <main className="flex-grow animate-fade-in">{children}</main>
        <Footer />
        <Toaster />
    </>
  );
}


export function Providers({ children }: PropsWithChildren) {
  const { language } = useApp();
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AppContent key={language}>{children}</AppContent>
    </ThemeProvider>
  );
}
