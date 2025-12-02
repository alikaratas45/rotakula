
"use client";

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface KmlPolylineProps {
    kmlPath: string;
}

export function KmlPolyline({ kmlPath }: KmlPolylineProps) {
    const map = useMap();
    // useRef, bileşen yeniden render olsa bile polyline referansını kaybetmememizi sağlar.
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map || !kmlPath) {
            // Eğer harita veya KML yolu yoksa, hiçbir şey yapma.
            return;
        }

        // 1. Önceki rotayı haritadan temizle.
        // Bu, yeni bir rota seçildiğinde eskisinin kalmasını engeller.
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }

        async function fetchAndDrawKml() {
            try {
                const response = await fetch(kmlPath);
                if (!response.ok) {
                    // Eğer dosya bulunamazsa (404 hatası gibi), konsola net bir hata yaz.
                    throw new Error(`KML dosyası getirilemedi: ${response.status} ${response.statusText}. Kontrol edilen yol: ${kmlPath}`);
                }
                const kmlText = await response.text();
                
                const parser = new DOMParser();
                const kml = parser.parseFromString(kmlText, "application/xml");

                const coordsStringNode = kml.getElementsByTagName('coordinates')[0];
                if (!coordsStringNode || !coordsStringNode.textContent) {
                    // Eğer KML dosyası içinde <coordinates> etiketi yoksa, hata ver.
                    console.warn(`KML dosyasında <coordinates> etiketi bulunamadı: ${kmlPath}`);
                    return;
                }

                // Koordinatları daha esnek bir şekilde ayrıştır.
                // Farklı boşluk türlerini (boşluk, yeni satır, tab) ve fazla boşlukları tolere eder.
                const coordinates = coordsStringNode.textContent
                    .trim()
                    .split(/\s+/) 
                    .map(coordStr => {
                        const [lng, lat] = coordStr.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            return { lat, lng };
                        }
                        return null;
                    }).filter((c): c is { lat: number; lng: number } => c !== null);

                if (coordinates.length === 0) {
                     // Eğer koordinatlar ayrıştırılamazsa, hata ver.
                     console.warn(`KML dosyasından geçerli koordinat ayrıştırılamadı: ${kmlPath}`);
                     return;
                }
                
                // 2. Yeni rotayı oluştur ve çiz.
                const newPolyline = new google.maps.Polyline({
                    path: coordinates,
                    strokeColor: "#FF0000", // Kırmızı renk
                    strokeOpacity: 0.8,
                    strokeWeight: 4, // Daha belirgin bir kalınlık
                    map: map,
                });
                
                // 3. Yeni çizilen rotanın referansını sakla ki bir sonraki seçimde silebilelim.
                polylineRef.current = newPolyline;
                
            } catch (error) {
                console.error(`KML dosyası işlenirken bir hata oluştu (${kmlPath}):`, error);
            }
        }

        fetchAndDrawKml();

        // Bu cleanup fonksiyonu, component unmount olduğunda son rotayı temizler.
        return () => {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }
        };
        
    }, [kmlPath, map]); // Bu efekt, SADECE kmlPath veya map değiştiğinde çalışır.

    return null; // Bu bileşen görsel bir çıktı üretmez.
}
