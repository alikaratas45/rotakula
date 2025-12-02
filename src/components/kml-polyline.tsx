
"use client";

import { useEffect, useState } from 'react';
import { Polyline } from '@vis.gl/react-google-maps';

interface KmlPolylineProps {
    kmlPath: string;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
    
    useEffect(() => {
        async function fetchAndParseKml() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KML file: ${response.statusText}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const coordsString = kml.getElementsByTagName('coordinates')[0]?.textContent;

                if (!coordsString) {
                    console.warn("No <coordinates> tag found in KML file.");
                    setPath([]);
                    return;
                }

                const coordinates = coordsString.trim().split(/\s+/).map(coordStr => {
                    const [lng, lat] = coordStr.split(',').map(Number);
                    return { lat, lng };
                });

                setPath(coordinates);
                
            } catch (error) {
                console.error("Error parsing KML file:", error);
                setPath([]);
            }
        }

        if (kmlPath) {
            fetchAndParseKml();
        } else {
            setPath([]);
        }
    }, [kmlPath]);

    if (path.length === 0) {
        return null;
    }

    return <Polyline path={path} strokeColor="#FF0000" strokeOpacity={0.8} strokeWeight={4} />;
}
