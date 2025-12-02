
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
        // Clean up previous polyline when kmlPath changes or component unmounts
        if (polyline) {
            polyline.setMap(null);
        }

        if (!map || !kmlPath) {
            return;
        }

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
                        strokeColor: "#FF0000",
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        map: map,
                    });
                    setPolyline(newPolyline);
                }
                
            } catch (error) {
                console.error("Error fetching or parsing KML file:", error);
            }
        }

        fetchAndDrawKml();

        // Cleanup function for the effect
        return () => {
            if (newPolyline) {
                newPolyline.setMap(null);
            }
        };

    }, [kmlPath, map]);

    // This component does not render anything itself, it just manipulates the map.
    return null;
}
