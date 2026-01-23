
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
import { useApp } from '@/context/app-context';
import { addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Survey = ({ poiId, poiName, onSubmitted }: { poiId: string; poiName: string; onSubmitted?: () => void; }) => {
  const { translations } = useApp();
  const firestore = useFirestore();
  
  const surveySchema = z.object({
    guidance: z.enum(['yes', 'no'], {
      required_error: translations.survey.requiredError,
    }),
    staffing: z.enum(['yes', 'no'], {
      required_error: translations.survey.requiredError,
    }),
    cleanliness: z.number().min(1, translations.survey.ratingRequiredError),
    transportation: z.number().min(1, translations.survey.ratingRequiredError),
    overall: z.number().min(1, translations.survey.ratingRequiredError),
    comment: z.string().optional(),
  });

  type SurveyFormValues = z.infer<typeof surveySchema>;

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const submittedSurveys = JSON.parse(localStorage.getItem('kula-submitted-surveys') || '{}');
        if (submittedSurveys[poiId]) {
          setIsSubmitted(true);
        }
    }
  }, [poiId]);


  const onSubmit: SubmitHandler<SurveyFormValues> = async (data) => {
    setIsSubmitting(true);
    
    if (!firestore) {
        console.error("Firestore is not initialized.");
        setIsSubmitting(false);
        return;
    }

    const surveyData = {
        ...data,
        poiId: poiId,
        poiName: poiName,
        guidance: data.guidance === 'yes',
        staffing: data.staffing === 'yes',
        createdAt: serverTimestamp(),
    };
    
    addDocumentNonBlocking(collection(firestore, 'surveys'), surveyData);

    toast({
        title: translations.survey.thanksTitle,
        description: translations.survey.feedbackThanksDescription,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);

    if (typeof window !== 'undefined') {
        const submittedSurveys = JSON.parse(localStorage.getItem('kula-submitted-surveys') || '{}');
        submittedSurveys[poiId] = true;
        localStorage.setItem('kula-submitted-surveys', JSON.stringify(submittedSurveys));
    }
    
    form.reset();
    if(onSubmitted) {
        setTimeout(onSubmitted, 1500);
    }
  };
  
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
                      <Label htmlFor={`${label}-yes`}>{translations.survey.yes}</Label>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                      <FormControl>
                          <RadioGroupItem value="no" id={`${label}-no`} />
                      </FormControl>
                      <Label htmlFor={`${label}-no`}>{translations.survey.no}</Label>
                  </FormItem>
              </RadioGroup>
          </div>
      )
  }

  if (isSubmitted) {
    return (
      <Card className="bg-muted/50 text-center border-none shadow-none">
        <CardHeader>
          <CardTitle>{translations.survey.thanksTitle}</CardTitle>
          <CardDescription>{translations.survey.thanksDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 p-0">
             <FormField
              control={form.control}
              name="guidance"
              render={({ field }) => (
                <FormItem>
                   <YesNoQuestionRow label={translations.survey.guidanceLabel} value={field.value} onChange={field.onChange} />
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
                   <YesNoQuestionRow label={translations.survey.staffingLabel} value={field.value} onChange={field.onChange} />
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
                   <StarRatingRow label={translations.survey.cleanlinessLabel} value={field.value} onChange={field.onChange} />
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
                   <StarRatingRow label={translations.survey.transportationLabel} value={field.value} onChange={field.onChange} />
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
                   <StarRatingRow label={translations.survey.overallLabel} value={field.value} onChange={field.onChange} />
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
                  <FormLabel>{translations.survey.commentLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={translations.survey.commentPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="px-0 pt-6">
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? translations.survey.submittingButton : translations.survey.submitButton}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
