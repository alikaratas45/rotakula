
"use client"

import { type PropsWithChildren, useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';
import SplashScreen from '@/components/splash-screen';
import { cn } from '@/lib/utils';


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

  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    // We use a timer to hide the splash screen and show the content.
    // This ensures the initial server render and client render are identical.
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 2000); // Keep splash for 2 seconds

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SplashScreen isVisible={isSplashVisible} />
      <div className={cn("transition-opacity duration-500", isSplashVisible ? "opacity-0" : "opacity-100")}>
        <AppContent key={language}>{children}</AppContent>
      </div>
    </ThemeProvider>
  );
}
