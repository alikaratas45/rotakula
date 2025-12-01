
'use client';

import { useApp } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ContentAdminPage() {
  const { isAdmin, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isUserLoading, router]);

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">İçerik Yönetimi</h1>
          <p className="text-muted-foreground">QR kodlar için dinamik içerikleri yönetin.</p>
        </div>
      </div>

       <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50">
        <CardHeader className="flex flex-row items-center gap-4">
            <TriangleAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            <div>
                <CardTitle className="text-yellow-800 dark:text-yellow-300">Özellik Bakımda</CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-400/80">
                    Bu özellik, daha stabil ve güvenilir bir deneyim sunmak için geçici olarak devre dışı bırakılmıştır. Anlayışınız için teşekkür ederiz.
                </CardDescription>
            </div>
        </CardHeader>
      </Card>
      
    </div>
  );
}
