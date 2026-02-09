
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
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RotaKula',
  },
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body 
        className={cn('font-body antialiased', ptSans.variable, playfairDisplay.variable)}
      >
        <div className="relative min-h-screen flex flex-col lg:max-w-7xl lg:mx-auto lg:shadow-2xl">
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
