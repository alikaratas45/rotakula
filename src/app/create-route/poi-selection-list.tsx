
"use client"

import type { PointOfInterest } from "@/lib/types";
import { getImageById } from "@/lib/placeholder-images";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Info, Map, Footprints, Car } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import SelectedPoisSidebar from "./selected-pois-sidebar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function PoiSelectionList({
    allPois,
    selectedPois,
    onPoiSelect,
    maxSelection,
    loading
}: {
    allPois: PointOfInterest[],
    selectedPois: PointOfInterest[],
    onPoiSelect: (poi: PointOfInterest, isSelected: boolean) => void,
    maxSelection: number,
    loading: boolean
}) {
    const { translations } = useLanguage();
    const { toast } = useToast();
    const selectionCount = selectedPois.length;
    const [isStartingRoute, setIsStartingRoute] = useState(false);


    const isPoiSelected = (poiId: string) => selectedPois.some(p => p.id === poiId);
    
    const handleCreateRoute = (travelMode: 'driving' | 'walking') => {
        if (!navigator.geolocation) {
            toast({
                title: translations.toast.locationErrorTitle,
                description: translations.map.locationError,
                variant: 'destructive',
            });
            return;
        }
        if (selectedPois.length < 2) {
             toast({
                title: translations.toast.errorTitle,
                description: translations.createRoute.minPoisError,
                variant: 'destructive',
            });
            return;
        }

        setIsStartingRoute(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const origin = `${latitude},${longitude}`;
                
                const destination = `${selectedPois[selectedPois.length - 1].latitude},${selectedPois[selectedPois.length - 1].longitude}`;

                const waypoints = selectedPois
                    .slice(0, selectedPois.length - 1)
                    .map(p => `${p.latitude},${p.longitude}`)
                    .join('|');

                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=${travelMode}`;

                window.open(googleMapsUrl, '_blank');
                setIsStartingRoute(false);
            },
            (error) => {
                toast({
                    title: translations.toast.locationErrorTitle,
                    description: translations.nearby.locationError,
                    variant: 'destructive',
                });
                setIsStartingRoute(false);
            },
            { enableHighAccuracy: true }
        );
    }

    return (
        <div className="flex flex-col h-full bg-card border-l">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold font-headline">{translations.createRoute.selectPois}</h2>
                <p className="text-sm text-muted-foreground">
                    {translations.createRoute.selectDescription.replace('{count}', maxSelection.toString())}
                </p>
                <div className="mt-2 text-sm font-semibold">
                    {translations.createRoute.selectionCount}: {selectionCount} / {maxSelection}
                </div>
            </div>

            {loading ? (
                 <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ScrollArea className="flex-grow">
                    <div className="space-y-2 p-4">
                        {allPois.map(poi => {
                            const image = getImageById(poi.imageId);
                            const isSelected = isPoiSelected(poi.id);
                            const isDisabled = !isSelected && selectionCount >= maxSelection;

                            return (
                                <div key={poi.id} className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${isDisabled ? 'opacity-50' : ''} ${isSelected ? 'bg-accent' : ''}`}>
                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                                        {image && (
                                            <Image
                                                src={image.imageUrl}
                                                alt={image.description}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <label htmlFor={`poi-${poi.id}`} className="font-semibold cursor-pointer">{poi.name}</label>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{poi.description}</p>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Link href={`/pois/${poi.slug}`} target="_blank" passHref>
                                            <Info className="h-5 w-5 text-muted-foreground hover:text-primary"/>
                                        </Link>
                                        <Checkbox
                                            id={`poi-${poi.id}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => onPoiSelect(poi, !!checked)}
                                            disabled={isDisabled}
                                            aria-label={`Select ${poi.name}`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            )}

            {selectionCount > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button className={cn("fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-10 lg:hidden", isStartingRoute && "animate-pulse")}>
                            {isStartingRoute ? <Loader2 className="h-6 w-6 animate-spin" /> : <Map className="h-6 w-6" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{translations.createRoute.chooseTravelMode}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {translations.createRoute.travelModeDescription}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="sm:justify-center gap-2">
                                <AlertDialogAction onClick={() => handleCreateRoute('walking')}>
                                <Footprints className="mr-2 h-4 w-4" />
                                {translations.createRoute.walking}
                            </AlertDialogAction>
                            <AlertDialogAction onClick={() => handleCreateRoute('driving')}>
                                <Car className="mr-2 h-4 w-4" />
                                {translations.createRoute.driving}
                            </AlertDialogAction>
                            <AlertDialogCancel>{translations.common.cancel}</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            <div className="p-4 border-t lg:hidden flex gap-2">
                 <Drawer>
                    <DrawerTrigger asChild>
                        <Button className="w-full" variant="outline" disabled={selectionCount === 0}>
                           {translations.createRoute.viewSelected} ({selectionCount})
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[80vh]">
                        <SelectedPoisSidebar selectedPois={selectedPois} setSelectedPois={() => {}} isDrawer />
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    )
}
