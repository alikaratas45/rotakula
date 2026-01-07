
"use client"

import { type PropsWithChildren } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import IntroTour from '@/components/intro-tour';
import { ThemeProvider } from 'next-themes';


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
