
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Star } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const surveySchema = z.object({
  rating: z.number().min(1, 'Lütfen 1-5 arası bir puan verin.'),
  comment: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-8 w-8 cursor-pointer transition-colors',
            star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'
          )}
          onClick={() => onChange(star)}
        />
      ))}
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
      rating: 0,
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
      <Card className="bg-muted/50">
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
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puanınız</FormLabel>
                  <FormControl>
                    <StarRating value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yorumunuz (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deneyiminizi birkaç kelimeyle anlatın..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <div className="p-6 pt-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anketi Gönder
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
