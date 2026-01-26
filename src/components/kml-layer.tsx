'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

interface KmlLayerProps {
    url: string | null;
}

export const KmlLayerComponent = ({ url }: KmlLayerProps) => {
    const map = useMap();
    const kmlLayerRef = useRef<google.maps.KmlLayer | null>(null);

    useEffect(() => {
        // Ensure map is available and we are in a browser environment
        if (!map || typeof window === 'undefined') {
            return;
        }

        // Clean up previous layer if it exists
        if (kmlLayerRef.current) {
            kmlLayerRef.current.setMap(null);
            kmlLayerRef.current = null;
        }

        if (url) {
            // KML layer requires an absolute URL, so we construct it.
            // This assumes the KML files are in the public directory.
            const absoluteUrl = `${window.location.origin}${url}`;
            
            const layer = new google.maps.KmlLayer({
                url: absoluteUrl,
                map: map,
                preserveViewport: false, // Let the KML layer set the viewport to fit the route
                suppressInfoWindows: true, // We can handle popups ourselves if needed
            });
            
            kmlLayerRef.current = layer;

        } else {
             // If no URL is provided, pan back to the default view of Kula
             map.panTo({ lat: 38.547, lng: 28.65 });
             map.setZoom(11);
        }
        
        // Cleanup function
        return () => {
            if (kmlLayerRef.current) {
                kmlLayerRef.current.setMap(null);
            }
        };

    }, [map, url]);

    return null; // This component does not render anything itself
};
