
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
        // Clean up the old polyline when a new path is selected or component unmounts
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
                    throw new Error(`Failed to fetch KML file: ${response.status} ${response.statusText} for path: ${kmlPath}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const coordsString = kml.getElementsByTagName('coordinates')[0]?.textContent;

                if (!coordsString) {
                    console.warn(`No <coordinates> tag found in KML file: ${kmlPath}`);
                    return;
                }

                const coordinates = coordsString
                    .trim()
                    .split(/\s+/) // Use regex to handle one or more whitespace characters
                    .map(coordStr => {
                        const [lng, lat] = coordStr.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            return { lat, lng };
                        }
                        return null;
                    }).filter((c): c is { lat: number; lng: number } => c !== null);

                if (coordinates.length > 0) {
                     newPolyline = new google.maps.Polyline({
                        path: coordinates,
                        strokeColor: "#FF0000", // Red color
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        map: map,
                    });
                    setPolyline(newPolyline);
                } else {
                    console.warn(`No valid coordinates found in KML file: ${kmlPath}`);
                }
                
            } catch (error) {
                console.error("Error fetching or parsing KML file:", error);
            }
        }

        fetchAndDrawKml();

        // This return function handles cleanup when the component unmounts
        // or when kmlPath changes before the next effect runs.
        return () => {
            if (newPolyline) {
                newPolyline.setMap(null);
            }
             if (polyline) {
                polyline.setMap(null);
            }
        };

    // Disabled exhaustive-deps because we only want this to re-run for kmlPath or map.
    // Polyline state change should not trigger a re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kmlPath, map]);

    return null;
}
