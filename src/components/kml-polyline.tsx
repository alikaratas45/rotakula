
'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

interface KmlPolylineProps {
    kmlPath: string | null;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    // Ref to hold an array of polylines, as a KML file can contain multiple segments
    const polylinesRef = useRef<google.maps.Polyline[]>([]);

    useEffect(() => {
        // Function to clear all existing polylines from the map
        const clearPolylines = () => {
            polylinesRef.current.forEach(polyline => {
                polyline.setMap(null);
            });
            polylinesRef.current = [];
        };

        if (!map) {
            return;
        }

        // If no KML path is provided, clear existing lines and reset map view
        if (!kmlPath) {
            clearPolylines();
            map.panTo({ lat: 38.547, lng: 28.65 });
            map.setZoom(11);
            return;
        }

        async function fetchAndDrawKml() {
            clearPolylines();

            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    console.error(`KML file not found: ${response.statusText} for ${kmlPath}`);
                    return;
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");
                
                const parserError = kml.querySelector('parsererror');
                if (parserError) {
                    console.error('Error parsing KML:', parserError.textContent);
                    return;
                }

                // Find all <coordinates> elements. This is more direct.
                const coordsNodes = kml.getElementsByTagName('coordinates');
                
                if (coordsNodes.length === 0) {
                    console.warn(`No <coordinates> found in KML: ${kmlPath}`);
                    return;
                }
                
                const bounds = new google.maps.LatLngBounds();
                const createdPolylines: google.maps.Polyline[] = [];

                for (const coordsNode of Array.from(coordsNodes)) {
                    if (coordsNode?.textContent) {
                        const coordsText = coordsNode.textContent.trim();
                        const coordPairs = coordsText.split(/\s+/).filter(pair => pair.length > 0);

                        const path = coordPairs.map(pair => {
                            const parts = pair.split(',');
                            if (parts.length >= 2) {
                                const lng = parseFloat(parts[0]);
                                const lat = parseFloat(parts[1]);
                                if (!isNaN(lng) && !isNaN(lat)) {
                                    const latLng = new google.maps.LatLng(lat, lng);
                                    bounds.extend(latLng);
                                    return latLng;
                                }
                            }
                            return null;
                        }).filter((p): p is google.maps.LatLng => p !== null);

                        if (path.length > 1) {
                            const newPolyline = new google.maps.Polyline({
                                path: path,
                                strokeColor: "#0000FF", // Blue color for the route
                                strokeOpacity: 0.8,
                                strokeWeight: 6,
                                map: map,
                            });
                            createdPolylines.push(newPolyline);
                        }
                    }
                }
                
                if (createdPolylines.length > 0) {
                    polylinesRef.current = createdPolylines;
                    if (!bounds.isEmpty()) {
                        map.fitBounds(bounds, 60); // 60px padding
                    }
                } else {
                     console.warn(`Could not parse any valid polyline from KML file: ${kmlPath}`);
                }

            } catch (error) {
                console.error(`Error processing KML file (${kmlPath}):`, error);
            }
        }

        fetchAndDrawKml();

        // Cleanup function
        return () => {
            clearPolylines();
        };
        
    }, [kmlPath, map]);

    return null;
}
