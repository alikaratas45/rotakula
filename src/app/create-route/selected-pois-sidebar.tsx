
"use client"

import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Loader2, Map, Trash2 } from "lucide-react";
import type { PointOfInterest } from "@/lib/types";
import Image from "next/image";
import { getImageById } from "@/lib/placeholder-images";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState }from 'react';

function PoiItem({ poi }: { poi: PointOfInterest }) {
    const image = getImageById(poi.imageId);

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2 w-64 flex-shrink-0">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                {image && <Image src={image.imageUrl} alt={image.description} fill className="object-cover" />}
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm line-clamp-1">{poi.name}</p>
            </div>
        </div>
    )
}

export default function SelectedPoisSidebar({ selectedPois, setSelectedPois }: { selectedPois: PointOfInterest[], setSelectedPois: React.Dispatch<React.SetStateAction<PointOfInterest[]>> }) {
    const { translations } = useLanguage();
    const { toast } = useToast();
    const [isStartingRoute, setIsStartingRoute] = useState(false);

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
        <div className="flex flex-col md:flex-row h-full w-full gap-4 items-center">
            <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold font-headline">{translations.createRoute.selectedPois} ({selectedPois.length})</h3>
                    <p className="text-xs text-muted-foreground hidden md:block">{translations.createRoute.dragAndDrop}</p>
                </div>
                 {selectedPois.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-4 text-center border-2 border-dashed rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-sm">{translations.createRoute.noPoisSelected}</p>
                    </div>
                ) : (
                    <ScrollArea className="w-full">
                        <div className="flex gap-2 pb-4">
                            {selectedPois.map((poi) => (
                               <PoiItem key={poi.id} poi={poi} />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
            
             
            <div className="flex-shrink-0 flex md:flex-col gap-2 w-full md:w-auto">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={isStartingRoute || selectedPois.length === 0}>
                            {isStartingRoute ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Map className="mr-2 h-4 w-4" />}
                            {translations.createRoute.createRoute}
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
                <Button variant="outline" className="w-full" onClick={() => setSelectedPois([])} disabled={selectedPois.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {translations.createRoute.clearSelection}
                </Button>
            </div>
            
        </div>
    );
}
