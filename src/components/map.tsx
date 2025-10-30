
"use client";

import { Map, AdvancedMarker, useMap, InfoWindow } from "@vis.gl/react-google-maps";
import { PointOfInterest } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Star, Navigation } from "lucide-react";
import Image from "next/image";
import { getImageById } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { useRouter } from "next/navigation";

// --- User Location Marker ---
function UserLocationMarker() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const { translations } = useLanguage();
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        setPosition({
          lat: geoPosition.coords.latitude,
          lng: geoPosition.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Error getting user location: ${error.message}`);
        // Silently fail if user denies permission
      },
      { enableHighAccuracy: true }
    );
  }, []);

  if (!position) return null;

  return (
    <AdvancedMarker position={position} title={translations.map.yourLocation}>
      <div className="relative w-6 h-6 flex justify-center items-center">
        <div className="absolute w-full h-full rounded-full bg-blue-500/20 animate-ping"></div>
        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>
      </div>
    </AdvancedMarker>
  );
}


// --- POI Marker ---
function PoiMarker({ 
    poi, 
    onClick 
}: { 
    poi: PointOfInterest, 
    onClick: () => void 
}) {
    return (
        <AdvancedMarker onClick={onClick} position={{ lat: poi.latitude, lng: poi.longitude }} title={poi.name}>
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md cursor-pointer" />
        </AdvancedMarker>
    );
}

// --- Main Map Component ---
export default function EmbeddedMap({ pois }: { pois: PointOfInterest[] }) {
  const map = useMap();
  const router = useRouter();
  const { translations } = useLanguage();
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  const handleMarkerClick = (poi: PointOfInterest) => {
    router.push(`/pois/${poi.slug}`);
  };

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Fail silently if user denies
        setUserPosition(null); 
      }
    );
  }, []);


   useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      // Add user's position to bounds if available
      if (userPosition) {
        bounds.extend(new google.maps.LatLng(userPosition.lat, userPosition.lng));
      }

      pois.forEach((poi) => {
        bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
      });
      
      map.fitBounds(bounds, 100);

      if (pois.length === 1 && !userPosition) {
        map.setZoom(13);
      }
      setMarkersLoaded(true);

    } else if (map && userPosition) {
        // If there are no POIs but we have user location, center on them
        map.setCenter(userPosition);
        map.setZoom(13);
        setMarkersLoaded(true);
    } else if (pois.length === 0) {
        setMarkersLoaded(true);
    }
  }, [map, pois, userPosition]);

  const center = pois.length > 0
    ? { lat: pois[0].latitude, lng: pois[0].longitude }
    : { lat: 38.547, lng: 28.52 };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden relative">
      {!markersLoaded && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{translations.map.loading}</span>
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
        {userPosition && <UserLocationMarker />}
        {pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} onClick={() => handleMarkerClick(poi)} />
        ))}
      </Map>
    </div>
  );
}


// --- Nearby Search Component ---

const PlaceMarker = ({ place, onClick }: { place: google.maps.places.PlaceResult, onClick: () => void }) => {
    return (
        <AdvancedMarker position={place.geometry?.location} onClick={onClick} title={place.name!}>
            <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-pointer" />
        </AdvancedMarker>
    )
}

export const NearbySearch = () => {
    const map = useMap();
    const { translations } = useLanguage();
    const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Use Kula center as the location for nearby search
    useEffect(() => {
        setUserPosition({ lat: 38.547, lng: 28.52 });
    }, []);

    // Perform nearby search
    useEffect(() => {
        if (!map || !userPosition) return;

        const placesService = new google.maps.places.PlacesService(map);
        const request: google.maps.places.PlaceSearchRequest = {
            location: userPosition,
            radius: 5000, // 5km radius
            keyword: 'restaurant | lokanta | cafe',
        };

        placesService.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                setPlaces(results);
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(userPosition);
                results.forEach(place => {
                    if (place.geometry?.location) {
                        bounds.extend(place.geometry.location);
                    }
                });
                map.fitBounds(bounds);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                setError(translations.map.noRestaurantsFound);
            } else {
                 setError(translations.map.searchError);
            }
        });
    }, [map, userPosition, translations]);
    
    const selectedPlace = selectedPlaceId ? places.find(p => p.place_id === selectedPlaceId) : null;
    
    const handleMarkerClick = (placeId: string) => {
        if (placeId === selectedPlaceId) {
            setSelectedPlaceId(null);
        } else {
            setSelectedPlaceId(placeId);
        }
    }
    
    const handleGetDirectionsToPlace = (place: google.maps.places.PlaceResult) => {
        if (!place.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };
    
    if (error && places.length === 0) {
        return (
            <div className="h-96 flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    if (!userPosition && !error) {
         return (
            <div className="h-96 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{translations.map.loading}</span>
                </div>
            </div>
        );
    }
    

    return (
        <div className="h-96 w-full rounded-lg overflow-hidden relative">
            <Map
                center={userPosition || { lat: 38.547, lng: 28.52 }}
                zoom={14}
                gestureHandling={"greedy"}
                disableDefaultUI={true}
                mapId="rotakula-nearby-map"
                onClick={() => setSelectedPlaceId(null)}
            >
                {userPosition && <UserLocationMarker />}
                {places.map((place) => 
                    place.place_id && <PlaceMarker key={place.place_id} place={place} onClick={() => handleMarkerClick(place.place_id!)} />
                )}

                {selectedPlace && (
                    <InfoWindow
                        onCloseClick={() => setSelectedPlaceId(null)}
                        position={selectedPlace.geometry?.location}
                    >
                        <div className="w-64 p-1 flex flex-col gap-2">
                            <h3 className="font-bold font-headline text-md">{selectedPlace.name}</h3>
                             {selectedPlace.rating && (
                                <div className="flex items-center gap-1 text-sm text-yellow-600">
                                    <Star className="w-4 h-4 fill-current" /> 
                                    <span>{selectedPlace.rating} ({selectedPlace.user_ratings_total} {translations.map.reviews})</span>
                                </div>
                            )}
                            <p className="text-sm text-foreground/80">{selectedPlace.vicinity}</p>
                            <Button size="sm" variant="outline" onClick={() => handleGetDirectionsToPlace(selectedPlace)}>
                                <Navigation className="mr-2 h-4 w-4"/>
                                {translations.map.getDirections}
                            </Button>
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    );
};

    

    


