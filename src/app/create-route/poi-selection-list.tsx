"use client"

import type { PointOfInterest } from "@/lib/types";
import { getImageById } from "@/lib/placeholder-images";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Info } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import SelectedPoisSidebar from "./selected-pois-sidebar";
import { Button } from "@/components/ui/button";

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
    const selectionCount = selectedPois.length;

    const isPoiSelected = (poiId: string) => selectedPois.some(p => p.id === poiId);

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

            <div className="p-4 border-t lg:hidden">
                 <Drawer>
                    <DrawerTrigger asChild>
                        <Button className="w-full" disabled={selectionCount === 0}>
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
