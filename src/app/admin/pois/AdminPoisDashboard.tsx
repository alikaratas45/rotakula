'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { Languages, Loader2, MapPin, Plus, Save, Search, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { getPois } from '@/lib/kula-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { PointOfInterest } from '@/lib/types';
import bundledPoisData from '@/lib/data/kula-pois.json';

type PoiForm = Omit<PointOfInterest, 'latitude' | 'longitude'> & {
  latitude: string;
  longitude: string;
};

const categories: { value: PointOfInterest['category']; label: string }[] = [
  { value: 'geopark', label: 'Jeopark' },
  { value: 'history', label: 'Tarih' },
  { value: 'food', label: 'Yeme-İçme' },
  { value: 'nature', label: 'Doğa' },
  { value: 'accommodation', label: 'Konaklama' },
];

const languages = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
] as const;

const authoritativeTurkishFields = new Set(['name', 'description', 'longDescription']);
const authoritativeLocalizedDescriptionFields = new Set(
  ['description', 'longDescription'].flatMap(field =>
    ['en', 'fr', 'de'].map(language => `${field}_${language}`)
  )
);

function createEmptyPoi(): PoiForm {
  return {
    id: '',
    slug: '',
    name: '',
    description: '',
    longDescription: '',
    category: 'geopark',
    imageId: PlaceHolderImages[0]?.id ?? '',
    latitude: '',
    longitude: '',
  };
}

function toPoiForm(poi: PointOfInterest): PoiForm {
  return {
    ...poi,
    latitude: String(poi.latitude),
    longitude: String(poi.longitude),
  };
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

function OptionalField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`poi-${label.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9]+/g, '-')}`}>{label}</Label>
      <Input
        id={`poi-${label.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9]+/g, '-')}`}
        type={type}
        value={value ?? ''}
        onChange={event => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}

