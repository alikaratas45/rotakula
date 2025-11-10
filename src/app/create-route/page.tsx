
"use client";

import { useEffect, useState } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import PoiSelectionList from './poi-selection-list';
import SelectedPoisSidebar from './selected-pois-sidebar';
import { RouteMap } from './route-map';

const MAX_SELECTION = 10;

export default function CreateRoutePage() {
    const { language, translations } = useLanguage();
    const [allPois, setAllPois] = useState<PointOfInterest[]>([]);
    const [selectedPois, setSelectedPois] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPois() {
            setLoading(true);
            const pois = await getPois(language);
            // Filter out accommodation as they are not typical route stops
            const filteredPois = pois.filter(p => p.category !== 'accommodation');
            setAllPois(filteredPois);
            setLoading(false);
        }
        fetchPois();
    }, [language]);

    const handlePoiSelect = (poi: PointOfInterest, isSelected: boolean) => {
        if (isSelected) {
            if (selectedPois.length < MAX_SELECTION) {
                setSelectedPois(prev => [...prev, poi]);
            }
        } else {
            setSelectedPois(prev => prev.filter(p => p.id !== poi.id));
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-8">
                {/* POI Selection List */}
                <div>
                     <PoiSelectionList 
                        allPois={allPois}
                        selectedPois={selectedPois}
                        onPoiSelect={handlePoiSelect}
                        maxSelection={MAX_SELECTION}
                        loading={loading}
                    />
                </div>
                
                {/* Selected POIs */}
                {selectedPois.length > 0 && (
                    <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm -mx-4 px-4 py-4 border-y">
                        <SelectedPoisSidebar selectedPois={selectedPois} setSelectedPois={setSelectedPois} isDrawer />
                    </div>
                )}
                
                {/* Map */}
                <div>
                     <h2 className="text-2xl font-headline font-bold mb-4">{translations.route.mapTitle}</h2>
                    <RouteMap pois={selectedPois} />
                </div>
            </div>
        </div>
    );
}
