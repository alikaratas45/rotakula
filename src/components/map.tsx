
"use client";

import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { PointOfInterest } from "@/lib/types";
import { useCallback, useEffect, useState, useRef } from "react";
import { Loader2, Star, Navigation, X } from "lucide-react";
import Image from "next/image";
import { getImageById } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

// --- User Location Marker ---
export function UserLocationMarker() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const { translations } = useApp();
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
export default function EmbeddedMap({ pois, drawRouteLine = false }: { pois: PointOfInterest[], drawRouteLine?: boolean }) {
  const map = useMap();
  const router = useRouter();
  const { translations } = useApp();
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);


  const handleMarkerClick = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
  };
  
  const handleInfoWindowClose = () => {
    setSelectedPoi(null);
  }

  const handleGetDirections = (poi: PointOfInterest) => {
      if (!poi) return;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;
      window.open(url, '_blank');
  }

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
    if (!map) return;

    // 1. Clear any existing polyline
    if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
    }

    // 2. Decide what to do based on props
    if (drawRouteLine && pois.length > 1) {
        // --- DRAW ROUTE ON ROADS ---
        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: pois[0].latitude, lng: pois[0].longitude };
        const destination = { lat: pois[pois.length - 1].latitude, lng: pois[pois.length - 1].longitude };
        const waypoints = pois.slice(1, -1).map(poi => ({
            location: { lat: poi.latitude, lng: poi.longitude },
            stopover: true,
        }));

        directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING, // Default to driving
                waypoints: waypoints,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    const routePolyline = new google.maps.Polyline({
                        path: result.routes[0].overview_path,
                        geodesic: true,
                        strokeColor: '#4285F4',
                        strokeOpacity: 0.9,
                        strokeWeight: 5
                    });
                    routePolyline.setMap(map);
                    polylineRef.current = routePolyline;
                    
                    // Fit map to the route bounds
                    map.fitBounds(result.routes[0].bounds, 60);

                } else {
                    console.error(`Directions request failed due to ${status}. Falling back to fitting POIs.`);
                    // Fallback: Fit bounds to POIs directly if Directions API fails
                    const bounds = new google.maps.LatLngBounds();
                    pois.forEach((poi) => {
                        bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
                    });
                    map.fitBounds(bounds, 60);
                }
            }
        );
    } else if (pois.length > 0) {
        // --- FIT POIS WITHOUT ROUTE LINE ---
        if (pois.length === 1) {
            // Single POI: center on it
            map.setCenter({ lat: pois[0].latitude, lng: pois[0].longitude });
            map.setZoom(15);
        } else {
            // Multiple POIs: fit them all
            const bounds = new google.maps.LatLngBounds();
            pois.forEach((poi) => {
                bounds.extend(new google.maps.LatLng(poi.latitude, poi.longitude));
            });
            map.fitBounds(bounds, 60);
        }
    } else {
        // --- NO POIS, DEFAULT VIEW ---
        if (userPosition) {
            map.setCenter(userPosition);
            map.setZoom(13);
        } else {
            map.setCenter({ lat: 38.547, lng: 28.65 });
            map.setZoom(13);
        }
    }

    setMarkersLoaded(true);

  }, [map, pois, drawRouteLine, userPosition]);


  const center = pois.length > 0
    ? { lat: pois[0].latitude, lng: pois[0].longitude }
    : { lat: 38.547, lng: 28.52 };
    
  const poiImage = selectedPoi ? getImageById(selectedPoi.imageId) : null;


  return (
    <div className="h-80 w-full rounded-lg overflow-hidden relative">
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
        gestureHandling={"cooperative"}
        disableDefaultUI={false}
        zoomControl={true}
        mapId="rotakula-map"
        onClick={handleInfoWindowClose}
      >
        {userPosition && <UserLocationMarker />}
        {pois.map((poi) => (
          <PoiMarker key={poi.id} poi={poi} onClick={() => handleMarkerClick(poi)} />
        ))}
      </Map>

        {selectedPoi && (
            <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
                <Card className="w-full max-w-sm overflow-hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white hover:text-white"
                        onClick={handleInfoWindowClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    {poiImage && (
                        <div className="relative h-40 w-full">
                             <Image
                                src={poiImage.imageUrl}
                                alt={poiImage.description}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <CardHeader>
                        <CardTitle>{selectedPoi.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">{selectedPoi.description}</p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button className="w-full" variant="outline" onClick={() => handleGetDirections(selectedPoi)}>
                            <Navigation className="mr-2 h-4 w-4"/>
                            {translations.map.getDirections}
                        </Button>
                        <Button className="w-full" variant="secondary" onClick={() => router.push(`/places/${selectedPoi.slug}`)}>
                            {translations.common.moreInfo}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )}
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
    const { translations } = useApp();
    const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
    const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserPosition({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => {
                // If user denies or an error occurs, fall back to Kula center
                setUserPosition({ lat: 38.547, lng: 28.65 });
            }
        );
    }, []);

    // Perform nearby search
    useEffect(() => {
        if (!map || !userPosition) return;

        const placesService = new google.maps.places.PlacesService(map);
        
        setIsLoading(true);
        const request: google.maps.places.TextSearchRequest = {
            query: "Kula'daki restoran, lokanta veya kafeler",
            location: userPosition,
            radius: 20000, // 20km radius to cover the whole town
        };

        placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                setPlaces(results);
                const bounds = new google.maps.LatLngBounds();
                results.forEach(place => {
                    if (place.geometry?.location) {
                        bounds.extend(place.geometry.location);
                    }
                });
                map.fitBounds(bounds);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                setError(translations.map.noRestaurantsFound);
                map.setCenter(userPosition);
                map.setZoom(13);
            } else {
                setError(translations.map.searchError);
                map.setCenter(userPosition);
                map.setZoom(13);
            }
            setIsLoading(false);
        });

    }, [map, userPosition, translations]);
    
    
    const handleMarkerClick = (place: google.maps.places.PlaceResult) => {
       setSelectedPlace(place);
    }
    
    const handleInfoWindowClose = () => {
       setSelectedPlace(null);
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
            <div className="h-80 flex items-center justify-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="h-80 w-full rounded-lg overflow-hidden relative">
            {isLoading && (
                 <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{translations.map.loading}</span>
                    </div>
                </div>
            )}
            <Map
                center={userPosition || { lat: 38.547, lng: 28.65 }}
                zoom={14}
                gestureHandling={"cooperative"}
                disableDefaultUI={false}
                zoomControl={true}
                mapId="rotakula-nearby-map"
                onClick={() => setSelectedPlace(null)}
            >
                {userPosition && <UserLocationMarker />}
                {places.map((place) => 
                    place.place_id && <PlaceMarker key={place.place_id} place={place} onClick={() => handleMarkerClick(place)} />
                )}
            </Map>
             {selectedPlace && (
                <div className="absolute inset-0 z-20 bg-background/90 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
                    <Card className="w-full max-w-sm overflow-hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white hover:text-white"
                            onClick={handleInfoWindowClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        {selectedPlace.photos?.[0] && (
                            <div className="relative h-40 w-full">
                                <Image
                                    src={selectedPlace.photos[0].getUrl({maxWidth: 400, maxHeight: 400})}
                                    alt={selectedPlace.name || 'Restaurant image'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{selectedPlace.name}</CardTitle>
                            {selectedPlace.rating && (
                                <CardDescription className="flex items-center gap-1 text-sm text-yellow-600">
                                    <Star className="w-4 h-4 fill-current" /> 
                                    <span>{selectedPlace.rating} ({selectedPlace.user_ratings_total} {translations.map.reviews})</span>
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground line-clamp-2">{selectedPlace.vicinity}</p>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button className="w-full" variant="outline" onClick={() => handleGetDirectionsToPlace(selectedPlace)}>
                                <Navigation className="mr-2 h-4 w-4"/>
                                {translations.map.getDirections}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
};
