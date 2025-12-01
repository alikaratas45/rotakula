
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Query } from 'firebase/firestore';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, PlusCircle, Edit, Trash2, Link as LinkIcon, Copy, Check, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

const contentSchema = z.object({
  title: z.string().min(3, { message: 'Başlık en az 3 karakter olmalıdır.' }),
  body: z.string().min(10, { message: 'İçerik en az 10 karakter olmalıdır.' }),
  imageUrl: z.string().url({ message: 'Lütfen geçerli bir URL girin.' }).optional().or(z.literal('')),
});

type ContentFormValues = z.infer<typeof contentSchema>;

type Content = {
  id: string;
  slug: string;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
};

function ContentForm({ contentItem, onFinished }: { contentItem?: Content; onFinished: () => void }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: contentItem?.title || '',
      body: contentItem?.body || '',
      imageUrl: contentItem?.imageUrl || '',
    },
  });

  const onSubmit = async (data: ContentFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      if (contentItem) {
        // Update existing content - slug/ID does not change
        const contentRef = doc(firestore, 'content', contentItem.id);
        await updateDoc(contentRef, {
          title: data.title, // Allow title updates
          body: data.body,
          imageUrl: data.imageUrl,
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Başarılı', description: 'İçerik güncellendi.' });
      } else {
        // Create new content
        const slug = slugify(data.title);
        const newContentRef = doc(firestore, 'content', slug);
        await setDoc(newContentRef, {
          ...data,
          slug: slug,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Başarılı', description: 'Yeni içerik oluşturuldu.' });
      }
      onFinished();
    } catch (error) {
      console.error("Error saving content:", error);
      toast({ variant: 'destructive', title: 'Hata', description: 'İçerik kaydedilemedi. Bu başlıkla bir içerik zaten var olabilir.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlık</FormLabel>
              <FormControl>
                <Input placeholder="İçerik başlığı..." {...field} disabled={!!contentItem} />
              </FormControl>
              {!!contentItem && <p className="text-xs text-muted-foreground">İçerik yolu değişmemesi için başlık düzenlenemez.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İçerik (Markdown desteklenir)</FormLabel>
              <FormControl>
                <Textarea placeholder="İçeriği buraya yazın..." {...field} rows={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Görsel URL'i (İsteğe Bağlı)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">İptal</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {contentItem ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


function ContentCard({ contentItem }: { contentItem: Content }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const contentPath = `/sayfa/${contentItem.slug}`;

  const handleDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'content', contentItem.id));
      toast({ title: 'Başarılı', description: 'İçerik silindi.' });
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({ variant: 'destructive', title: 'Hata', description: 'İçerik silinemedi.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = () => {
    const fullUrl = `${window.location.origin}${contentPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contentItem.title}</CardTitle>
        <CardDescription>
          Son Güncelleme: {contentItem.updatedAt ? formatDistanceToNow(new Date(contentItem.updatedAt.seconds * 1000), { addSuffix: true, locale: tr }) : 'Bilinmiyor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
         <div className="flex items-center gap-2 bg-muted p-2 rounded-md w-full sm:w-auto">
            <span className="text-sm font-semibold">QR Kodu Yolu:</span>
            <code className="text-sm font-semibold break-all">{contentPath}</code>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyToClipboard} title="QR kod için tam linki kopyala">
                {copied ? <Check className="h-4 w-4 text-green-500"/> : <Copy className="h-4 w-4"/>}
            </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 self-end">
          <Button asChild variant="secondary" size="sm">
            <Link href={contentPath} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Sayfaya Git
            </Link>
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Düzenle</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>İçeriği Düzenle</DialogTitle>
              </DialogHeader>
              <ContentForm contentItem={contentItem} onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. "{contentItem.title}" başlıklı içeriği kalıcı olarak sileceksiniz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Evet, Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ContentAdminPage() {
  const { isAdmin, isUserLoading } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isUserLoading, router]);

  const contentQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'content'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: content, isLoading } = useCollection<Content>(contentQuery);

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
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Yeni İçerik Ekle</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Yeni İçerik Oluştur</DialogTitle>
            </DialogHeader>
            <ContentForm onFinished={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : content && content.length > 0 ? (
        <div className="space-y-4">
          {content.map(item => <ContentCard key={item.id} contentItem={item} />)}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">Henüz İçerik Yok</h2>
          <p className="text-muted-foreground mt-2">Başlamak için "Yeni İçerik Ekle" butonuna tıklayın.</p>
        </div>
      )}
    </div>
  );
}
