"use client"

import { APIProvider } from "@vis.gl/react-google-maps";
import EmbeddedMap from "@/components/map";
import type { PointOfInterest } from "@/lib/types";

export function RouteMap({ pois }: { pois: PointOfInterest[] }) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-muted">
                <p className="text-destructive-foreground">Google Maps API key is missing.</p>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full">
            <APIProvider apiKey={apiKey}>
                <EmbeddedMap pois={pois} drawRouteLine />
            </APIProvider>
        </div>
    )
}
