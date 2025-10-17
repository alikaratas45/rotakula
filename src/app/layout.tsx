"use client"

import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useEffect, useState } from 'react';
import { SplashScreen } from '@/components/splash-screen';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>RotaKula - Kula Gezi Rehberi</title>
        <meta name="description" content="Manisa'nın Kula ilçesine özel tematik seyahat rotalarını, tarihi yerleri, doğal güzellikleri ve yöresel lezzetleri keşfedin." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4E342E" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        {loading ? (
          <SplashScreen />
        ) : (
          <>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
          </>
        )}
      </body>
    </html>
  );
}
