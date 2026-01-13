
"use client"

import { type PropsWithChildren, useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';
import SplashScreen from '@/components/splash-screen';


function AppContent({ children }: PropsWithChildren) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen isVisible={true} />;
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
