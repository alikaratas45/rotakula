"use client"

import { type PropsWithChildren, useEffect } from 'react';
import Image from 'next/image';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
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
        <main className="flex-grow animate-fade-in">{children}</main>
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
      <AppContent>{children}</AppContent>
    </ThemeProvider>
  );
}
