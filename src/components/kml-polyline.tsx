'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

interface KmlPolylineProps {
    kmlPath: string | null;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    // Keep a ref to an array of polylines, as a KML file can contain multiple segments
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
                    throw new Error(`KML file not found: ${response.statusText} for ${kmlPath}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");
                
                const parserError = kml.querySelector('parsererror');
                if (parserError) {
                    console.error('Error parsing KML:', parserError.textContent);
                    return;
                }

                // Find all LineString elements, regardless of their parent elements
                const lineStringNodes = kml.getElementsByTagNameNS('*', 'LineString');
                if (lineStringNodes.length === 0) {
                    console.warn(`No <LineString> found in KML: ${kmlPath}`);
                    return;
                }
                
                const bounds = new google.maps.LatLngBounds();
                const createdPolylines: google.maps.Polyline[] = [];

                // Iterate over each LineString found in the KML
                for (const lineStringNode of Array.from(lineStringNodes)) {
                    const coordsNode = lineStringNode.getElementsByTagNameNS('*', 'coordinates')[0];
                    if (coordsNode?.textContent) {
                        const coordinates = coordsNode.textContent
                            .trim()
                            .split(/\s+/) // Split by any whitespace (space, newline, etc.)
                            .filter(c => c.length > 0) // Filter out potential empty strings
                            .map(coordStr => {
                                const [lng, lat] = coordStr.split(',').map(Number);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    const latLng = { lat, lng };
                                    bounds.extend(latLng); // Extend bounds for each valid point
                                    return latLng;
                                }
                                return null;
                            }).filter((c): c is { lat: number; lng: number } => c !== null);

                        // Only create a polyline if it has at least two points
                        if (coordinates.length > 1) {
                            const newPolyline = new google.maps.Polyline({
                                path: coordinates,
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
                    // Fit the map to the bounds of all points from all polylines
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

        // Cleanup function to remove polylines when component unmounts or kmlPath changes
        return () => {
            clearPolylines();
        };
        
    }, [kmlPath, map]);

    return null; // This component does not render anything itself
}
