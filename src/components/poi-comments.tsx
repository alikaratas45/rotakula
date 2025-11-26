'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const locales: { [key: string]: Locale } = { tr, en: enUS };

const commentSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yorum yazın.'),
});

type CommentFormValues = z.infer<typeof commentSchema>;
type Comment = CommentFormValues & {
  id: string;
  poiId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

function CommentItem({ comment }: { comment: Comment }) {
  const { language } = useApp();
  const displayDate = useMemo(() => {
    if (!comment.createdAt?.seconds) {
      return 'az önce';
    }
    const date = new Date(comment.createdAt.seconds * 1000);
    const locale = locales[language] || enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale: locale });
  }, [comment.createdAt, language]);

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
  
  const commentsQuery = useMemoFirebase(() => {
    const commentsCollection = collection(firestore, 'poi_comments');
    return query(commentsCollection, where('poiId', '==', poiId), orderBy('createdAt', 'desc'));
  }, [firestore, poiId]);

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
  const { translations } = useApp();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      name: '',
      message: '',
    },
  });

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    setIsSubmitting(true);
    const commentsCollection = collection(firestore, 'poi_comments');
    const newComment = {
      ...data,
      poiId: poiId,
      createdAt: new Date(),
    };
    
    await addDocumentNonBlocking(commentsCollection, newComment);

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

export function PoiComments({ poiId }: { poiId: string }) {
    return (
        <div className="space-y-8">
            <CommentForm poiId={poiId} />
            <CommentList poiId={poiId} />
        </div>
    );
}