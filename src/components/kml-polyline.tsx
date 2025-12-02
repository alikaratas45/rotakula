
"use client";

import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface KmlPolylineProps {
    kmlPath: string;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

    useEffect(() => {
        // 1. Cleanup function: This will run when the component unmounts OR before the effect runs again.
        // This ensures the previous polyline is always removed.
        return () => {
            if (polyline) {
                polyline.setMap(null);
            }
        };
    }, [polyline]); // Only depends on the polyline state itself.

    useEffect(() => {
        if (!map || !kmlPath) {
            return;
        }

        async function fetchAndDrawKml() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KML file: ${response.statusText}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const coordsStringNode = kml.getElementsByTagName('coordinates')[0];
                if (!coordsStringNode || !coordsStringNode.textContent) {
                    console.warn(`No valid <coordinates> tag found in KML file: ${kmlPath}`);
                    return;
                }

                const coordinates = coordsStringNode.textContent
                    .trim()
                    .split(/\s+/) // Handles spaces, newlines, tabs
                    .map(coordStr => {
                        const [lng, lat] = coordStr.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            return { lat, lng };
                        }
                        return null;
                    }).filter((c): c is { lat: number; lng: number } => c !== null);

                if (coordinates.length === 0) {
                     console.warn(`No valid coordinates parsed from KML file: ${kmlPath}`);
                     return;
                }

                const newPolyline = new google.maps.Polyline({
                    path: coordinates,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    map: map,
                });
                
                // 2. Set the new polyline to state. The cleanup effect will handle removing it next time.
                setPolyline(newPolyline);
                
            } catch (error) {
                console.error(`Error processing KML file ${kmlPath}:`, error);
            }
        }

        fetchAndDrawKml();
        
    }, [kmlPath, map]); // This effect re-runs ONLY when the map or kmlPath changes.

    return null; // This component does not render anything itself.
}
