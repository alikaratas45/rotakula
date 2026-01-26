
"use client"
import { getStories } from '@/lib/kula-data';
import { Story } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { BookOpen } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useEffect, useState } from 'react';
import { BackButton } from '@/components/back-button';

const StoryCard = ({ story }: { story: Story }) => {
  const image = getImageById(story.imageId);
  return (
    <Link href={`/stories/${story.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out bg-card/50 hover:bg-card hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full overflow-hidden">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/40 transition-colors"></div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{story.title}</CardTitle>
          <CardDescription className="text-sm">{story.excerpt}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function StoriesPage() {
  const { language, translations } = useApp();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    async function fetchData() {
      const storiesData = await getStories(language);
      setStories(storiesData);
    }
    fetchData();
  }, [language]);

  return (
    <div className="container px-4 py-8 md:py-12">
        <BackButton className="mb-8" />
        <div className="flex items-center gap-4 mb-8">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{translations.stories.title}</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map(story => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
