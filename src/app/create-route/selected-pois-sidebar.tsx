"use client"

import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Loader2, Map, Trash2, GripVertical } from "lucide-react";
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

// Draggable Item Component
function DraggablePoiItem({ poi, index, movePoi }: { poi: PointOfInterest, index: number, movePoi: (dragIndex: number, hoverIndex: number) => void }) {
    const image = getImageById(poi.imageId);

    return (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                {image && <Image src={image.imageUrl} alt={image.description} fill className="object-cover" />}
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm line-clamp-1">{poi.name}</p>
            </div>
        </div>
    )
}

export default function SelectedPoisSidebar({ selectedPois, setSelectedPois, isDrawer = false }: { selectedPois: PointOfInterest[], setSelectedPois: React.Dispatch<React.SetStateAction<PointOfInterest[]>>, isDrawer?: boolean }) {
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
        <div className="flex h-full flex-col bg-card border-l">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold font-headline">{translations.createRoute.selectedPois}</h2>
                 <p className="text-sm text-muted-foreground">{translations.createRoute.dragAndDrop}</p>
            </div>

            <ScrollArea className="flex-grow">
                 {selectedPois.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-8 text-center">
                        <p className="text-muted-foreground">{translations.createRoute.noPoisSelected}</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {selectedPois.map((poi, index) => (
                           <DraggablePoiItem key={poi.id} index={index} poi={poi} movePoi={() => {}} />
                        ))}
                    </div>
                )}
            </ScrollArea>
            
             {selectedPois.length > 0 && (
                <div className="p-4 border-t space-y-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full" disabled={isStartingRoute}>
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
                    <Button variant="outline" className="w-full" onClick={() => setSelectedPois([])}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {translations.createRoute.clearSelection}
                    </Button>
                </div>
            )}
        </div>
    );
}
