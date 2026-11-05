
"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Route as RouteIcon } from 'lucide-react';
import { getPois } from '@/lib/kula-data';
import type { PointOfInterest } from '@/lib/types';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import PoiSelectionList from './poi-selection-list';
import SelectedPoisSidebar from './selected-pois-sidebar';
import { RouteMap } from './route-map';
import { TripPlanControls } from './trip-plan-controls';
import type { MapPosition, RouteSummary } from '@/components/map';
import { BackButton } from '@/components/back-button';
import { haversineDistance } from '@/lib/utils';

const MAX_SELECTION = 10;

const customPoiOrder = [
    'poi-30', // Ahşap köprüler
    'poi-2',  // Peri Bacaları
    'poi-3',  // Çakırca Bazalt Sütunları
    'poi-4',  // tarihi kula evleri
    'poi-1',  // sandal divlit volkan konisi
    'poi-18', // jeopark ziyaretçi merkezi
];

const neighborhoodSlugs = [
    'encekler-village',
    'sandal-village',
    'gokceoren-village',
    'incesu-village',
    'korez-village',
    'emre-village',
    'evciler-village',
    'yurtbasi-tabala-village',
];

export default function CreateRoutePage() {
    const { language, translations } = useApp();
    const { toast } = useToast();
    const [allPois, setAllPois] = useState<PointOfInterest[]>([]);
    const [selectedPois, setSelectedPois] = useState<PointOfInterest[]>([]);
    const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
    const [userPosition, setUserPosition] = useState<MapPosition | null>(null);
    const [isUserPositionResolved, setIsUserPositionResolved] = useState(false);
    const [loading, setLoading] = useState(true);
    const hasAppliedSharedPlan = useRef(false);
    const hasResolvedUserPosition = useRef(false);

    useEffect(() => {
        async function fetchPois() {
            setLoading(true);
            const pois = await getPois(language);
            
            const filteredPois = pois.filter(p => p.category !== 'accommodation' && p.id !== 'poi-31');

            const sortedPois = filteredPois.sort((a, b) => {
                const aIndex = customPoiOrder.indexOf(a.id);
                const bIndex = customPoiOrder.indexOf(b.id);
                const aIsNeighborhood = neighborhoodSlugs.includes(a.slug);
                const bIsNeighborhood = neighborhoodSlugs.includes(b.slug);
                const aIsBelediye = a.slug === 'kula-belediyesi';
                const bIsBelediye = b.slug === 'kula-belediyesi';

                if (aIsBelediye) return 1;
                if (bIsBelediye) return -1;

                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;

                if (aIsNeighborhood && !bIsNeighborhood) return 1;
                if (!aIsNeighborhood && bIsNeighborhood) return -1;

                return a.name.localeCompare(b.name, language);
            });


            setAllPois(sortedPois);
            setLoading(false);
        }
        fetchPois();
    }, [language]);

    useEffect(() => {
        if (loading || hasAppliedSharedPlan.current) return;
        hasAppliedSharedPlan.current = true;

        const sharedStopIds = new URLSearchParams(window.location.search).get('stops');
        if (!sharedStopIds) return;

        const requestedIds = [...new Set(sharedStopIds.split(',').filter(Boolean))].slice(0, MAX_SELECTION);
        const poisById = new Map(allPois.map(poi => [poi.id, poi]));
        const sharedPois = requestedIds
            .map(id => poisById.get(id))
            .filter((poi): poi is PointOfInterest => poi !== undefined);

        if (sharedPois.length === 0) {
            toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.sharedStopsMissing,
                variant: 'destructive',
            });
            return;
        }

        setSelectedPois(sharedPois);
        if (sharedPois.length !== requestedIds.length) {
            toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.sharedStopsMissing,
                variant: 'destructive',
            });
        } else {
            toast({ title: translations.createRoute.tripPlanLoaded });
        }
    }, [allPois, loading, toast, translations]);

    const handleRouteSummary = useCallback((summary: RouteSummary | null) => {
        setRouteSummary(summary);
    }, []);

    const sortPoisFromUser = useCallback((pois: PointOfInterest[], position: MapPosition) => (
        [...pois].sort((a, b) => {
            const distanceToA = haversineDistance(
                { lat: position.lat, lon: position.lng },
                { lat: a.latitude, lon: a.longitude },
            );
            const distanceToB = haversineDistance(
                { lat: position.lat, lon: position.lng },
                { lat: b.latitude, lon: b.longitude },
            );
            return distanceToA - distanceToB;
        })
    ), []);

    const handleUserPosition = useCallback((position: MapPosition | null) => {
        if (hasResolvedUserPosition.current) return;
        hasResolvedUserPosition.current = true;
        setUserPosition(position);
        setIsUserPositionResolved(true);
        if (position) {
            setSelectedPois(currentPois => sortPoisFromUser(currentPois, position));
        } else {
            toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.userLocationUnavailable,
                variant: 'destructive',
            });
        }
    }, [sortPoisFromUser, toast, translations]);

    const handleLoadPlan = (poiIds: string[]) => {
        const poisById = new Map(allPois.map(poi => [poi.id, poi]));
        const restoredPois = poiIds
            .map(id => poisById.get(id))
            .filter((poi): poi is PointOfInterest => poi !== undefined);

        if (restoredPois.length === 0) {
            toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.sharedStopsMissing,
                variant: 'destructive',
            });
            return;
        }

        setSelectedPois(userPosition ? sortPoisFromUser(restoredPois, userPosition) : restoredPois);
        if (restoredPois.length !== poiIds.length) {
            toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.sharedStopsMissing,
                variant: 'destructive',
            });
        } else {
            toast({ title: translations.createRoute.tripPlanLoaded });
        }
    };

    const handlePoiSelect = (poi: PointOfInterest, isSelected: boolean) => {
        if (isSelected) {
            if (selectedPois.length < MAX_SELECTION) {
                setSelectedPois(prev => {
                    const nextPois = [...prev, poi];
                    return userPosition ? sortPoisFromUser(nextPois, userPosition) : nextPois;
                });
            }
        } else {
            setSelectedPois(prev => prev.filter(p => p.id !== poi.id));
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <BackButton className="mb-8" />
            <div className="flex flex-col gap-8">
                {/* Selected POIs */}
                <div className="sticky top-16 z-20 -mx-4 px-4 py-4 border-y bg-background/95 backdrop-blur-sm">
                    <SelectedPoisSidebar selectedPois={selectedPois} setSelectedPois={setSelectedPois} />
                </div>

                <TripPlanControls selectedPois={selectedPois} onLoadPlan={handleLoadPlan} />
                
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
                
                {/* Map */}
                <div>
                     <h2 className="text-2xl font-headline font-bold mb-4">{translations.route.mapTitle}</h2>
                    {routeSummary && selectedPois.length > 1 && (
                        <Card className="mb-4">
                            <CardContent className="flex flex-wrap gap-6 py-4">
                                <div className="flex items-center gap-2">
                                    <RouteIcon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{translations.createRoute.estimatedDistance}</p>
                                        <p className="font-semibold">
                                            {new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(routeSummary.distanceMeters / 1000)} km
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock3 className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{translations.createRoute.estimatedDuration}</p>
                                        <p className="font-semibold">
                                            {formatDuration(routeSummary.durationSeconds, language, translations.createRoute.durationHoursFormat, translations.createRoute.durationMinutesFormat)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <RouteMap
                        pois={selectedPois}
                        onRouteSummary={handleRouteSummary}
                        drawRouteLine={isUserPositionResolved}
                        onUserPosition={handleUserPosition}
                        routeOrigin={userPosition ?? undefined}
                    />
                </div>
            </div>
        </div>
    );
}

function formatDuration(
    durationSeconds: number,
    language: string,
    hoursFormat: string,
    minutesFormat: string,
) {
    const totalMinutes = Math.round(durationSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formatNumber = (value: number) => new Intl.NumberFormat(language).format(value);

    if (hours === 0) {
        return minutesFormat.replace('{minutes}', formatNumber(minutes));
    }

    return hoursFormat
        .replace('{hours}', formatNumber(hours))
        .replace('{minutes}', formatNumber(minutes));
}
