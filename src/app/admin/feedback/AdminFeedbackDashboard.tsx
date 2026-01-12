
'use client';

import { useMemo, useState } from 'react';
import { Loader2, LogOut, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const locales: { [key: string]: Locale } = { tr, en: enUS };

type Feedback = {
  id: string;
  name?: string;
  message: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export default function AdminFeedbackDashboard() {
  const { language, handleAdminLogout } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const feedbackQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: feedbackItems, isLoading } = useCollection<Feedback>(feedbackQuery);

  const handleDelete = async (feedbackId: string) => {
    setIsDeleting(feedbackId);
    try {
      await deleteDoc(doc(firestore, 'feedback', feedbackId));
      toast({
        title: "Yorum Silindi",
        description: "Yorum başarıyla veritabanından silindi.",
      });
    } catch (error) {
      console.error("Error deleting feedback: ", error);
      toast({
        title: "Hata",
        description: "Yorum silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const sortedFeedback = useMemo(() => {
    if (!feedbackItems) return [];
    return [...feedbackItems].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  }, [feedbackItems]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Yorum Yönetimi</h1>
            <p className="text-muted-foreground">Uygulama hakkındaki geri bildirimleri buradan yönetin.</p>
        </div>
        <Button onClick={() => handleAdminLogout()} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sortedFeedback && sortedFeedback.length > 0 ? (
        <div className="space-y-4">
          {sortedFeedback.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl">{item.name || 'Anonim'}</CardTitle>
                        <CardDescription>
                            {formatDistanceToNow(new Date(item.createdAt.seconds * 1000), { addSuffix: true, locale: locales[language] || tr })}
                        </CardDescription>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={isDeleting === item.id}>
                                {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive"/>}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu yorum kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Sil</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">Henüz Yorum Yok</h2>
          <p className="text-muted-foreground mt-2">Kullanıcılar geri bildirimde bulunduğunda burada görünecektir.</p>
       </div>
      )}
    </div>
  )
}
