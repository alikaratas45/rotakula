
"use client"

import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { type PropsWithChildren } from 'react';
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from 'next-themes';

function AppBody({ children }: PropsWithChildren) {
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
