
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, orderBy, where, Query, doc, deleteDoc } from 'firebase/firestore';
import { Loader2, Star, LogOut, Filter, X, Smile, ThumbsUp, Users, Bus, Sparkles, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type SurveyResponse = {
  id: string;
  poiId: string;
  poiName: string;
  cleanliness: number;
  guidance: number;
  staffing: number;
  transportation: number;
  overall: number;
  comment: string;
  createdAt: { seconds: number; nanoseconds: number };
};

const StarDisplay = ({ rating, label }: { rating: number, label?: string }) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-sm font-medium text-muted-foreground">{label}:</span>}
    <div className="flex">
        {[...Array(5)].map((_, i) => (
        <Star
            key={i}
            className={cn('h-4 w-4', i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')}
        />
        ))}
    </div>
     <span className="text-sm font-semibold">{rating}/5</span>
  </div>
);

const AverageRatingCard = ({ title, value, icon: Icon }: { title: string, value: string, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function SurveyResultsPage() {
  const router = useRouter();
  const { isAdmin, isUserLoading, handleAdminLogout } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [filters, setFilters] = useState<{ poiId: string; rating: number }>({ poiId: 'all', rating: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading) {
      if (!isAdmin) {
        router.push('/');
      } else {
        setInitialLoading(false);
      }
    }
  }, [isAdmin, isUserLoading, router]);

  useEffect(() => {
    async function fetchPois() {
        const allPois = await getPois('tr');
        setPois(allPois);
    }
    if (isAdmin) {
      fetchPois();
    }
  }, [isAdmin]);

  const surveysQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    
    let q: Query = query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc'));
    if (filters.poiId !== 'all') {
        q = query(q, where('poiId', '==', filters.poiId));
    }
    if (filters.rating > 0) {
        q = query(q, where('overall', '==', filters.rating));
    }
    return q;
  }, [firestore, filters, isAdmin]);

  const { data: surveys, isLoading: isLoadingSurveys } = useCollection<SurveyResponse>(surveysQuery);

  const averageRatings = useMemo(() => {
    if (!surveys || surveys.length === 0) {
      return { cleanliness: "0.0", guidance: "0.0", staffing: "0.0", transportation: "0.0", overall: "0.0" };
    }
    const total = surveys.reduce((sum, s) => ({
        cleanliness: sum.cleanliness + s.cleanliness,
        guidance: sum.guidance + s.guidance,
        staffing: sum.staffing + s.staffing,
        transportation: sum.transportation + s.transportation,
        overall: sum.overall + s.overall
    }), { cleanliness: 0, guidance: 0, staffing: 0, transportation: 0, overall: 0 });
    
    const count = surveys.length;
    return {
        cleanliness: (total.cleanliness / count).toFixed(1),
        guidance: (total.guidance / count).toFixed(1),
        staffing: (total.staffing / count).toFixed(1),
        transportation: (total.transportation / count).toFixed(1),
        overall: (total.overall / count).toFixed(1),
    };
  }, [surveys]);


  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const handleFilterChange = (type: 'poiId' | 'rating', value: string | number) => {
    setFilters(prev => ({...prev, [type]: value}));
  }

  const clearFilters = () => {
    setFilters({ poiId: 'all', rating: 0 });
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    setIsDeleting(surveyId);
    try {
      const surveyRef = doc(firestore, 'surveys', surveyId);
      await deleteDoc(surveyRef);
      toast({
        title: "Başarılı",
        description: "Anket başarıyla silindi.",
      });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
          const contextualError = new FirestorePermissionError({
              operation: 'delete',
              path: `surveys/${surveyId}`,
          });
          errorEmitter.emit('permission-error', contextualError);
          // Let the global error handler show the toast
      } else {
          toast({
              title: "Hata",
              description: "Anket silinirken bir sorun oluştu.",
              variant: "destructive",
          });
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Anket Sonuçları</h1>
            <p className="text-muted-foreground">Ziyaretçi deneyimlerini ve geri bildirimlerini inceleyin.</p>
        </div>
         {isAdmin ? (
            <Button onClick={handleAdminLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
            </Button>
         ) : null}
      </div>
      
      <div className="mb-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Toplam Anket</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{surveys?.length || 0}</p>
                </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Genel Ortalama Puanlar</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 font-medium"><Smile className="h-4 w-4 text-blue-500" /> Temizlik: <span className="font-bold">{averageRatings.cleanliness}</span></div>
                    <div className="flex items-center gap-2 font-medium"><ThumbsUp className="h-4 w-4 text-green-500" /> Rehberlik: <span className="font-bold">{averageRatings.guidance}</span></div>
                    <div className="flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-indigo-500" /> Personel: <span className="font-bold">{averageRatings.staffing}</span></div>
                    <div className="flex items-center gap-2 font-medium"><Bus className="h-4 w-4 text-orange-500" /> Ulaşım: <span className="font-bold">{averageRatings.transportation}</span></div>
                    <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-yellow-500" /> Genel: <span className="font-bold">{averageRatings.overall}</span></div>
                </CardContent>
            </Card>
         </div>
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
            <label className="text-sm font-medium mb-2 block">Genel Puana Göre Filtrele</label>
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
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <CardTitle className="text-lg">{survey.poiName}</CardTitle>
                        <CardDescription>
                            {formatDistanceToNow(new Date(survey.createdAt.seconds * 1000), {
                            addSuffix: true,
                            locale: tr,
                            })}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 pt-1">
                          <StarDisplay rating={survey.overall} label="Genel" />
                      </div>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                              {isDeleting === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Anketi Silmek Üzeresiniz</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. "{survey.poiName}" için gönderilen bu anket sonucunu kalıcı olarak silmek istediğinizden emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSurvey(survey.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Evet, Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <StarDisplay rating={survey.cleanliness} label="Temizlik"/>
                        <StarDisplay rating={survey.guidance} label="Rehberlik"/>
                        <StarDisplay rating={survey.staffing} label="Personel"/>
                        <StarDisplay rating={survey.transportation} label="Ulaşım"/>
                    </div>
                    {survey.comment && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm font-semibold mb-1">Ziyaretçi Yorumu:</p>
                                <p className="text-muted-foreground italic">"{survey.comment}"</p>
                            </div>
                        </>
                    )}
                </CardContent>
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

    