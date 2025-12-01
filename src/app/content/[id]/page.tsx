
'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

type Content = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
};

// A simple markdown renderer
const MarkdownRenderer = ({ text }: { text: string | undefined | null }) => {
    if (!text) {
        return null;
    }
    // Ensure text is treated as a string to prevent errors
    const paragraphs = String(text).split('\n').filter(p => p.trim() !== '');
    return (
        <div className="prose prose-lg max-w-none text-foreground/90">
            {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
        </div>
    );
};


export default function ContentPage({ params }: { params: { id: string } }) {
  const contentId = params.id;
  const firestore = useFirestore();

  const contentRef = useMemoFirebase(() => {
    if (!firestore || !contentId) return null;
    return doc(firestore, 'content', contentId);
  }, [firestore, contentId]);

  const { data: content, isLoading, error } = useDoc<Content>(contentRef);

  useEffect(() => {
    // If there's an error fetching (like permission denied), or if loading is done and there's no data
    if (error || (!isLoading && !content)) {
      notFound();
    }
  }, [error, isLoading, content]);


  if (isLoading || !content) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 md:py-12">
      {content.imageUrl && (
        <div className="relative h-[40vh] md:h-[60vh] w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={content.imageUrl}
            alt={content.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-6">
          {content.title}
        </h1>
        <MarkdownRenderer text={content.body} />
      </div>
    </article>
  );
}
