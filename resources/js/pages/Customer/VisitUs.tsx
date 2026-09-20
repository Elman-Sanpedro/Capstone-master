import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { MapPin, Navigation, Phone, Wallet } from 'lucide-react';
import CustomerNav from '@/components/CustomerNav';
import { STORE } from '@/constants/store';

const MAP_ID = 'visit-us-store-map';
const WINDOW_KEY = 'visitUsStoreMap';

// Always-visible store location page, reachable from the main nav regardless
// of order type or checkout progress. Mirrors the Leaflet load/init/teardown
// logic in components/customer/PickupLocationInfo.tsx (kept separate here
// since that component always renders its own address/phone card, which
// would duplicate the one below).
export default function VisitUs() {
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

        const initializeMap = () => {
            const L = (window as any).L;
            if (!L) {
                setTimeout(initializeMap, 500);
                return;
            }

            const mapContainer = document.getElementById(MAP_ID);
            if (!mapContainer) return;

            const existingMap = (window as any)[WINDOW_KEY];
            if (existingMap) {
                existingMap.remove();
                (window as any)[WINDOW_KEY] = null;
            }
            mapContainer.innerHTML = '';

            const map = L.map(MAP_ID).setView([STORE.coordinates.lat, STORE.coordinates.lng], 16);

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

            (window as any)[WINDOW_KEY] = map;
        };

        const timer = setTimeout(initializeMap, 150);

        return () => {
            clearTimeout(timer);
            const existingMap = (window as any)[WINDOW_KEY];
            if (existingMap) {
                existingMap.remove();
                (window as any)[WINDOW_KEY] = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <Head title="Visit Us" />
            <CustomerNav currentPage="visit-us" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visit Us</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Here's where to find {STORE.name} for pickup or a walk-in visit.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6 flex flex-col justify-center">
                        <div className="flex items-start space-x-3">
                            <MapPin className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{STORE.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{STORE.address}</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Phone className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <a
                                    href={`tel:${STORE.phone.primary.replace(/[^\d+]/g, '')}`}
                                    className="block text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400"
                                >
                                    {STORE.phone.primary}
                                </a>
                                <a
                                    href={`tel:${STORE.phone.secondary.replace(/[^\d+]/g, '')}`}
                                    className="block text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400"
                                >
                                    {STORE.phone.secondary}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Wallet className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">GCash</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{STORE.gcash}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => window.open(STORE.googleMapsUrl, '_blank')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-all font-medium text-sm shadow-sm w-fit"
                        >
                            <Navigation className="w-4 h-4" />
                            Get Directions in Google Maps
                        </button>
                    </div>

                    <div id={MAP_ID} className="w-full h-72 lg:h-full min-h-[288px] rounded-lg overflow-hidden" style={{ zIndex: 0 }} />
                </div>
            </div>
        </div>
    );
}
