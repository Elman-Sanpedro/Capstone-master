import { useEffect } from 'react';
import { MapPin, Navigation, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STORE } from '@/constants/store';

interface PickupLocationInfoProps {
    active: boolean;
    mapId: string;
    windowKey: string;
    directionsLabel?: string;
    directionsIcon?: LucideIcon;
}

// Store name/phone block + embedded Leaflet map + directions link, shown for
// pickup/preorder order types. Owns the Leaflet CSS/JS loading and map
// init/teardown itself (kept inline for now, not yet extracted into a
// separate hook). `mapId`/`windowKey` let Dashboard and Cart keep their own
// distinct DOM id / window global so their maps never collide if both were
// ever mounted at once.
export default function PickupLocationInfo({
    active,
    mapId,
    windowKey,
    directionsLabel = 'Get Directions in Google Maps',
    directionsIcon: DirectionsIcon = Navigation,
}: PickupLocationInfoProps) {
    // Load Leaflet CSS and JS once
    useEffect(() => {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
            document.head.appendChild(link);
        }
        if (!document.querySelector('script[src*="leaflet"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

    // Initialize pickup store map while active
    useEffect(() => {
        if (!active) return;

        const initializeMap = () => {
            const L = (window as any).L;
            if (!L) {
                setTimeout(initializeMap, 500);
                return;
            }

            const mapContainer = document.getElementById(mapId);
            if (!mapContainer) return;

            const existingMap = (window as any)[windowKey];
            if (existingMap) {
                existingMap.remove();
                (window as any)[windowKey] = null;
            }
            mapContainer.innerHTML = '';

            const map = L.map(mapId).setView(
                [STORE.coordinates.lat, STORE.coordinates.lng],
                16
            );

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            const storeIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color:#0891b2;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });

            L.marker([STORE.coordinates.lat, STORE.coordinates.lng], { icon: storeIcon })
                .addTo(map)
                .bindPopup(`<strong>${STORE.name}</strong><br/>${STORE.address}`)
                .openPopup();

            (window as any)[windowKey] = map;
        };

        setTimeout(initializeMap, 150);

        return () => {
            const existingMap = (window as any)[windowKey];
            if (existingMap) {
                existingMap.remove();
                (window as any)[windowKey] = null;
            }
        };
    }, [active, mapId, windowKey]);

    if (!active) return null;

    return (
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{STORE.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{STORE.address}</p>
                </div>
            </div>
            <div className="flex items-center space-x-2 pl-8">
                <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {STORE.phone.primary} / {STORE.phone.secondary}
                </p>
            </div>
            <div id={mapId} className="w-full h-48 rounded-lg overflow-hidden" style={{ zIndex: 0 }} />
            <button
                type="button"
                onClick={() => window.open(STORE.googleMapsUrl, '_blank')}
                className="flex items-center space-x-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
            >
                <DirectionsIcon className="w-4 h-4" />
                <span>{directionsLabel}</span>
            </button>
        </div>
    );
}
