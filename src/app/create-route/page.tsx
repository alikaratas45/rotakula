
"use client";

import { useEffect, useState } from 'react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { useLanguage } from '@/context/language-context';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
        <DndProvider backend={HTML5Backend}>
            <div className="h-[calc(100vh-4rem)]">
                {/* Desktop View */}
                <div className="hidden lg:flex h-full">
                    <div className="w-2/3 h-full">
                        <RouteMap pois={selectedPois} />
                    </div>
                    <div className="w-1/3 h-full">
                        <PoiSelectionList 
                            allPois={allPois}
                            selectedPois={selectedPois}
                            onPoiSelect={handlePoiSelect}
                            maxSelection={MAX_SELECTION}
                            loading={loading}
                        />
                    </div>
                </div>
                
                {/* Mobile View */}
                <div className="block lg:hidden h-full">
                     <PoiSelectionList 
                        allPois={allPois}
                        selectedPois={selectedPois}
                        onPoiSelect={handlePoiSelect}
                        maxSelection={MAX_SELECTION}
                        loading={loading}
                    />
                </div>
            </div>
        </DndProvider>
    );
}
