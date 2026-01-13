
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

  return (
    <>
        {showSplash && <SplashScreen />}
        <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
        </div>
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
