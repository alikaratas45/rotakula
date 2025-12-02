
"use client";

import { useEffect, useState } from 'react';
import { Polyline, useMap } from '@vis.gl/react-google-maps';
import { convert, type Element } from 'xml-js';

interface KmlPolylineProps {
    kmlPath: string;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
    
    useEffect(() => {
        async function fetchAndParseKml() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    throw new Error(`Failed to fetch KML file: ${response.statusText}`);
                }
                const kmlText = await response.text();

                // Using xml-js to parse KML
                const result = convert.xml2js(kmlText, { compact: false }) as Element;
                
                // Find coordinates element recursively
                let coordsString: string | undefined;
                function findCoordinates(element: Element) {
                    if (element.name === 'coordinates') {
                        coordsString = element.elements?.[0]?.text as string;
                        return;
                    }
                    if (element.elements) {
                        for (const child of element.elements) {
                            findCoordinates(child);
                            if (coordsString) return;
                        }
                    }
                }
                findCoordinates(result);

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
    }, [kmlPath, map]);

    if (path.length === 0) {
        return null;
    }

    return <Polyline path={path} strokeColor="#FF0000" strokeOpacity={0.8} strokeWeight={4} />;
}
