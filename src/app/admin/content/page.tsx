
'use client';

import { useApp } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, Plus, Trash2, BookImage } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { Loader2 } from 'lucide-react';

// Simulating fetching from a JSON file. 
// In a real scenario, this would be an API call.
import mediaData from '@/lib/media-library.json';

type MediaItem = {
  id: string;
  title: string;
  path: string;
};

export default function MediaLibraryPage() {
  const { isAdmin, isUserLoading } = useApp();
  const router = useRouter();
  const [library, setLibrary] = useState<MediaItem[]>(mediaData.media);
  const [newItem, setNewItem] = useState({ title: '', path: '' });

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isUserLoading, router]);

  const handleAddItem = () => {
    // This is a placeholder. In a real app, I would handle the file update.
    alert("Bu özellik şu anda aktif değil. Yeni görsel eklemek için lütfen AI asistana dosya adını ve başlığı bildirin.");
  };

  const handleRemoveItem = (id: string) => {
    // This is a placeholder.
    alert("Bu özellik şu anda aktif değil. Görsel silmek için lütfen AI asistana bildirin.");
  };

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
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3"><BookImage className="h-8 w-8" /> Medya Kütüphanesi</h1>
          <p className="text-muted-foreground">Uygulama görsellerini yönetin.</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>Yeni Görsel Ekle</CardTitle>
            <CardDescription>
                `public` klasörüne eklediğiniz görselin dosya adını (örn: `kula-geopark.jpg`) ve bir başlık girerek kütüphaneye ekleyin.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
            <Input
                placeholder="Görsel Başlığı (örn: Kula Jeoparkı)"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
            />
            <Input
                placeholder="Dosya Yolu (örn: /kula-geopark.jpg)"
                value={newItem.path}
                onChange={(e) => setNewItem({...newItem, path: e.target.value})}
            />
            <Button onClick={handleAddItem} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Kütüphaneye Ekle
            </Button>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Kütüphanedeki Görseller</h2>
        {library.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {library.map((item) => (
                    <Card key={item.id} className="group relative overflow-hidden">
                        <div className="relative aspect-square w-full">
                            <Image src={item.path} alt={item.title} fill className="object-cover" />
                        </div>
                        <div className="p-3">
                            <p className="font-semibold text-sm truncate" title={item.title}>{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate" title={item.path}>{item.path}</p>
                        </div>
                        <div className="absolute top-2 right-2">
                             <Button size="icon" variant="destructive" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Medya Kütüphanesi Boş</h3>
                <p className="mt-1 text-sm text-gray-500">Yukarıdaki formu kullanarak yeni görseller eklemeye başlayın.</p>
            </div>
        )}
      </div>
    </div>
  );
}
