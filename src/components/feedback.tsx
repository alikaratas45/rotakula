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
import { tr, enUS, fr, de } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import { addDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

const locales: { [key: string]: Locale } = { tr, en: enUS, fr, de };

const feedbackSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yorum yazın.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;
type Feedback = FeedbackFormValues & {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const { language, translations } = useApp();
  const displayDate = useMemo(() => {
    if (!feedback.createdAt?.seconds) {
      return translations.comments.justNow;
    }
    const date = new Date(feedback.createdAt.seconds * 1000);
    const locale = locales[language] || tr;
    return formatDistanceToNow(date, { addSuffix: true, locale: locale });
  }, [feedback.createdAt, language, translations]);

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

function FeedbackList({ isLimited }: { isLimited?: boolean }) {
  const { translations } = useApp();
  const firestore = useFirestore();

  const feedbackQuery = useMemoFirebase(() => {
    let q = query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
    if (isLimited) {
      q = query(q, limit(3));
    }
    return q;
  }, [firestore, isLimited]);

  const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

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
          {translations.comments.noComments}
        </p>
      )}
    </div>
  );
}

function FeedbackForm() {
  const { translations } = useApp();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const onSubmit: SubmitHandler<FeedbackFormValues> = async (data) => {
    setIsSubmitting(true);
    
    const feedbackCollection = collection(firestore, 'feedback');
    addDocumentNonBlocking(feedbackCollection, {
      ...data,
      createdAt: new Date(),
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    form.reset();
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.comments.title}</CardTitle>
        <CardDescription>{translations.comments.description}</CardDescription>
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

export function FeedbackSection({ isLimited = false }: { isLimited?: boolean }) {
    const { translations } = useApp();
    return (
        <div className="space-y-8">
            {!isLimited && <FeedbackForm />}
            <FeedbackList isLimited={isLimited} />
             {isLimited && (
                <div className="flex flex-col items-center gap-2 pt-4">
                  <Button asChild>
                      <Link href="/feedback">{(translations.nav as any).makeComment || 'Yorum Yap'}</Link>
                  </Button>
                  <Button asChild variant="outline">
                      <Link href="/feedback">{translations.nav.seeAllComments}</Link>
                  </Button>
                </div>
            )}
        </div>
    );
}
