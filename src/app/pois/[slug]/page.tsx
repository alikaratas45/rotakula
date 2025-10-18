
"use client"

import { getPoiBySlug } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import PoiClientPage from './poi-client-page';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState } from 'react';
import type { PointOfInterest } from '@/lib/types';


export default function PoiDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { language, translations } = useLanguage();
    const [poi, setPoi] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function fetchData() {
        setLoading(true);
        const poiData = await getPoiBySlug(slug, language);
        if (poiData) {
          setPoi(poiData);
        }
        setLoading(false);
      }
      fetchData();
    }, [slug, language]);


    if (loading) {
      return <div className="container py-8">{translations.common.loading}...</div>
    }

    if (!poi) {
        notFound();
    }

    return <PoiClientPage poi={poi} />;
}
