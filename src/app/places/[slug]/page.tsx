
"use client"

import { getPoiBySlug } from '@/lib/kula-data';
import { notFound } from 'next/navigation';
import PlaceClientPage from './place-client-page';
import { useApp } from '@/context/app-context';
import { useEffect, useState, use } from 'react';
import type { PointOfInterest } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function PlaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { language } = useApp();
    const [poi, setPoi] = useState<PointOfInterest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setPoi(null); // Clear previous data on language change
        setLoading(true);
        async function fetchPoi() {
            const poiData = await getPoiBySlug(slug, language);
            if (poiData) {
                setPoi(poiData);
            } else {
                setPoi(null);
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

    return <PlaceClientPage poi={poi} />;
}
