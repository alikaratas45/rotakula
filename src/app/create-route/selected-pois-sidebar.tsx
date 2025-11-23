
"use client"

import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Loader2, Map, Trash2 } from "lucide-react";
import type { PointOfInterest } from "@/lib/types";
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

export default function SelectedPoisSidebar({ selectedPois, setSelectedPois }: { selectedPois: PointOfInterest[], setSelectedPois: React.Dispatch<React.SetStateAction<PointOfInterest[]>> }) {
    const { translations } = useApp();
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
                <h3 className="text-lg font-bold font-headline">{translations.createRoute.selectedPois} ({selectedPois.length})</h3>
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
