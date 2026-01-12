
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Loader2, Star, LogOut, Filter, X, Smile, ThumbsUp, Users, Bus, Sparkles, Trash2, Check, Hand, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import * as XLSX from 'xlsx';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy, deleteDoc, doc } from 'firebase/firestore';


type SurveyResponse = {
  id: string;
  poiId: string;
  poiName: string;
  guidance: boolean;
  staffing: boolean;
  cleanliness: number;
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

const YesNoDisplay = ({ value, label }: { value: boolean, label: string }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}:</span>
        <div className={cn("flex items-center gap-1 font-semibold text-sm", value ? "text-green-600" : "text-red-600")}>
            {value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span>{value ? 'Evet' : 'Hayır'}</span>
        </div>
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

const YesNoStatCard = ({ title, yesPercent, noPercent, icon: Icon }: { title: string, yesPercent: string, noPercent: string, icon: React.ElementType }) => (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-baseline gap-4">
            <div className="text-xl font-bold text-green-600">{yesPercent}% Evet</div>
            <div className="text-lg font-semibold text-red-600">{noPercent}% Hayır</div>
        </CardContent>
    </Card>
)

export default function AdminSurveyDashboard() {
  const { handleAdminLogout } = useApp();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [filters, setFilters] = useState<{ poiId: string; rating: number }>({ poiId: 'all', rating: 0 });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const surveysQuery = useMemoFirebase(() => {
    let q = query(collection(firestore, 'surveys'), orderBy('createdAt', 'desc'));
    if (filters.poiId !== 'all') {
      q = query(q, where('poiId', '==', filters.poiId));
    }
    if (filters.rating > 0) {
      q = query(q, where('overall', '==', filters.rating));
    }
    return q;
  }, [firestore, filters]);

  const { data: surveys, isLoading: isLoadingSurveys } = useCollection<SurveyResponse>(surveysQuery);


  useEffect(() => {
    async function fetchPois() {
        const allPois = await getPois('tr');
        setPois(allPois);
    }
    fetchPois();
  }, []);

  const averageRatings = useMemo(() => {
    if (!surveys || surveys.length === 0) {
      return { 
          cleanliness: "0.0", 
          transportation: "0.0", 
          overall: "0.0",
          guidanceYes: "0",
          guidanceNo: "0",
          staffingYes: "0",
          staffingNo: "0",
      };
    }
    const total = surveys.reduce((sum, s) => ({
        cleanliness: sum.cleanliness + s.cleanliness,
        transportation: sum.transportation + s.transportation,
        overall: sum.overall + s.overall,
        guidanceYes: sum.guidanceYes + (s.guidance ? 1 : 0),
        staffingYes: sum.staffingYes + (s.staffing ? 1 : 0),
    }), { cleanliness: 0, transportation: 0, overall: 0, guidanceYes: 0, staffingYes: 0 });
    
    const count = surveys.length;
    return {
        cleanliness: (total.cleanliness / count).toFixed(1),
        transportation: (total.transportation / count).toFixed(1),
        overall: (total.overall / count).toFixed(1),
        guidanceYes: ((total.guidanceYes / count) * 100).toFixed(0),
        guidanceNo: (((count - total.guidanceYes) / count) * 100).toFixed(0),
        staffingYes: ((total.staffingYes / count) * 100).toFixed(0),
        staffingNo: (((count - total.staffingYes) / count) * 100).toFixed(0),
    };
  }, [surveys]);
  
  const handleFilterChange = (type: 'poiId' | 'rating', value: string | number) => {
    setFilters(prev => ({...prev, [type]: value}));
  }

  const clearFilters = () => {
    setFilters({ poiId: 'all', rating: 0 });
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    setIsDeleting(surveyId);
    try {
      await deleteDoc(doc(firestore, 'surveys', surveyId));
      toast({
        title: "Anket Silindi",
        description: "Anket başarıyla veritabanından silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Anket silinirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExportToExcel = () => {
    if (!surveys || surveys.length === 0) {
      toast({
        title: "Veri Yok",
        description: "Dışa aktarılacak anket verisi bulunamadı.",
        variant: "destructive",
      });
      return;
    }

    const formattedData = surveys.map(s => ({
      'Yer Adı': s.poiName,
      'Genel Değerlendirme': s.overall,
      'Temizlik': s.cleanliness,
      'Ulaşım Kolaylığı': s.transportation,
      'Rehberlik Hizmeti': s.guidance ? 'Evet' : 'Hayır',
      'Personel İlgisi': s.staffing ? 'Evet' : 'Hayır',
      'Yorum': s.comment,
      'Tarih': format(new Date(s.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Anketler");
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Yer Adı
      { wch: 15 }, // Genel Değerlendirme
      { wch: 10 }, // Temizlik
      { wch: 15 }, // Ulaşım Kolaylığı
      { wch: 15 }, // Rehberlik Hizmeti
      { wch: 15 }, // Personel İlgisi
      { wch: 50 }, // Yorum
      { wch: 20 }, // Tarih
    ];

    XLSX.writeFile(workbook, "anket_sonuclari.xlsx");
  };


  const sortedSurveys = useMemo(() => {
    if (!surveys) return [];
    // Sort by creation date descending on the client side
    return [...surveys].sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  }, [surveys]);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Anket Sonuçları</h1>
            <p className="text-muted-foreground">Ziyaretçi geri bildirimlerini buradan yönetin ve analiz edin.</p>
        </div>
        <Button onClick={() => handleAdminLogout()} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <AverageRatingCard title="Genel Memnuniyet" value={averageRatings.overall} icon={Smile} />
        <AverageRatingCard title="Temizlik Ortalaması" value={averageRatings.cleanliness} icon={Sparkles} />
        <YesNoStatCard title="Rehberlik Hizmeti" yesPercent={averageRatings.guidanceYes} noPercent={averageRatings.guidanceNo} icon={Users} />
        <YesNoStatCard title="Personel İlgisi" yesPercent={averageRatings.staffingYes} noPercent={averageRatings.staffingNo} icon={Hand} />
      </div>

       <Card className="mb-8">
            <CardHeader>
                <CardTitle>Filtreler</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                 <Select onValueChange={(value) => handleFilterChange('poiId', value)} value={filters.poiId}>
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
                 <Select onValueChange={(value) => handleFilterChange('rating', parseInt(value))} value={filters.rating.toString()}>
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
                <Button onClick={clearFilters} variant="outline" className="flex items-center gap-2">
                    <X className="h-4 w-4"/>
                    Filtreleri Temizle
                </Button>
                 <Button onClick={handleExportToExcel} className="flex items-center gap-2 ml-auto">
                    <FileSpreadsheet className="h-4 w-4"/>
                    Excel'e Aktar
                </Button>
            </CardContent>
       </Card>

      {isLoadingSurveys ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : sortedSurveys && sortedSurveys.length > 0 ? (
        <div className="space-y-4">
          {sortedSurveys.map(survey => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-xl">{survey.poiName}</CardTitle>
                        <CardDescription>
                            {formatDistanceToNow(new Date(survey.createdAt.seconds * 1000), { addSuffix: true, locale: tr })}
                        </CardDescription>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" disabled={isDeleting === survey.id}>
                                {isDeleting === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive"/>}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu anket kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSurvey(survey.id)}>Sil</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <StarDisplay rating={survey.overall} label="Genel Değerlendirme" />
                        <StarDisplay rating={survey.cleanliness} label="Temizlik" />
                        <StarDisplay rating={survey.transportation} label="Ulaşım" />
                    </div>
                     <div className="space-y-2">
                        <YesNoDisplay value={survey.guidance} label="Rehberlik Hizmeti" />
                        <YesNoDisplay value={survey.staffing} label="Personel İlgisi" />
                    </div>
                </div>
                {survey.comment && (
                    <div>
                        <p className="font-semibold">Yorum:</p>
                        <p className="text-muted-foreground">{survey.comment}</p>
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">Filtrelerle Eşleşen Anket Yok</h2>
          <p className="text-muted-foreground mt-2">Farklı filtreler deneyin veya tüm anketleri görmek için filtreleri temizleyin.</p>
       </div>
      )}
    </div>
  )
}