export default function AdminPoisDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [form, setForm] = useState<PoiForm>(createEmptyPoi);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshPois = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const refreshedPois = await getPois('tr');
      setPois(refreshedPois);
      return refreshedPois;
    } catch (error) {
      console.error('Failed to load POIs for admin:', error);
      setLoadError('POI verileri yüklenemedi. Firestore erişim kurallarını kontrol edip tekrar deneyin.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPois();
  }, [refreshPois]);

  const visiblePois = useMemo(() => {
    const queryText = search.trim().toLocaleLowerCase('tr-TR');
    return pois.filter(poi =>
      `${poi.name} ${poi.slug} ${poi.category}`.toLocaleLowerCase('tr-TR').includes(queryText)
    );
  }, [pois, search]);

  const setField = <K extends keyof PoiForm>(key: K, value: PoiForm[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const startNewPoi = () => setForm(createEmptyPoi());

  const syncBundledPoiData = async () => {
    setIsSyncingData(true);
    try {
      const poiCollection = collection(firestore, 'pois');
      const snapshot = await getDocs(poiCollection);
      const existingDocs = new Map(snapshot.docs.map(poiDoc => [poiDoc.id, poiDoc]));
      const batch = writeBatch(firestore);
      let updatedCount = 0;
      let restoredCount = 0;

      for (const bundledPoi of bundledPoisData.pois as PointOfInterest[]) {
        const existingDoc = existingDocs.get(bundledPoi.id);
        const existingData = existingDoc?.data();

        const fieldsToSync = Object.fromEntries(
          Object.entries(bundledPoi).filter(([key, value]) => {
            if (
              value === undefined ||
              value === null ||
              value === '' ||
              (typeof value === 'string' && !value.trim())
            ) return false;
            if (
              authoritativeTurkishFields.has(key) ||
              authoritativeLocalizedDescriptionFields.has(key)
            ) return true;
            const existingValue = existingData?.[key];
            return existingValue === undefined ||
              existingValue === null ||
              existingValue === '' ||
              (typeof existingValue === 'string' && !existingValue.trim());
          })
        );

        if (Object.keys(fieldsToSync).length === 0) continue;

        const poiRef = doc(poiCollection, bundledPoi.id);
        if (existingDoc) {
          batch.set(poiRef, {
            ...fieldsToSync,
            ...(existingData?.deleted === true ? { deleted: false } : {}),
          }, { merge: true });
        } else {
          batch.set(poiRef, { ...bundledPoi, deleted: false });
        }
        updatedCount++;
        if (existingData?.deleted === true) restoredCount++;
      }

      if (updatedCount > 0) await batch.commit();
      const refreshedPois = await refreshPois();
      const selectedPoi = refreshedPois?.find(poi => poi.id === form.id);
      if (selectedPoi) setForm(toPoiForm(selectedPoi));
      toast({
        title: updatedCount > 0 ? 'JSON verileri aktarıldı' : 'Veriler güncel',
        description: updatedCount > 0
          ? `${updatedCount} POI’nin Türkçe ve EN/FR/DE kısa/uzun açıklamaları kula-pois.json ile güncellendi. ${restoredCount > 0 ? `${restoredCount} silinmiş POI geri yüklendi. ` : ''}Çevrilmiş adlar ve diğer alanlar korundu.`
          : 'POI verileri kula-pois.json ile güncel.',
      });
    } catch (error) {
      console.error('Failed to sync bundled POI data:', error);
      toast({
        title: 'JSON verileri aktarılamadı',
        description: 'Firestore erişimini kontrol edin. Güvenlik kuralları yayınlanmış olmalı.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingData(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = form.slug.trim().toLocaleLowerCase('en-US');
    const name = form.name.trim();
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!name || !slug || !form.description.trim() || !form.longDescription.trim()) {
      toast({
        title: 'Eksik bilgi',
        description: 'Türkçe ad, kısa açıklama, detaylı açıklama ve bağlantı adresi zorunludur.',
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

    if (!form.latitude.trim() || !form.longitude.trim() ||
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      toast({
        title: 'Koordinat hatalı',
        description: 'Enlem -90 ile 90, boylam -180 ile 180 arasında olmalıdır.',
        variant: 'destructive',
      });
      return;
    }

    if (pois.some(poi => poi.slug === slug && poi.id !== form.id)) {
      toast({
        title: 'Bağlantı adresi kullanılıyor',
        description: 'Her POI için benzersiz bir slug girin.',
        variant: 'destructive',
      });
      return;
    }

    const id = form.id || `poi-${crypto.randomUUID()}`;
    const { id: _formId, ...formValues } = form;
    const poiData = Object.fromEntries(
      Object.entries({
        ...formValues,
        name,
        slug,
        description: form.description.trim(),
        longDescription: form.longDescription.trim(),
        latitude,
        longitude,
        mapQuery: form.mapQuery?.trim() || undefined,
        badgeId: form.badgeId?.trim() || undefined,
        points: form.points,
      }).filter(([, value]) => value !== undefined && value !== '')
    );

    setIsSaving(true);
    try {
      await setDoc(doc(collection(firestore, 'pois'), id), {
        ...poiData,
        id,
        deleted: false,
      });
      const savedPoi = { ...poiData, id } as PointOfInterest;
      setForm(toPoiForm(savedPoi));
      await refreshPois();
      toast({
        title: 'POI kaydedildi',
        description: 'Değişiklikler site içeriklerinde kullanılmaya hazır.',
      });
    } catch (error) {
      console.error('Failed to save POI:', error);
      toast({
        title: 'Kaydetme başarısız',
        description: 'POI kaydedilemedi. Firebase bağlantısını ve Firestore yetkilerini kontrol edin.',
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
      await setDoc(doc(firestore, 'pois', form.id), { deleted: true });
      setForm(createEmptyPoi());
      await refreshPois();
      toast({ title: 'POI silindi', description: 'Bu nokta artık ziyaretçilere gösterilmeyecek.' });
    } catch (error) {
      console.error('Failed to delete POI:', error);
      toast({
        title: 'Silme başarısız',
        description: 'POI silinemedi. Firestore yetkilerini kontrol edin.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>Yönetim paneli</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">POI Yönetimi</h1>
          <p className="mt-1 text-muted-foreground">Sitedeki gezi noktalarını ekleyin ve düzenleyin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isSyncingData || isSaving || isDeleting}
              >
                {isSyncingData
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Languages className="mr-2 h-4 w-4" />}
                POI verilerini JSON ile eşitle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>POI açıklamalarını JSON ile güncelle?</AlertDialogTitle>
                <AlertDialogDescription>
                  Yerleşik POI’lerin Türkçe ad ve kısa/uzun açıklamaları ile İngilizce, Fransızca ve Almanca kısa/uzun açıklamaları JSON’daki metinlerle değiştirilecek. Çevrilmiş adlar ve diğer alanlar korunacak; silinmiş yerleşik POI’ler geri yüklenecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={() => void syncBundledPoiData()}>
                  Açıklamaları güncelle
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={startNewPoi}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni POI
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gezi noktaları</CardTitle>
            <CardDescription>{pois.length} POI</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Ad veya slug ara"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[70vh] space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : loadError ? (
              <div className="space-y-3 text-sm text-destructive">
                <p>{loadError}</p>
                <Button variant="outline" onClick={() => void refreshPois()}>Tekrar dene</Button>
              </div>
            ) : visiblePois.map(poi => (
              <button
                key={poi.id}
                type="button"
                onClick={() => setForm(toPoiForm(poi))}
                className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent ${
                  form.id === poi.id ? 'border-primary bg-accent' : ''
                }`}
              >
                <span className="block font-medium">{poi.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{poi.slug}</span>
              </button>
            ))}
            {!isLoading && !loadError && visiblePois.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">POI bulunamadı.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{form.id ? 'POI düzenle' : 'Yeni POI ekle'}</CardTitle>
            <CardDescription>
              Türkçe alanlar zorunludur. Diğer diller boş bırakılırsa Türkçe içerik kullanılır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="poi-name">Türkçe ad *</Label>
                  <Input id="poi-name" value={form.name} onChange={event => setField('name', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poi-slug">Slug *</Label>
                  <div className="flex gap-2">
                    <Input id="poi-slug" value={form.slug} onChange={event => setField('slug', event.target.value)} required />
                    <Button type="button" variant="outline" onClick={() => setField('slug', makeSlug(form.name))}>Oluştur</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poi-category">Kategori</Label>
                  <select
                    id="poi-category"
                    value={form.category}
                    onChange={event => setField('category', event.target.value as PointOfInterest['category'])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {categories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poi-image">Görsel</Label>
                  <select
                    id="poi-image"
                    value={form.imageId}
                    onChange={event => setField('imageId', event.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {!PlaceHolderImages.some(image => image.id === form.imageId) && (
                      <option value={form.imageId}>{form.imageId} (mevcut görsel)</option>
                    )}
                    {PlaceHolderImages.map(image => <option key={image.id} value={image.id}>{image.description}</option>)}
                  </select>
                </div>
                <OptionalField label="Enlem" type="number" value={form.latitude} onChange={value => setField('latitude', value)} required />
                <OptionalField label="Boylam" type="number" value={form.longitude} onChange={value => setField('longitude', value)} required />
                <div className="sm:col-span-2">
                  <OptionalField label="Harita arama metni (isteğe bağlı)" value={form.mapQuery} onChange={value => setField('mapQuery', value)} />
                </div>
              </div>

              <Tabs defaultValue="tr">
                <TabsList className="grid w-full grid-cols-4">
                  {languages.map(language => (
                    <TabsTrigger key={language.code} value={language.code}>{language.label}</TabsTrigger>
                  ))}
                </TabsList>
                {languages.map(language => {
                  const suffix = language.code === 'tr' ? '' : `_${language.code}`;
                  const nameKey = `name${suffix}` as keyof PoiForm;
                  const descriptionKey = `description${suffix}` as keyof PoiForm;
                  const longDescriptionKey = `longDescription${suffix}` as keyof PoiForm;
                  return (
                    <TabsContent key={language.code} value={language.code} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>{language.label} adı{language.code === 'tr' ? ' *' : ''}</Label>
                        <Input
                          value={String(form[nameKey] ?? '')}
                          onChange={event => setField(nameKey, event.target.value as PoiForm[typeof nameKey])}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kısa açıklama (1–2 cümle){language.code === 'tr' ? ' *' : ''}</Label>
                        <Textarea
                          value={String(form[descriptionKey] ?? '')}
                          onChange={event => setField(descriptionKey, event.target.value as PoiForm[typeof descriptionKey])}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground">Mekân kartlarında gösterilir.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Tam açıklama{language.code === 'tr' ? ' *' : ''}</Label>
                        <Textarea
                          value={String(form[longDescriptionKey] ?? '')}
                          onChange={event => setField(longDescriptionKey, event.target.value as PoiForm[typeof longDescriptionKey])}
                          rows={7}
                        />
                        <p className="text-xs text-muted-foreground">POI detay sayfasında yazının tamamı gösterilir.</p>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>

              <div className="grid gap-4 sm:grid-cols-2">
                <OptionalField label="Rozet kimliği (isteğe bağlı)" value={form.badgeId} onChange={value => setField('badgeId', value)} />
                <OptionalField label="Rozet puanı" type="number" value={form.points} onChange={value => setField('points', value === '' ? undefined : Number(value))} />
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.hideStreetView ?? false}
                    onChange={event => setField('hideStreetView', event.target.checked)}
                    className="h-4 w-4"
                  />
                  Bu POI için Street View gösterme
                </label>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
                {form.id ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isSaving || isDeleting}>
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        POI sil
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>POI silinsin mi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          “{form.name}” ziyaretçi sayfalarından kaldırılacak. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : <span />}
                <Button type="submit" disabled={isSaving || isDeleting || isLoading}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Kaydet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
