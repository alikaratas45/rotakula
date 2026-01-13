"use client"

import { type PropsWithChildren, useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';
import { SplashScreen } from '@/components/splash-screen';


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
  const [isSplashActive, setIsSplashActive] = useState(true);

  useEffect(() => {
    // This effect runs only once on the client after hydration
    const timer = setTimeout(() => {
      setIsSplashActive(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SplashScreen isActive={isSplashActive} />
      {!isSplashActive && <AppContent key={language}>{children}</AppContent>}
    </ThemeProvider>
  );
}
