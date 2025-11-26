'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
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

// Zod schema for form validation
const feedbackSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;
type Feedback = FeedbackFormValues & {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

const PINNED_FEEDBACK_ID = 'z4H1pYyRT9h9Qv5s2j6S'; // ID of the comment to pin

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const { language } = useApp();
  const displayDate = useMemo(() => {
    if (!feedback.createdAt?.seconds) {
      return 'biraz önce';
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

function FeedbackList({ isLimited }: { isLimited?: boolean }) {
  const firestore = useFirestore();

  const feedbackQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
    },
    [firestore]
  );

  const { data: feedback, isLoading } = useCollection<Feedback>(feedbackQuery);

  const processedFeedback = useMemo(() => {
    if (!feedback) return [];
    
    const pinned = feedback.find(item => item.id === PINNED_FEEDBACK_ID);
    const others = feedback.filter(item => item.id !== PINNED_FEEDBACK_ID);
    
    const sortedList = pinned ? [pinned, ...others] : others;
    
    return isLimited ? sortedList.slice(0, 5) : sortedList;

  }, [feedback, isLimited]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {processedFeedback && processedFeedback.length > 0 ? (
        processedFeedback.map((item) => <FeedbackItem key={item.id} feedback={item} />)
      ) : (
        <p className="text-center text-muted-foreground">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      )}
    </div>
  );
}

function FeedbackForm() {
  const firestore = useFirestore();
  const feedbackColRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'feedback') : null),
    [firestore]
  );
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
    if (!feedbackColRef) return;
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(feedbackColRef, {
        ...data,
        name: data.name || 'Anonim',
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      form.reset();
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Hakkında Görüşleriniz</CardTitle>
        <CardDescription>
          Uygulama hakkındaki düşüncelerinizi bizimle paylaşın.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsminiz (İsteğe Bağlı)</FormLabel>
                  <FormControl>
                    <Input placeholder="Adınız Soyadınız" {...field} />
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
                  <FormLabel>Mesajınız</FormLabel>
                  <FormControl>
                    <Textarea placeholder="İstek veya yorumunuzu buraya yazın..." {...field} />
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
                  Gönderiliyor...
                </>
              ) : isSubmitted ? (
                'Gönderildi!'
              ) : (
                'Gönder'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export function FeedbackSection({ isLimited = false, poiId }: { isLimited?: boolean; poiId?: string }) {
    const firestore = useFirestore();
    const [totalFeedback, setTotalFeedback] = useState(0);

    useEffect(() => {
        if (firestore) {
            const feedbackColRef = collection(firestore, 'feedback');
            getCountFromServer(feedbackColRef).then(snapshot => {
                setTotalFeedback(snapshot.data().count);
            });
        }
    }, [firestore]);

    if (poiId) {
      return null; // This component will not handle POI comments.
    }

    return (
        <div className="space-y-8">
            <FeedbackForm />
            <FeedbackList isLimited={isLimited} />
             {isLimited && totalFeedback > 5 && (
                <div className="flex justify-center pt-4">
                  <Button asChild>
                      <Link href="/feedback">Tüm Yorumları Gör</Link>
                  </Button>
                </div>
            )}
        </div>
    );
}
