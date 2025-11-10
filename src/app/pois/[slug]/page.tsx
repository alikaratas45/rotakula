
import { getPoiBySlug } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import PoiClientPage from './poi-client-page';
import { getPois } from '@/lib/kula-data';
import { LanguageProvider, useLanguage } from '@/context/language-context';

// This is a server component
export default async function PoiDetailPage({ params }: { params: { slug: string } }) {
    // Forcing turkish language for now as we don't have language context on server
    const poi = await getPoiBySlug(params.slug, 'tr');

    if (!poi) {
        notFound();
    }

    return <PoiClientPage poi={poi} />;
}
