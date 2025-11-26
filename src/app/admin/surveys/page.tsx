
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, ShieldAlert, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import { useUser } from '@/firebase';
import { ADMIN_UID } from '@/firebase/config';

type Survey = {
  id: string;
  poiName: string;
  createdAt: Timestamp;
  answers: {
    rating: string;
    cleanliness: string;
    recommend: string;
    guided: string;
    importance: string;
  };
};

function renderStars(count: string | number) {
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    const stars = [];
    for (let i = 0; i < 5; i++) {
        stars.push(
            <Star key={i} className={`h-4 w-4 ${i < num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        );
    }
    return <div className="flex">{stars}</div>;
}

function SurveyResults() {
  const firestore = useFirestore();

  const surveysQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc'));
    },
    [firestore]
  );

  const { data: surveys, isLoading, error } = useCollection<Survey>(surveysQuery);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Veri Yükleme Hatası</AlertTitle>
            <AlertDescription>
                Anket verileri yüklenirken bir hata oluştu. Lütfen Firestore kurallarınızı veya internet bağlantınızı kontrol edin. Hata: {error.message}
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {surveys && surveys.length > 0 ? (
        <Card>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Ziyaret Edilen Yer</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Genel Deneyim</TableHead>
                    <TableHead>Temizlik</TableHead>
                    <TableHead>Tavsiye</TableHead>
                    <TableHead>Rehber</TableHead>
                    <TableHead>Önem Derecesi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                        <TableCell className="font-medium">{survey.poiName}</TableCell>
                        <TableCell>
                            {survey.createdAt ? formatDistanceToNow(survey.createdAt.toDate(), { addSuffix: true, locale: tr }) : 'Bilinmiyor'}
                        </TableCell>
                        <TableCell>{renderStars(survey.answers.rating)}</TableCell>
                        <TableCell><Badge variant={survey.answers.cleanliness === 'good' ? 'default' : survey.answers.cleanliness === 'average' ? 'secondary' : 'destructive'}>{survey.answers.cleanliness}</Badge></TableCell>
                        <TableCell><Badge variant={survey.answers.recommend === 'yes' ? 'default' : 'secondary'}>{survey.answers.recommend}</Badge></TableCell>
                        <TableCell><Badge variant={survey.answers.guided === 'yes' ? 'default' : 'secondary'}>{survey.answers.guided}</Badge></TableCell>
                        <TableCell>{renderStars(survey.answers.importance)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Henüz Anket Yok</CardTitle>
            <CardDescription>
              Kullanıcılar anketleri doldurdukça sonuçlar burada görünecektir.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}


export default function SurveyResultsPage() {
  const { isAdminAuthenticated, isUserLoading } = useApp();
  
  if (isUserLoading) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Yönetici durumu kontrol ediliyor...</p>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Erişim Engellendi</AlertTitle>
            <AlertDescription>
                Bu sayfayı görüntülemek için yönetici olarak giriş yapmanız gerekmektedir.
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Anket Sonuçları</h1>
        <SurveyResults />
    </div>
  );
}
