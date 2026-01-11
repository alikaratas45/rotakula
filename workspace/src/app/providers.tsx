
"use client"

import { type PropsWithChildren, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from 'next-themes';
import { useApp } from '@/context/app-context';


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
  
  // Force a re-render when the language changes to update the entire component tree
  // with the new translations. This is a workaround for Next.js app router behavior.
  const [key, setKey] = useEffect(String(Date.now()));
  useEffect(() => {
    setKey(String(Date.now()));
  }, [language]);


  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AppContent key={key}>{children}</AppContent>
    </ThemeProvider>
  );
}
