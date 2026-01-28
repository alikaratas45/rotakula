import './globals.css';
import { cn } from '@/lib/utils';
import { type PropsWithChildren } from 'react';
import { AppProvider } from '@/context/app-context';
import { Providers } from '@/app/providers';
import { FirebaseClientProvider } from '@/firebase';
import { ptSans, playfairDisplay } from './fonts';


export const metadata = {
  title: 'Kula Gezi Rehberi | Volkanik Toprakları ve Tarihi Evleri Keşfedin',
  description: "Türkiye'nin ilk ve tek UNESCO Global Jeoparkı'na ev sahipliği yapan Manisa Kula'yı keşfedin. Tarihi Kula evleri, Kuladokya peri bacaları, volkanik parkurlar ve yöresel lezzetler için en kapsamlı mobil gezi rehberi.",
  manifest: '/manifest.json',
  icons: {
    icon: 'https://i.imgur.com/PS0UgvO.png',
    apple: 'https://i.imgur.com/PS0UgvO.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#4E342E" />
      </head>
      <body 
        className={cn('font-body antialiased', ptSans.variable, playfairDisplay.variable)}
      >
        {/* Left background image for wide screens. Sits behind everything. */}
        <div className="fixed left-0 top-0 -z-10 h-full w-1/2 bg-left-image bg-cover bg-no-repeat opacity-15 dark:opacity-10 lg:block hidden" />
        
        {/* Right background image for wide screens. Sits behind everything. */}
        <div className="fixed right-0 top-0 -z-10 h-full w-1/2 bg-right-image bg-cover bg-no-repeat opacity-15 dark:opacity-10 lg:block hidden" />
        
        {/* This is the main content container. It has the solid background and is centered. */}
        <div className="relative min-h-screen flex flex-col bg-background lg:max-w-7xl lg:mx-auto lg:shadow-2xl">
            <FirebaseClientProvider>
              <AppProvider>
                <Providers>{children}</Providers>
              </AppProvider>
            </FirebaseClientProvider>
        </div>
      </body>
    </html>
  );
}
