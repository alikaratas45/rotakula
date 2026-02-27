
'use client';

import { BackButton } from '@/components/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '../features/copy-button';

const surveyComponentCode = `
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Label } from '@/components/ui/label';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

// 1. ŞEMA TANIMI
const surveySchema = z.object({
  guidance: z.enum(['yes', 'no'], { required_error: "Lütfen seçin" }),
  staffing: z.enum(['yes', 'no'], { required_error: "Lütfen seçin" }),
  cleanliness: z.number().min(1, "Puanlama zorunludur"),
  transportation: z.number().min(1, "Puanlama zorunludur"),
  overall: z.number().min(1, "Puanlama zorunludur"),
  comment: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

export const Survey = ({ poiId, poiName }: { poiId: string; poiName: string }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: { cleanliness: 0, transportation: 0, overall: 0, comment: '' },
  });

  // 2. MÜKERRER KAYIT KONTROLÜ
  useEffect(() => {
    const submittedSurveys = JSON.parse(localStorage.getItem('submitted-surveys') || '{}');
    if (submittedSurveys[poiId]) setIsSubmitted(true);
  }, [poiId]);

  const onSubmit: SubmitHandler<SurveyFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'surveys'), {
        ...data,
        poiId,
        poiName,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Teşekkürler", description: "Geri bildiriminiz alındı." });
      setIsSubmitted(true);
      const submittedSurveys = JSON.parse(localStorage.getItem('submitted-surveys') || '{}');
      submittedSurveys[poiId] = true;
      localStorage.setItem('submitted-surveys', JSON.stringify(submittedSurveys));
    } catch (e) {
      toast({ title: "Hata", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) return <p>Bu yer için anket doldurdunuz. Teşekkürler!</p>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form Alanları Buraya Gelecek (Yıldızlar, Radio vb) */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Gönderiliyor..." : "Anketi Gönder"}
        </Button>
      </form>
    </Form>
  );
};
`;

export default function SurveyCodePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton className="mb-8" />
      <h1 className="text-3xl font-bold font-headline mb-4">Anket Sistemi Aktarım Rehberi</h1>
      <p className="text-muted-foreground mb-8">
        Bu kodları <strong>Rota Salihli</strong> projenize kopyalayarak anket sistemini birebir çalıştırabilirsiniz.
      </p>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">1. Survey Bileşeni (React + Firebase)</h2>
            <CopyButton textToCopy={surveyComponentCode} />
          </div>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
            <code>{surveyComponentCode}</code>
          </pre>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Gereksinimler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>NPM Paketleri:</strong></p>
            <code className="block bg-black text-white p-2 rounded">npm install react-hook-form zod @hookform/resolvers lucide-react</code>
            
            <p><strong>Firestore Koleksiyonu:</strong></p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Adı: <code>surveys</code></li>
              <li>Alanlar: <code>poiId, poiName, cleanliness, transportation, overall, guidance, staffing, comment, createdAt</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
