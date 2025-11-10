
"use client"

import type { PointOfInterest } from "@/lib/types";
import { getImageById } from "@/lib/placeholder-images";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold font-headline">{translations.createRoute.selectPois}</h2>
                <p className="text-sm text-muted-foreground">
                    {translations.createRoute.selectDescription.replace('{count}', maxSelection.toString())}
                </p>
                <div className="mt-2 text-sm font-semibold">
                    {translations.createRoute.selectionCount}: {selectionCount} / {maxSelection}
                </div>
            </div>

            {loading ? (
                 <div className="flex-grow flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allPois.map(poi => {
                        const image = getImageById(poi.imageId);
                        const isSelected = isPoiSelected(poi.id);
                        const isDisabled = !isSelected && selectionCount >= maxSelection;

                        return (
                            <Card 
                                key={poi.id} 
                                className={cn(
                                    "flex flex-col overflow-hidden transition-all", 
                                    isDisabled ? "opacity-50" : "cursor-pointer", 
                                    isSelected ? "ring-2 ring-primary" : ""
                                )}
                                onClick={() => {
                                    if (!isDisabled) {
                                        onPoiSelect(poi, !isSelected);
                                    }
                                }}
                            >
                                <div className="relative">
                                    <div className="relative h-40 w-full">
                                        {image && (
                                            <Image
                                                src={image.imageUrl}
                                                alt={image.description}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                                         <Checkbox
                                            id={`poi-${poi.id}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) => {
                                                if (!isDisabled) {
                                                    onPoiSelect(poi, !!checked)
                                                }
                                            }}
                                            disabled={isDisabled}
                                            aria-label={`Select ${poi.name}`}
                                            className="h-6 w-6 bg-background/50 border-white/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                    </div>
                                </div>
                                <CardContent className="p-4 flex-grow flex flex-col">
                                    <h3 className="text-md font-semibold font-headline">{poi.name}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground flex-grow">{poi.description}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
