import { getStories } from '@/lib/kula-data';
import { Story } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getImageById } from '@/lib/placeholder-images';
import { BookOpen } from 'lucide-react';

const StoryCard = ({ story }: { story: Story }) => {
  const image = getImageById(story.imageId);
  return (
    <Link href={`/stories/${story.slug}`} className="group block perspective-1000">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 preserve-3d animate-unfold-in">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            {image && (
              <Image
                src={image.imageUrl}
                alt={image.description}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={image.imageHint}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="font-headline text-xl mb-2">{story.title}</CardTitle>
          <CardDescription className="text-sm">{story.excerpt}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
};

export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <div className="container py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline font-bold">Kula'dan Hikayeler</h1>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stories.map(story => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}
