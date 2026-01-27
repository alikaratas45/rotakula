
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Loader2, ThumbsUp, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr, enUS, fr, de } from 'date-fns/locale';
import { useApp } from '@/context/app-context';
import { addDocumentNonBlocking, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, doc, increment, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

const locales: { [key: string]: Locale } = { tr, en: enUS, fr, de };

const feedbackSchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yorum yazın.'),
});

const replySchema = z.object({
  name: z.string().optional(),
  message: z.string().min(1, 'Lütfen bir yanıt yazın.'),
});


type FeedbackFormValues = z.infer<typeof feedbackSchema>;
type ReplyFormValues = z.infer<typeof replySchema>;

type Reply = {
  name?: string;
  message: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
}

type Feedback = FeedbackFormValues & {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  likes?: number;
  replies?: Reply[];
};

function ReplyItem({ reply }: { reply: Reply }) {
    const { language } = useApp();
    const displayDate = useMemo(() => {
        if (!reply.createdAt) return '';
        const date = reply.createdAt instanceof Date ? reply.createdAt : new Date(reply.createdAt.seconds * 1000);
        const locale = locales[language] || tr;
        return formatDistanceToNow(date, { addSuffix: true, locale });
    }, [reply.createdAt, language]);

    return (
        <div className="flex items-start gap-3 my-4">
            <Avatar className="h-8 w-8">
                <AvatarFallback>{(reply.name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{reply.name || 'Anonim'}</p>
                    <p className="text-xs text-muted-foreground">{displayDate}</p>
                </div>
                <p className="text-sm text-muted-foreground">{reply.message}</p>
            </div>
        </div>
    );
}


function ReplyForm({ feedbackId, onSubmitted }: { feedbackId: string; onSubmitted: () => void }) {
    const { translations } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ReplyFormValues>({
        resolver: zodResolver(replySchema),
        defaultValues: { name: '', message: '' },
    });

    const onSubmit: SubmitHandler<ReplyFormValues> = async (data) => {
        setIsSubmitting(true);
        const feedbackRef = doc(firestore, 'feedback', feedbackId);
        const newReply = { ...data, createdAt: new Date() };
        
        updateDocumentNonBlocking(feedbackRef, {
            replies: arrayUnion(newReply)
        });

        toast({ title: translations.comments.replySent });
        setIsSubmitting(false);
        onSubmitted();
        form.reset();
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="my-4 space-y-3">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input placeholder={translations.comments.namePlaceholder} {...field} className="h-9 text-sm" />
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
                            <FormControl>
                                <Textarea placeholder={translations.comments.writeReply} {...field} rows={2} />
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2 pt-2">
                     <Button type="button" variant="ghost" size="sm" onClick={onSubmitted}>{translations.common.cancel}</Button>
                     <Button type="submit" size="sm" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {translations.comments.reply}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const { language, translations } = useApp();
  const firestore = useFirestore();
  const [isReplying, setIsReplying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState(feedback.likes || 0);


  useEffect(() => {
    try {
      const likedComments = JSON.parse(localStorage.getItem('kula-liked-feedback') || '[]');
      if (likedComments.includes(feedback.id)) {
        setIsLiked(true);
      }
    } catch (e) {
      // Could be in a server environment
      // console.warn("Could not access localStorage for liked feedback");
    }
  }, [feedback.id]);
  
  const displayDate = useMemo(() => {
    if (!feedback.createdAt?.seconds) {
      return translations.common.justNow;
    }
    const date = new Date(feedback.createdAt.seconds * 1000);
    const locale = locales[language] || tr;
    return formatDistanceToNow(date, { addSuffix: true, locale: locale });
  }, [feedback.createdAt, language, translations]);

  const handleLike = () => {
    if (isLiked) return;
    
    const feedbackRef = doc(firestore, 'feedback', feedback.id);
    updateDocumentNonBlocking(feedbackRef, {
        likes: increment(1)
    });
    
    setOptimisticLikes(prev => prev + 1);
    setIsLiked(true);

    try {
        const likedComments = JSON.parse(localStorage.getItem('kula-liked-feedback') || '[]');
        localStorage.setItem('kula-liked-feedback', JSON.stringify([...likedComments, feedback.id]));
    } catch (e) {
        console.warn("Could not save like status to localStorage");
    }
  };


  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
              <AvatarFallback>{(feedback.name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{feedback.name || 'Anonim'}</p>
            <p className="text-xs text-muted-foreground">{displayDate}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pl-14">
        <p className="text-foreground/90">{feedback.message}</p>
      </CardContent>
       <CardFooter className="flex items-center gap-4 border-t pt-2 pb-2 pl-14">
            <Button variant="ghost" size="sm" onClick={handleLike} disabled={isLiked} className={cn("text-muted-foreground", isLiked && "text-primary hover:text-primary")}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                {optimisticLikes > 0 && <span>{optimisticLikes}</span>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)} className="text-muted-foreground">
                <MessageSquare className="mr-2 h-4 w-4" />
                {translations.comments.reply}
            </Button>
        </CardFooter>

        {(isReplying || (feedback.replies && feedback.replies.length > 0)) && (
          <div className="bg-muted/50 pl-14">
            <div className="border-l-2 ml-4 pl-4 py-2">
                {feedback.replies && feedback.replies.sort((a,b) => (a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.seconds) - (b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.seconds)).map((reply, index) => <ReplyItem key={index} reply={reply} />)}
                {isReplying && <ReplyForm feedbackId={feedback.id} onSubmitted={() => setIsReplying(false)} />}
            </div>
          </div>
        )}
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
        <p className="text-center text-muted-foreground py-8">
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
      likes: 0,
      replies: [],
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
            <h2 className="text-3xl font-headline font-bold text-center">{translations.comments.title}</h2>
            {!isLimited && <FeedbackForm />}
            <FeedbackList isLimited={isLimited} />
             {isLimited && (
                <div className="flex flex-col items-center gap-2 pt-4">
                  <Button asChild>
                      <Link href="/feedback">{(translations.nav as any).makeComment || 'Yorum Yap'}</Link>
                  </Button>
                  <Button asChild variant="link">
                      <Link href="/feedback">{translations.nav.seeAllComments}</Link>
                  </Button>
                </div>
            )}
        </div>
    );
}
