'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

interface KmlPolylineProps {
    kmlPath: string | null;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        // Function to clear the existing polyline from the map
        const clearPolyline = () => {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
                polylineRef.current = null;
            }
        };

        if (!map) {
            return;
        }

        if (!kmlPath) {
            clearPolyline();
            // Optional: Reset map to default view when no route is selected
            map.panTo({ lat: 38.547, lng: 28.65 });
            map.setZoom(11);
            return;
        }

        async function fetchAndDrawKml() {
            clearPolyline(); // Clear any previous route

            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`KML file not found: ${response.status}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                // Find the LineString element which contains the path coordinates
                const lineStringNode = kml.getElementsByTagName('LineString')[0];
                if (!lineStringNode) {
                    console.warn(`No <LineString> element found in KML file: ${kmlPath}`);
                    return;
                }

                const coordsStringNode = lineStringNode.getElementsByTagName('coordinates')[0];
                if (!coordsStringNode || !coordsStringNode.textContent) {
                    console.warn(`No <coordinates> tag found inside <LineString> in KML file: ${kmlPath}`);
                    return;
                }

                const coordinates = coordsStringNode.textContent
                    .trim()
                    .split(/\s+/) // Split by any whitespace
                    .map(coordStr => {
                        const [lng, lat] = coordStr.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            return { lat, lng };
                        }
                        return null;
                    }).filter((c): c is { lat: number; lng: number } => c !== null);

                if (coordinates.length === 0) {
                     console.warn(`Could not parse valid coordinates from KML file: ${kmlPath}`);
                     return;
                }
                
                const newPolyline = new google.maps.Polyline({
                    path: coordinates,
                    strokeColor: "#0000FF", // A strong blue color
                    strokeOpacity: 0.8,
                    strokeWeight: 6, // Make it thicker and more visible
                    map: map,
                });
                
                polylineRef.current = newPolyline;
                
                // Automatically adjust the map's viewport to fit the entire polyline
                const bounds = new google.maps.LatLngBounds();
                coordinates.forEach(point => {
                    bounds.extend(point);
                });
                map.fitBounds(bounds, 60); // 60px padding

            } catch (error) {
                console.error(`Error processing KML file (${kmlPath}):`, error);
            }
        }

        fetchAndDrawKml();

        // Cleanup function for when the component unmounts or kmlPath changes
        return () => {
            clearPolyline();
        };
        
    }, [kmlPath, map]);

    return null; // This component does not render anything itself
}
