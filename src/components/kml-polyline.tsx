
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
        // 1. Clean up any existing polyline from the map when the component re-renders or kmlPath changes.
        if (polyline) {
            polyline.setMap(null);
        }

        // If map is not ready or kmlPath is not provided, do nothing.
        if (!map || !kmlPath) {
            return;
        }

        // 2. Fetch and draw the new KML data.
        let newPolyline: google.maps.Polyline;
        async function fetchAndDrawKml() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KML file: ${response.statusText} for path: ${kmlPath}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const coordsString = kml.getElementsByTagName('coordinates')[0]?.textContent;

                if (!coordsString) {
                    console.warn(`No <coordinates> tag found in KML file: ${kmlPath}`);
                    return;
                }

                const coordinates = coordsString.trim().split(/\s+/).map(coordStr => {
                    const [lng, lat] = coordStr.split(',').map(Number);
                    return { lat, lng };
                });

                if (coordinates.length > 0) {
                     newPolyline = new google.maps.Polyline({
                        path: coordinates,
                        strokeColor: "#FF0000", // Red color
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        map: map,
                    });
                    // 3. Store the newly created polyline in state for future cleanup.
                    setPolyline(newPolyline);
                }
                
            } catch (error) {
                console.error("Error fetching or parsing KML file:", error);
            }
        }

        fetchAndDrawKml();

        // 4. Return a cleanup function for this effect.
        // This is crucial for when the component unmounts.
        return () => {
            // Note: `newPolyline` is not accessible here. The cleanup is handled by the `if (polyline)` block at the start of the effect.
        };

    }, [kmlPath, map]); // The effect re-runs whenever kmlPath or the map instance changes.

    // This component does not render anything itself, it just manipulates the map.
    return null;
}
