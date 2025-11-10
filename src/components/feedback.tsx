
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
  doc,
  limit,
  getCountFromServer
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser,
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
import { Loader2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Zod schema for form validation
const feedbackSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
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

// Admin UID is set here.
const ADMIN_UID = 'UXt4xEAkIwUSAQXvaM4pngZCBtI3';

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const displayDate = useMemo(() => {
    if (!feedback.createdAt?.seconds) {
      return 'biraz önce';
    }
    const date = new Date(feedback.createdAt.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  }, [feedback.createdAt]);

  const handleDelete = () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'feedback', feedback.id);
    deleteDocumentNonBlocking(docRef);
  };
  
  const isAdmin = user && user.uid === ADMIN_UID;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{feedback.name}</CardTitle>
          <div className="flex items-center gap-4">
            <CardDescription>{displayDate}</CardDescription>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
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
      const baseQuery = query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
      return isLimited ? query(baseQuery, limit(5)) : baseQuery;
    },
    [firestore, isLimited]
  );

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
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      form.reset();
      setTimeout(() => setIsSubmitted(false), 3000); // Reset form after 3s
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
                  <FormLabel>İsminiz</FormLabel>
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

export function FeedbackSection({ isLimited = false }: { isLimited?: boolean }) {
    const firestore = useFirestore();
    const [totalFeedback, setTotalFeedback] = useState(0);

    useEffect(() => {
        if (isLimited && firestore) {
            const feedbackColRef = collection(firestore, 'feedback');
            getCountFromServer(feedbackColRef).then(snapshot => {
                setTotalFeedback(snapshot.data().count);
            });
        }
    }, [isLimited, firestore]);

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
