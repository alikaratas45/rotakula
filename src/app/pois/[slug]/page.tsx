
"use client"

import { getPoiBySlug } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import PoiClientPage from './poi-client-page';
import { useLanguage } from '@/context/language-context';
import { useEffect, useState } from 'react';
import type { PointOfInterest } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function PoiDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { language } = useLanguage();
    const [poi, setPoi] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPoi() {
            setLoading(true);
            const poiData = await getPoiBySlug(slug, language);
            if (poiData) {
                setPoi(poiData);
            }
            setLoading(false);
        }
        fetchPoi();
    }, [slug, language]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!poi) {
        notFound();
    }

    return <PoiClientPage poi={poi} />;
}
