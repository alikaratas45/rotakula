'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { Bike, Footprints, Loader2, MapPin, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getBikeRoutes, getPois, getWalkingRoutes } from '@/lib/kula-data';
import type { BikeRoute, PointOfInterest, WalkingRoute } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/alert-dialog';

type RouteType = 'bike' | 'walking';
type ManagedRoute = BikeRoute & Partial<Pick<
  WalkingRoute,
  'elevationGain' | 'difficulty' | 'elevationLoss' | 'maxElevation' |
  'trailRank' | 'minElevation' | 'trackType' | 'difficulty_en' |
  'difficulty_fr' | 'difficulty_de' | 'trackType_en' | 'trackType_fr' | 'trackType_de'
>>;
type RouteForm = Omit<ManagedRoute, 'poiIds'> & { poiIds: string[] };

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
] as const;

function createEmptyForm(): RouteForm {
  return {
    id: '',
    slug: '',
    name: '',
    description: '',
    distance: '',
    kmlPath: '',
    poiIds: [],
  };
}

function toRouteForm(route: ManagedRoute): RouteForm {
  return { ...route, poiIds: route.poiIds ?? [] };
}

function makeSlug(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminRoutesDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [routeType, setRouteType] = useState<RouteType>('walking');
  const [walkingRoutes, setWalkingRoutes] = useState<WalkingRoute[]>([]);
  const [bikeRoutes, setBikeRoutes] = useState<BikeRoute[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [form, setForm] = useState<RouteForm>(createEmptyForm);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [walking, biking, poiData] = await Promise.all([
        getWalkingRoutes('tr'),
        getBikeRoutes('tr'),
        getPois('tr'),
      ]);
      setWalkingRoutes(walking);
      setBikeRoutes(biking);
      setPois(poiData);
    } catch (error) {
      console.error('Failed to load routes for admin:', error);
      setLoadError('Rota verileri yüklenemedi. Firestore erişim kurallarını kontrol edip tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const activeRoutes: ManagedRoute[] = useMemo(
    () => routeType === 'walking' ? walkingRoutes : bikeRoutes,
    [bikeRoutes, routeType, walkingRoutes]
  );
  const visibleRoutes = useMemo(() => {
    const queryText = search.trim().toLocaleLowerCase('tr-TR');
    return activeRoutes.filter(route =>
      `${route.name} ${route.slug}`.toLocaleLowerCase('tr-TR').includes(queryText)
    );
  }, [activeRoutes, search]);

  const updateForm = <K extends keyof RouteForm>(key: K, value: RouteForm[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const changeRouteType = (value: string) => {
    if (value === 'walking' || value === 'bike') {
      setRouteType(value);
      setForm(createEmptyForm());
      setSearch('');
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const slug = form.slug.trim().toLocaleLowerCase('en-US');
    const description = form.description.trim();
    const distance = form.distance.trim();
    const kmlPath = form.kmlPath.trim();

    if (!name || !slug || !description || !distance || !kmlPath) {
      toast({
        title: 'Eksik bilgi',
        description: 'Türkçe ad, slug, açıklama, mesafe ve KML yolu zorunludur.',
        variant: 'destructive',
      });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast({
        title: 'Slug biçimi hatalı',
        description: 'Yalnızca küçük harf, rakam ve kelimeler arasında tire kullanın.',
        variant: 'destructive',
      });
      return;
    }
    if (activeRoutes.some(route => route.slug === slug && route.id !== form.id)) {
      toast({
        title: 'Slug kullanılıyor',
        description: 'Bu rota türünde her rota için benzersiz bir slug girin.',
        variant: 'destructive',
      });
      return;
    }

    const id = form.id || `${routeType}-route-${crypto.randomUUID()}`;
    const routeData = Object.fromEntries(
      Object.entries({
        ...form,
        id,
        name,
        slug,
        description,
        distance,
        kmlPath,
        poiIds: form.poiIds,
      }).filter(([, value]) =>
        value !== undefined && value !== null &&
        (typeof value !== 'string' || value.trim() !== '')
      )
    );

    setIsSaving(true);
    try {
      await setDoc(doc(collection(firestore, routeType === 'walking' ? 'walkingRoutes' : 'bikeRoutes'), id), {
        ...routeData,
        deleted: false,
      });
      setForm({ ...form, id, name, slug, description, distance, kmlPath });
      await refreshData();
      toast({ title: 'Rota kaydedildi', description: 'Rota içerikleri sitede güncellendi.' });
    } catch (error) {
      console.error('Failed to save route:', error);
      toast({
        title: 'Kaydetme başarısız',
        description: 'Rota kaydedilemedi. Firebase bağlantısını ve Firestore yetkilerini kontrol edin.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    setIsDeleting(true);
    try {
      await setDoc(
        doc(firestore, routeType === 'walking' ? 'walkingRoutes' : 'bikeRoutes', form.id),
        { deleted: true },
        { merge: true }
      );
      setForm(createEmptyForm());
      await refreshData();
      toast({ title: 'Rota silindi', description: 'Rota artık ziyaretçilere gösterilmeyecek.' });
    } catch (error) {
      console.error('Failed to delete route:', error);
      toast({
        title: 'Silme başarısız',
        description: 'Rota silinemedi. Firestore yetkilerini kontrol edin.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const setTextField = (key: keyof RouteForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const routeTypeLabel = routeType === 'walking' ? 'yürüyüş' : 'bisiklet';

  return (
    <main className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            {routeType === 'walking' ? <Footprints className="h-5 w-5" /> : <Bike className="h-5 w-5" />}
            <span>Yönetim paneli</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">Yürüyüş ve Bisiklet Rotaları</h1>
          <p className="mt-1 text-muted-foreground">Rota bilgilerini, çevirileri, KML yolunu ve ilişkili gezi noktalarını yönetin.</p>
        </div>
        <Button type="button" onClick={() => setForm(createEmptyForm())}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni {routeTypeLabel} rotası
        </Button>
      </div>

      <Tabs value={routeType} onValueChange={changeRouteType} className="mb-6">
        <TabsList>
          <TabsTrigger value="walking"><Footprints className="mr-2 h-4 w-4" />Yürüyüş</TabsTrigger>
          <TabsTrigger value="bike"><Bike className="mr-2 h-4 w-4" />Bisiklet</TabsTrigger>
        </TabsList>
        <TabsContent value="walking" />
        <TabsContent value="bike" />
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{routeType === 'walking' ? 'Yürüyüş rotaları' : 'Bisiklet rotaları'}</CardTitle>
            <CardDescription>{activeRoutes.length} rota</CardDescription>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rota ara..." className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : loadError ? (
              <div className="space-y-3 text-sm text-destructive">
                <p>{loadError}</p>
                <Button variant="outline" onClick={() => void refreshData()}>Tekrar dene</Button>
              </div>
            ) : visibleRoutes.map(route => (
              <button
                key={route.id}
                type="button"
                onClick={() => setForm(toRouteForm(route))}
                className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                  form.id === route.id ? 'border-primary bg-accent' : ''
                }`}
              >
                <span className="block font-medium">{route.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{route.slug}</span>
              </button>
            ))}
            {!isLoading && !loadError && visibleRoutes.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Rota bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{form.id ? 'Rotayı düzenle' : 'Yeni rota ekle'}</CardTitle>
            <CardDescription>Türkçe rota adı, açıklaması, mesafesi ve KML yolu zorunludur. KML dosyası public klasöründe veya erişilebilir bir URL’de olmalıdır.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="route-name">Türkçe ad *</Label>
                  <Input id="route-name" value={form.name} onChange={event => setTextField('name', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-slug">Slug *</Label>
                  <div className="flex gap-2">
                    <Input id="route-slug" value={form.slug} onChange={event => setTextField('slug', event.target.value)} required />
                    <Button type="button" variant="outline" onClick={() => setTextField('slug', makeSlug(form.name))}>Oluştur</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-distance">Mesafe *</Label>
                  <Input id="route-distance" value={form.distance} onChange={event => setTextField('distance', event.target.value)} placeholder="8,4 km" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route-kml">KML yolu *</Label>
                  <Input id="route-kml" value={form.kmlPath} onChange={event => setTextField('kmlPath', event.target.value)} placeholder="/routes/rota.kml" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="route-description">Türkçe açıklama *</Label>
                  <Textarea id="route-description" value={form.description} onChange={event => setTextField('description', event.target.value)} rows={3} required />
                </div>
              </div>

              <Tabs defaultValue="en">
                <TabsList>
                  {languages.map(language => <TabsTrigger key={language.code} value={language.code}>{language.label}</TabsTrigger>)}
                </TabsList>
                {languages.map(language => (
                  <TabsContent key={language.code} value={language.code} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language.label} route name</Label>
                      <Input value={form[`name_${language.code}`] ?? ''} onChange={event => setTextField(`name_${language.code}`, event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{language.label} description</Label>
                      <Textarea value={form[`description_${language.code}`] ?? ''} onChange={event => setTextField(`description_${language.code}`, event.target.value)} rows={3} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {routeType === 'walking' && (
                <div className="space-y-4 rounded-md border p-4">
                  <h3 className="font-semibold">Yürüyüş parkuru bilgileri</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      ['elevationGain', 'Yükselti kazanımı'],
                      ['elevationLoss', 'Yükselti kaybı'],
                      ['maxElevation', 'En yüksek rakım'],
                      ['minElevation', 'En düşük rakım'],
                      ['trailRank', 'Parkur sıralaması'],
                      ['difficulty', 'Zorluk'],
                      ['trackType', 'Parkur tipi'],
                    ] as const).map(([field, label]) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`route-${field}`}>{label}</Label>
                        <Input id={`route-${field}`} value={form[field] ?? ''} onChange={event => setTextField(field, event.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {languages.map(language => (
                      <div key={language.code} className="space-y-2">
                        <Label>{language.label} difficulty</Label>
                        <Input
                          value={form[`difficulty_${language.code}`] ?? ''}
                          onChange={event => setTextField(`difficulty_${language.code}`, event.target.value)}
                        />
                        <Label>{language.label} track type</Label>
                        <Input
                          value={form[`trackType_${language.code}`] ?? ''}
                          onChange={event => setTextField(`trackType_${language.code}`, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label>Rotayla ilişkili gezi noktaları</Label>
                  <p className="text-xs text-muted-foreground">Seçilen POI’ler rota ayrıntılarında gösterilir.</p>
                </div>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                  {pois.map(poi => {
                    const checked = form.poiIds.includes(poi.id);
                    return (
                      <label key={poi.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={event => updateForm(
                            'poiIds',
                            event.target.checked
                              ? [...form.poiIds, poi.id]
                              : form.poiIds.filter(id => id !== poi.id)
                          )}
                          className="mt-1"
                        />
                        <span>{poi.name}</span>
                      </label>
                    );
                  })}
                  {!pois.length && <span className="text-sm text-muted-foreground">Gezi noktası bulunamadı.</span>}
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2">
                <Button type="submit" disabled={isSaving || isDeleting}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Rotayı kaydet
                </Button>
                <div className="flex gap-2">
                  {form.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isSaving || isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Rotayı sil
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bu rotayı silmek istiyor musunuz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            “{form.name}” ziyaretçi rota listelerinden kaldırılacak. Bu işlem rotayı kalıcı olarak silmez.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDelete()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Rotayı kaldır
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button type="button" variant="outline" onClick={() => setForm(createEmptyForm())}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Yeni kayıt
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
