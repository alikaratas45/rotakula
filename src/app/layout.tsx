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
        {/* Left background image for wide screens */}
        <div className="fixed left-0 top-0 z-0 h-full w-[25vw] bg-left-image bg-cover bg-no-repeat opacity-40 dark:opacity-30 lg:block hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-background/60 to-background"></div>
        </div>
        {/* Right background image for wide screens */}
        <div className="fixed right-0 top-0 z-0 h-full w-[25vw] bg-right-image bg-cover bg-no-repeat opacity-40 dark:opacity-30 lg:block hidden">
          <div className="h-full w-full bg-gradient-to-l from-transparent via-background/60 to-background"></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex flex-col bg-transparent">
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
