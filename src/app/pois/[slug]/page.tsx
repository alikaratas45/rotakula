import { getPoiBySlug, getPois } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PoiClientPage from './poi-client-page';

type Props = {
    params: { slug: string };
};

export async function generateStaticParams() {
    const pois = await getPois();
    return pois.map((poi) => ({
        slug: poi.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const poi = await getPoiBySlug(params.slug);

  if (!poi) {
    return {
      title: 'Yer Bulunamadı',
    };
  }

  return {
    title: `${poi.name} | RotaKula Gezilecek Yerler`,
    description: poi.description,
  };
}

export default async function PoiDetailPage({ params }: Props) {
    const { slug } = params;
    const poi = await getPoiBySlug(slug);
    
    if (!poi) {
        notFound();
    }

    return <PoiClientPage poi={poi} />;
}
