'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Star } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

const surveySchema = z.object({
  cleanliness: z.number().min(1, 'Puanlama zorunludur.'),
  guidance: z.number().min(1, 'Puanlama zorunludur.'),
  staffing: z.number().min(1, 'Puanlama zorunludur.'),
  transportation: z.number().min(1, 'Puanlama zorunludur.'),
  overall: z.number().min(1, 'Puanlama zorunludur.'),
  comment: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

interface StarRatingRowProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function StarRatingRow({ label, value, onChange }: StarRatingRowProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
      <FormLabel className="text-base sm:text-sm font-medium whitespace-nowrap">{label}</FormLabel>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-8 w-8 cursor-pointer transition-colors',
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50 hover:text-yellow-300'
            )}
            onClick={() => onChange(star)}
          />
        ))}
      </div>
    </div>
  );
}


export function Survey({ poiId, poiName }: { poiId: string; poiName: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      cleanliness: 0,
      guidance: 0,
      staffing: 0,
      transportation: 0,
      overall: 0,
      comment: '',
    },
  });

  const onSubmit: SubmitHandler<SurveyFormValues> = async (data) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Anketi göndermek için anonim olarak oturum açmış olmanız gerekir.',
      });
      return;
    }
    setIsSubmitting(true);
    const surveysCollection = collection(firestore, 'surveys');
    const newSurvey = {
      ...data,
      poiId,
      poiName,
      userId: user.uid,
      createdAt: new Date(),
    };
    
    await addDocumentNonBlocking(surveysCollection, newSurvey);

    setIsSubmitting(false);
    setIsSubmitted(true);
    form.reset();
  };

  if (isSubmitted) {
    return (
      <Card className="bg-muted/50 text-center">
        <CardHeader>
          <CardTitle>Görüşleriniz İçin Teşekkür Ederiz!</CardTitle>
          <CardDescription>Ankete katılımınız, Kula'yı daha iyi bir yer haline getirmemize yardımcı oluyor.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deneyiminizi Değerlendirin</CardTitle>
        <CardDescription>Bu yer hakkındaki düşüncelerinizi bizimle paylaşarak gezi deneyimini geliştirmemize yardımcı olun.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <FormField
              control={form.control}
              name="cleanliness"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Temizlik" value={field.value} onChange={field.onChange} />
                   <FormMessage className="text-right" />
                </FormItem>
              )}
            />
             <Separator />
             <FormField
              control={form.control}
              name="guidance"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Rehberlik Hizmeti" value={field.value} onChange={field.onChange} />
                   <FormMessage className="text-right" />
                </FormItem>
              )}
            />
             <Separator />
             <FormField
              control={form.control}
              name="staffing"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Personel Durumu" value={field.value} onChange={field.onChange} />
                   <FormMessage className="text-right" />
                </FormItem>
              )}
            />
             <Separator />
             <FormField
              control={form.control}
              name="transportation"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Ulaşım Kolaylığı" value={field.value} onChange={field.onChange} />
                   <FormMessage className="text-right" />
                </FormItem>
              )}
            />
             <Separator />
             <FormField
              control={form.control}
              name="overall"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Genel Değerlendirme" value={field.value} onChange={field.onChange} />
                   <FormMessage className="text-right" />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ek Yorumlarınız (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deneyiminizle ilgili eklemek istediğiniz başka bir şey var mı?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anketi Gönder
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
