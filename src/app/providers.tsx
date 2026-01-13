"use client"

import { type PropsWithChildren, useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';
import SplashScreen from '@/components/splash-screen';


function AppContent({ children }: PropsWithChildren) {
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
  const { language } = useApp();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // This will only run on the client, after hydration.
  useEffect(() => {
    // The CSS animation will handle the timing, but we'll remove the component
    // from the DOM after the animation is well and truly over to be safe.
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2800); // Animation is 2.5s total, 3s gives a buffer.

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {isSplashVisible && <SplashScreen isVisible={true} />}
      <AppContent key={language}>{children}</AppContent>
    </ThemeProvider>
  );
}
