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
            map.panTo({ lat: 38.547, lng: 28.65 });
            map.setZoom(11);
            return;
        }

        async function fetchAndDrawKml() {
            clearPolyline();

            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`KML file not found: ${response.status}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const lineStringNodes = kml.getElementsByTagName('LineString');
                if (!lineStringNodes || lineStringNodes.length === 0) {
                    console.warn(`No <LineString> element found in KML file: ${kmlPath}`);
                    return;
                }

                let allCoordinates: { lat: number; lng: number }[] = [];

                for (let i = 0; i < lineStringNodes.length; i++) {
                    const coordsNode = lineStringNodes[i].getElementsByTagName('coordinates')[0];
                    if (coordsNode && coordsNode.textContent) {
                        const coordinates = coordsNode.textContent
                            .trim()
                            .split(/\s+/)
                            .map(coordStr => {
                                const [lng, lat] = coordStr.split(',').map(Number);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    return { lat, lng };
                                }
                                return null;
                            }).filter((c): c is { lat: number; lng: number } => c !== null);
                        
                        allCoordinates = allCoordinates.concat(coordinates);
                    }
                }

                if (allCoordinates.length < 2) {
                     console.warn(`Could not parse a valid polyline (less than 2 points) from KML file: ${kmlPath}`);
                     return;
                }
                
                const newPolyline = new google.maps.Polyline({
                    path: allCoordinates,
                    strokeColor: "#0000FF",
                    strokeOpacity: 0.8,
                    strokeWeight: 6,
                    map: map,
                });
                
                polylineRef.current = newPolyline;
                
                const bounds = new google.maps.LatLngBounds();
                allCoordinates.forEach(point => {
                    bounds.extend(point);
                });
                map.fitBounds(bounds, 60);

            } catch (error) {
                console.error(`Error processing KML file (${kmlPath}):`, error);
            }
        }

        fetchAndDrawKml();

        return () => {
            clearPolyline();
        };
        
    }, [kmlPath, map]);

    return null;
}
