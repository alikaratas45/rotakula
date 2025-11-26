
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
  where,
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
import { tr } from 'date-fns/locale';
import { useApp } from '@/context/app-context';

// Zod schema for form validation
const commentSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yorum yazın.'),
});

type CommentFormValues = z.infer<typeof commentSchema>;
type Comment = CommentFormValues & {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

function CommentItem({ comment }: { comment: Comment }) {
  const displayDate = useMemo(() => {
    if (!comment.createdAt?.seconds) {
      return 'az önce';
    }
    const date = new Date(comment.createdAt.seconds * 1000);
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  }, [comment.createdAt]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{comment.name || 'Anonim'}</CardTitle>
          <CardDescription>{displayDate}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{comment.message}</p>
      </CardContent>
    </Card>
  );
}

function CommentList({ poiId }: { poiId: string }) {
  const firestore = useFirestore();

  const commentsQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(
        collection(firestore, 'poi_comments'),
        where('poiId', '==', poiId),
        orderBy('createdAt', 'desc')
      );
    },
    [firestore, poiId]
  );

  const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 ? (
        comments.map((item) => <CommentItem key={item.id} comment={item} />)
      ) : (
        <p className="text-center text-muted-foreground">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      )}
    </div>
  );
}

function CommentForm({ poiId }: { poiId: string }) {
  const firestore = useFirestore();
  const commentsColRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'poi_comments') : null),
    [firestore]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { translations } = useApp();
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    if (!commentsColRef) return;
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(commentsColRef, {
        ...data,
        poiId,
        name: data.name || 'Anonim',
        createdAt: serverTimestamp(),
      });
      setIsSubmitted(true);
      form.reset();
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translations.comments.title}</CardTitle>
        <CardDescription>
          {translations.comments.description}
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

export function PoiComments({ poiId }: { poiId: string }) {
    return (
        <div className="space-y-8">
            <CommentForm poiId={poiId} />
            <CommentList poiId={poiId} />
        </div>
    );
}
