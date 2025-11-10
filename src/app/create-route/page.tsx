
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
        <div className="h-[calc(100vh-4rem)]">
            {/* Desktop View */}
            <div className="hidden lg:grid grid-cols-3 h-full">
                <div className="col-span-1 h-full">
                     <PoiSelectionList 
                        allPois={allPois}
                        selectedPois={selectedPois}
                        onPoiSelect={handlePoiSelect}
                        maxSelection={MAX_SELECTION}
                        loading={loading}
                    />
                </div>
                <div className="col-span-2 h-full relative">
                    <RouteMap pois={selectedPois} />
                     <div className="absolute top-4 right-4 w-80 h-[calc(100%-2rem)] z-10">
                        <SelectedPoisSidebar selectedPois={selectedPois} setSelectedPois={setSelectedPois} />
                    </div>
                </div>
            </div>
            
            {/* Mobile View */}
             <div className="lg:hidden h-full relative">
                 <PoiSelectionList 
                    allPois={allPois}
                    selectedPois={selectedPois}
                    onPoiSelect={handlePoiSelect}
                    maxSelection={MAX_SELECTION}
                    loading={loading}
                />
            </div>
        </div>
    );
}
