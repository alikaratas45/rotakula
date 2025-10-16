
"use client";

import { Map, AdvancedMarker, useMap, InfoWindow } from "@vis.gl/react-google-maps";
import { PointOfInterest } from "@/lib/types";
import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import { getImageById } from "@/lib/placeholder-images";
import { Button } from "./ui/button";

function PoiMarker({ 
    poi, 
    onClick 
}: { 
    poi: PointOfInterest, 
    onClick: () => void 
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!map) {
      setPosition({ lat: poi.latitude, lng: poi.longitude });
      return;
    };

    const geocoder = new google.maps.Geocoder();
    
    let addressQuery: string;
    if (poi.id === 'poi-2') { // Kula Peri Bacaları
        addressQuery = 'Kuladokya Peri Bacaları';
    } else if (poi.id === 'poi-13') { // Gökçeören Köyü - special handling
        addressQuery = `${poi.latitude},${poi.longitude}`;
    } else {
        addressQuery = `${poi.name}, Kula, Manisa, Türkiye`;
    }

    const query = poi.id === 'poi-13'
      ? { location: { lat: poi.latitude, lng: poi.longitude } }
      : { address: addressQuery };


    geocoder.geocode(query, (results, status) => {
        if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            setPosition({ lat: location.lat(), lng: location.lng() });
        } else {
            // Fallback to static coordinates if geocoding fails, without logging an error to console.
            setPosition({ lat: poi.latitude, lng: poi.longitude });
        }
    });
  }, [map, poi]);

  if (!position) return null;

  return (
    <AdvancedMarker onClick={onClick} position={position} title={poi.name}>
      <div className="relative flex flex-col items-center">
        <div className="bg-white text-red-600 font-bold px-2 py-1 rounded-md shadow-lg text-xs mb-1 whitespace-nowrap">
          {poi.name}
        </div>
        <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
      </div>
    </AdvancedMarker>
  );
}

export default function EmbeddedMap({ pois }: { pois: PointOfInterest[] }) {
  const map = useMap();
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);

  const selectedPoi = selectedPoiId ? pois.find(p => p.id === selectedPoiId) : null;
  const selectedImage = selectedPoi ? getImageById(selectedPoi.imageId) : null;
  const markerRef = selectedPoi ? document.querySelector(`[aria-label="${selectedPoi.name}"]`) as HTMLElement : null;

   useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      const geocoder = new google.maps.Geocoder();
      let geocodedCount = 0;
      let hasSuccessfulGeocode = false;

      pois.forEach((poi) => {
        let addressQuery: string;
        if (poi.id === 'poi-2') { // Kula Peri Bacaları
            addressQuery = 'Kuladokya Peri Bacaları';
        } else if (poi.id === 'poi-13') { // Gökçeören Köyü
            addressQuery = `${poi.latitude},${poi.longitude}`;
        } else {
            addressQuery = `${poi.name}, Kula, Manisa, Türkiye`;
        }

        const query = poi.id === 'poi-13'
            ? { location: { lat: poi.latitude, lng: poi.longitude } }
            : { address: addressQuery };
        
        geocoder.geocode(query, (results, status) => {
            geocodedCount++;
            if (status === 'OK' && results && results[0]) {
                bounds.extend(results[0].geometry.location);
                hasSuccessfulGeocode = true;
            } else {
                // Fallback for failed geocoding
                bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
            }

            // When all pois are geocoded, fit bounds
            if (geocodedCount === pois.length) {
                if (hasSuccessfulGeocode) {
                    map.fitBounds(bounds, 100); // 100px padding
                } else if (!bounds.isEmpty()) {
                    map.fitBounds(bounds);
                    if (pois.length === 1) {
                        map.setZoom(13);
                    }
                }
                setMarkersLoaded(true);
            }
        });
      });
    } else if (pois.length === 0) {
        setMarkersLoaded(true);
    }
  }, [map, pois]);

  useEffect(() => {
    // Reset selection when POIs change
    setSelectedPoiId(null);
  }, [pois]);

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
        onClick={() => setSelectedPoiId(null)}
      >
        {pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} onClick={() => setSelectedPoiId(poi.id)} />
        ))}
        
        {selectedPoi && markerRef && (
            <InfoWindow
                anchor={markerRef}
                onCloseClick={() => setSelectedPoiId(null)}
            >
              <div className="w-64 p-1">
                 {selectedImage && (
                   <div className="relative h-32 w-full mb-2 rounded-md overflow-hidden">
                     <Image
                       src={selectedImage.imageUrl}
                       alt={selectedImage.description}
                       fill
                       className="object-cover"
                       data-ai-hint={selectedImage.imageHint}
                     />
                   </div>
                 )}
                 <h3 className="font-bold font-headline text-md mb-1">{selectedPoi.name}</h3>
                 <p className="text-sm text-foreground/80">{selectedPoi.description}</p>
              </div>
            </InfoWindow>
        )}
      </Map>
    </div>
  );
}
