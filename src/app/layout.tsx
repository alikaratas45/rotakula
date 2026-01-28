
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
      <body className={cn('font-body antialiased', ptSans.variable, playfairDisplay.variable)}>
        {/* Decorative side backgrounds for wide screens */}
        <div className="hidden xl:block fixed top-0 left-0 w-1/2 h-full -z-10 pointer-events-none">
            <div 
                className="absolute inset-0 bg-cover bg-no-repeat bg-center opacity-10"
                style={{ backgroundImage: "url('https://i.imgur.com/FWZRRu8.jpeg')" }}
            ></div>
            {/* This gradient fades the image into the background color towards the center */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/80 to-background"></div>
        </div>
        <div className="hidden xl:block fixed top-0 right-0 w-1/2 h-full -z-10 pointer-events-none">
            <div 
                className="absolute inset-0 bg-cover bg-no-repeat bg-center opacity-10"
                style={{ backgroundImage: "url('https://i.imgur.com/F82x5w6.jpeg')" }}
            ></div>
            {/* This gradient fades the image into the background color towards the center */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/80 to-background"></div>
        </div>

        {/* Main content wrapper that holds the background color and sits on top of the decorative elements */}
        <div className="relative z-0 min-h-screen flex flex-col bg-background">
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
