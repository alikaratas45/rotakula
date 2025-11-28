'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Star, Check, X } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

const surveySchema = z.object({
  guidance: z.enum(['yes', 'no'], {
    required_error: "Lütfen bir seçim yapın.",
  }),
  staffing: z.enum(['yes', 'no'], {
    required_error: "Lütfen bir seçim yapın.",
  }),
  cleanliness: z.number().min(1, 'Puanlama zorunludur.'),
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 py-2">
      <FormLabel className="text-base sm:text-sm font-medium">{label}</FormLabel>
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

interface YesNoQuestionRowProps {
    label: string;
    value: 'yes' | 'no' | undefined;
    onChange: (value: 'yes' | 'no') => void;
}

function YesNoQuestionRow({ label, value, onChange }: YesNoQuestionRowProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 py-2">
            <FormLabel className="text-base sm:text-sm font-medium">{label}</FormLabel>
             <RadioGroup
                value={value}
                onValueChange={onChange}
                className="flex gap-4"
            >
                <FormItem className="flex items-center space-x-2">
                    <FormControl>
                        <RadioGroupItem value="yes" id={`${label}-yes`} />
                    </FormControl>
                    <Label htmlFor={`${label}-yes`}>Evet</Label>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                    <FormControl>
                        <RadioGroupItem value="no" id={`${label}-no`} />
                    </FormControl>
                    <Label htmlFor={`${label}-no`}>Hayır</Label>
                </FormItem>
            </RadioGroup>
        </div>
    )
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
    
    // Convert 'yes'/'no' to boolean
    const newSurveyData = {
      ...data,
      guidance: data.guidance === 'yes',
      staffing: data.staffing === 'yes',
      poiId,
      poiName,
      userId: user.uid,
      createdAt: new Date(),
    };
    
    await addDocumentNonBlocking(surveysCollection, newSurveyData);

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
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="guidance"
              render={({ field }) => (
                <FormItem>
                   <YesNoQuestionRow label="Rehberlik hizmeti aldınız mı?" value={field.value} onChange={field.onChange} />
                   <FormMessage />
                </FormItem>
              )}
            />
             <Separator />
             <FormField
              control={form.control}
              name="staffing"
              render={({ field }) => (
                <FormItem>
                   <YesNoQuestionRow label="Sizinle ilgilenen bir personel oldu mu?" value={field.value} onChange={field.onChange} />
                   <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
             <FormField
              control={form.control}
              name="cleanliness"
              render={({ field }) => (
                <FormItem>
                   <StarRatingRow label="Alanın temizliğini değerlendirin (5 üzerinden)" value={field.value} onChange={field.onChange} />
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
                   <StarRatingRow label="Bu alana ulaşım kolaylığını değerlendirin" value={field.value} onChange={field.onChange} />
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
                   <StarRatingRow label="Genel değerlendirmeniz nedir?" value={field.value} onChange={field.onChange} />
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
