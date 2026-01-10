
"use client"

import { type PropsWithChildren } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import IntroTour from '@/components/intro-tour';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';


function AppContent({ children }: PropsWithChildren) {
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
