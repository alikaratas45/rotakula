
"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { PointOfInterest } from "@/lib/types";

function PoiMarker({ poi }: { poi: PointOfInterest }) {
  return (
    <AdvancedMarker position={{ lat: poi.latitude, lng: poi.longitude }} title={poi.name}>
      <div className="relative">
        <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
      </div>
    </AdvancedMarker>
  );
}

export default function EmbeddedMap({ pois }: { pois: PointOfInterest[] }) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-muted-foreground">Google Haritalar API anahtarı eksik.</p>
      </div>
    );
  }

  const center = pois.length > 0
    ? { lat: pois[0].latitude, lng: pois[0].longitude }
    : { lat: 38.547, lng: 28.52 }; // Fallback to Kula center

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <div className="h-96 w-full rounded-lg overflow-hidden">
        <Map
          defaultCenter={center}
          defaultZoom={11}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapId="rotakula-map"
        >
          {pois.map((poi) => (
            <PoiMarker key={poi.id} poi={poi} />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
