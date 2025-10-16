
"use client";

import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { PointOfInterest } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function PoiMarker({ poi }: { poi: PointOfInterest }) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const geocoder = new google.maps.Geocoder();
    const query = poi.id === 'poi-13' 
        ? { location: { lat: poi.latitude, lng: poi.longitude } }
        : { address: `${poi.name}, Kula, Manisa, Türkiye` };

    geocoder.geocode(query, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            setPosition({ lat: location.lat(), lng: location.lng() });
        } else {
            // Fallback to static coordinates if geocoding fails
            setPosition({ lat: poi.latitude, lng: poi.longitude });
            console.error(`Geocode was not successful for the following reason: ${status}`);
        }
    });
  }, [map, poi]);

  if (!position) return null;

  return (
    <AdvancedMarker position={position} title={poi.name}>
      <div className="relative">
        <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
      </div>
    </AdvancedMarker>
  );
}

export default function EmbeddedMap({ pois }: { pois: PointOfInterest[] }) {
  const map = useMap();
  const [markersLoaded, setMarkersLoaded] = useState(false);

   useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      const geocoder = new google.maps.Geocoder();
      let geocodedCount = 0;

      pois.forEach((poi) => {
        const query = poi.id === 'poi-13'
            ? { location: { lat: poi.latitude, lng: poi.longitude } }
            : { address: `${poi.name}, Kula, Manisa, Türkiye` };
        
        geocoder.geocode(query, (results, status) => {
            geocodedCount++;
            if (status === 'OK' && results && results[0]) {
                bounds.extend(results[0].geometry.location);
            } else {
                // Fallback for failed geocoding
                bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
            }

            // When all pois are geocoded, fit bounds
            if (geocodedCount === pois.length) {
                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds, 100); // 100px padding
                }
                setMarkersLoaded(true);
            }
        });
      });
    }
  }, [map, pois]);

  const center = pois.length > 0
    ? { lat: pois[0].latitude, lng: pois[0].longitude }
    : { lat: 38.547, lng: 28.52 };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      {!markersLoaded && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Harita Yükleniyor...</span>
            </div>
        </div>
      )}
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
  );
}
