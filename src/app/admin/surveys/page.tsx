
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Query } from 'firebase/firestore';
import { Loader2, Star, LogOut, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';

type SurveyResponse = {
  id: string;
  poiId: string;
  poiName: string;
  rating: number;
  comment: string;
  createdAt: { seconds: number; nanoseconds: number };
};

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn('h-4 w-4', i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')}
      />
    ))}
  </div>
);

export default function SurveyResultsPage() {
  const router = useRouter();
  const { isAdmin, isUserLoading, handleAdminLogout } = useApp();
  const firestore = useFirestore();
  
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [filters, setFilters] = useState<{ poiId: string; rating: number }>({ poiId: 'all', rating: 0 });

  useEffect(() => {
    async function fetchPois() {
        const allPois = await getPois('tr');
        setPois(allPois);
    }
    fetchPois();
  }, []);

  const surveysQuery = useMemoFirebase(() => {
    if (!isAdmin) return null; // Do not query if not admin
    let q: Query = query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc'));
    if (filters.poiId !== 'all') {
        q = query(q, where('poiId', '==', filters.poiId));
    }
    if (filters.rating > 0) {
        q = query(q, where('rating', '==', filters.rating));
    }
    return q;
  }, [firestore, filters, isAdmin]);

  const { data: surveys, isLoading: isLoadingSurveys } = useCollection<SurveyResponse>(surveysQuery);

  const averageRating = useMemo(() => {
    if (!surveys || surveys.length === 0) return 0;
    const total = surveys.reduce((sum, s) => sum + s.rating, 0);
    return (total / surveys.length).toFixed(1);
  }, [surveys]);


  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if not admin after loading is complete
  if (!isUserLoading && !isAdmin) {
    router.push('/');
    return null;
  }
  
  const handleFilterChange = (type: 'poiId' | 'rating', value: string | number) => {
    setFilters(prev => ({...prev, [type]: value}));
  }

  const clearFilters = () => {
    setFilters({ poiId: 'all', rating: 0 });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Anket Sonuçları</h1>
            <p className="text-muted-foreground">Ziyaretçi deneyimlerini ve geri bildirimlerini inceleyin.</p>
        </div>
        <Button onClick={handleAdminLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader>
                <CardTitle>Toplam Anket</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">{surveys?.length || 0}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Ortalama Puan</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-3xl font-bold">{averageRating}</p>
            </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center gap-4">
           <Filter className="h-5 w-5" />
           <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <div>
            <label className="text-sm font-medium mb-2 block">Yere Göre Filtrele</label>
             <Select value={filters.poiId} onValueChange={(value) => handleFilterChange('poiId', value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Tüm Yerler" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tüm Yerler</SelectItem>
                    {pois.map(poi => (
                        <SelectItem key={poi.id} value={poi.id}>{poi.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
           </div>
           <div>
            <label className="text-sm font-medium mb-2 block">Puana Göre Filtrele</label>
             <Select value={String(filters.rating)} onValueChange={(value) => handleFilterChange('rating', Number(value))}>
                <SelectTrigger>
                    <SelectValue placeholder="Tüm Puanlar" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0">Tüm Puanlar</SelectItem>
                    <SelectItem value="5">5 Yıldız</SelectItem>
                    <SelectItem value="4">4 Yıldız</SelectItem>
                    <SelectItem value="3">3 Yıldız</SelectItem>
                    <SelectItem value="2">2 Yıldız</SelectItem>
                    <SelectItem value="1">1 Yıldız</SelectItem>
                </SelectContent>
            </Select>
           </div>
           <div className="flex items-end">
             <Button onClick={clearFilters} variant="ghost" disabled={filters.poiId === 'all' && filters.rating === 0}>
                <X className="mr-2 h-4 w-4" />
                Filtreleri Temizle
            </Button>
           </div>
        </CardContent>
      </Card>


      {isLoadingSurveys ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {surveys && surveys.length > 0 ? (
            surveys.map((survey) => (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{survey.poiName}</CardTitle>
                        <CardDescription>
                            {formatDistanceToNow(new Date(survey.createdAt.seconds * 1000), {
                            addSuffix: true,
                            locale: tr,
                            })}
                        </CardDescription>
                    </div>
                    <StarDisplay rating={survey.rating} />
                  </div>
                </CardHeader>
                {survey.comment && (
                    <CardContent>
                        <p className="text-muted-foreground italic">"{survey.comment}"</p>
                    </CardContent>
                )}
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-16">Seçilen filtrelere uygun anket sonucu bulunamadı.</p>
          )}
        </div>
      )}
    </div>
  );
}
