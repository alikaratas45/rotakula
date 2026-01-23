
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
  keywords: "Kula, Kula Gezi Rehberi, Kula Jeoparkı, Tarihi Kula Evleri, Manisa Kula, Kuladokya, Kula volkanik, Kula'da gezilecek yerler",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png?v=3',
    apple: '/logo.png?v=3',
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
      <body className={cn('font-body antialiased min-h-screen flex flex-col', ptSans.variable, playfairDisplay.variable)}>
        <FirebaseClientProvider>
          <AppProvider>
            <Providers>{children}</Providers>
          </AppProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
