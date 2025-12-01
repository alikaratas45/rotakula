
export default function NarMotifiPage() {
  const pageContent = [
    "Türk evleri genel olarak ahşap işçiliği ağırlıklıdır. Evlerin merdiven babaları, tavan göbeği hepsi ahşap olup birçok farklı figür tasvir edilmiştir. En çok kullanılan figürlerin başında nar motifi gelmektedir. Nar; bereketi sembolize ettiği için her Türk evinin avlusunun vazgeçilmez meyvesi olması ile birlikte, ahşap işçiliği için de önemli bir sembol olarak kullanılmıştır. Ayrıca Osmanlı’da narın başka amaçlar için de kullanıldığı bilinmektedir. Bazı yörelerde genç erkekler evlenmek istedikleri kişiye nar sunarak evlenme teklifinde bulunurlardı. Bunu da günümüzde de halen bilinen şu türküde de görebiliriz:",
    "Şu gelen yar olaydı,",
    "Elinde nar olaydı,",
    "İkimiz bir gömlekte",
    "Yakası dar olaydı."
  ];

  return (
    <article className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">
              Nar Motifi
            </h1>
        </div>
        
        <div className="prose prose-lg max-w-none text-foreground/90">
            {pageContent.map((paragraph, index) => (
                <p key={index} className={index > 0 && index < 5 ? 'pl-4 italic' : ''}>
                    {paragraph}
                </p>
            ))}
        </div>
      </div>
    </article>
  );
}
