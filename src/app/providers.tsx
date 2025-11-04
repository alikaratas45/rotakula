
"use client"

import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from 'next-themes';
import { usePathname } from 'next/navigation';

function AppBody({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); 

    return () => clearTimeout(timer);
  }, []);

  // Do not show splash screen on initial load for faster perceived performance
  // on subsequent page loads.
  useEffect(() => {
    if (pathname) {
      setLoading(false);
    }
  }, [pathname]);

  if (loading) {
    return <SplashScreen />;
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
