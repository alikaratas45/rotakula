
"use client";

import { getImageById } from '@/lib/placeholder-images';
import { Gem } from 'lucide-react';
import Image from 'next/image';

export default function NarMotifiPage() {
  const pageContent = [
    "Türk evleri genel olarak ahşap işçiliği ağırlıklıdır. Evlerin merdiven babaları, tavan göbeği hepsi ahşap olup birçok farklı figür tasvir edilmiştir. En çok kullanılan figürlerin başında nar motifi gelmektedir. Nar; bereketi sembolize ettiği için her Türk evinin avlusunun vazgeçilmez meyvesi olması ile birlikte, ahşap işçiliği için de önemli bir sembol olarak kullanılmıştır. Ayrıca Osmanlı’da narın başka amaçlar için de kullanıldığı bilinmektedir. Bazı yörelerde genç erkekler evlenmek istedikleri kişiye nar sunarak evlenme teklifinde bulunurlardı. Bunu da günümüzde de halen bilinen şu türküde de görebiliriz:",
  ];

  const poem = [
      "Şu gelen yar olaydı,",
      "Elinde nar olaydı,",
      "İkimiz bir gömlekte",
      "Yakası dar olaydı."
  ];

  const heroImage = getImageById('poi-essanlar-konagi'); // Using a relevant image

  return (
    <article>
        <section className="relative h-[40vh] md:h-[50vh] w-full flex items-end text-white">
            {heroImage && (
                <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint="pomegranate detail wood carving"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="relative z-10 container px-4 py-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg flex items-center gap-3">
                    <Gem className="h-10 w-10" />
                    Nar Motifi
                </h1>
            </div>
        </section>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg max-w-none text-foreground/90">
            {pageContent.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <blockquote className="border-l-4 border-primary pl-4 italic my-8 text-center">
                 {poem.map((line, index) => (
                    <p key={index} className="my-1">{line}</p>
                ))}
            </blockquote>
          </div>
        </div>
      </div>
    </article>
  );
}
