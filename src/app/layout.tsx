
import './globals.css';
import { cn } from '@/lib/utils';
import { type PropsWithChildren } from 'react';
import { AppProvider } from '@/context/app-context';
import { Providers } from '@/app/providers';
import { FirebaseClientProvider } from '@/firebase';


export const metadata = {
  title: 'RotaKula - Kula Gezi Rehberi',
  description: "Manisa'nın Kula ilçesine özel tematik seyahat rotalarını, tarihi yerleri, doğal güzellikleri ve yöresel lezzetleri keşfedin.",
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
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        <FirebaseClientProvider>
          <AppProvider>
            <Providers>{children}</Providers>
          </AppProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
