'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useApp } from '@/context/app-context';

const locales: { [key: string]: Locale } = { tr, en: enUS };

const feedbackSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yorum yazın.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;
type Feedback = FeedbackFormValues & {
  id: string;
  poiId?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const { language } = useApp();
  const displayDate = useMemo(() => {
    if (!feedback.createdAt?.seconds) {
      return 'az önce';
    }
    const date = new Date(feedback.createdAt.seconds * 1000);
    const locale = locales[language] || enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale: locale });
  }, [feedback.createdAt, language]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{feedback.name || 'Anonim'}</CardTitle>
          <CardDescription>{displayDate}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{feedback.message}</p>
      </CardContent>
    </Card>
  );
}

function FeedbackList({ isLimited, poiId }: { isLimited?: boolean; poiId?: string; }) {
  const { translations } = useApp();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // This is now a placeholder. It will not fetch from Firebase.
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && feedback.length > 0 ? (
        feedback.map((item) => <FeedbackItem key={item.id} feedback={item} />)
      ) : (
        <p className="text-center text-muted-foreground">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      )}
    </div>
  );
}

function FeedbackForm({ poiId }: { poiId?: string }) {
  const { translations } = useApp();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  // This function now only simulates submission.
  const onSubmit: SubmitHandler<FeedbackFormValues> = async (data) => {
    setIsSubmitting(true);
    
    // Simulate a network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Simulated feedback submission:', { ...data, poiId: poiId || null });

    setIsSubmitted(true);
    form.reset();
    setTimeout(() => setIsSubmitted(false), 3000);
    setIsSubmitting(false);
  };

  const title = poiId ? translations.comments.title : 'Site Hakkında Görüşleriniz';
  const description = poiId ? translations.comments.description : 'Uygulama hakkındaki düşüncelerinizi bizimle paylaşın.';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.comments.nameLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={translations.comments.namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.comments.messageLabel}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={translations.comments.messagePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isSubmitted}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.comments.sending}
                </>
              ) : isSubmitted ? (
                translations.comments.sent
              ) : (
                translations.comments.submit
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export function FeedbackSection({ isLimited = false, poiId }: { isLimited?: boolean; poiId?: string }) {
    const isPoiCommentSection = !!poiId;

    return (
        <div className="space-y-8">
            <FeedbackForm poiId={poiId} />
            <FeedbackList isLimited={isLimited} poiId={poiId} />
             {isLimited && !isPoiCommentSection && (
                <div className="flex justify-center pt-4">
                  <Button asChild>
                      <Link href="/feedback">Tüm Yorumları Gör</Link>
                  </Button>
                </div>
            )}
        </div>
    );
}
