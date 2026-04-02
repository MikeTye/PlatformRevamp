import { useEffect, useLayoutEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngLiteral } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type ProjectLocationMapProps = {
    lat: string;
    lng: string;
    onChange: (next: { lat: string; lng: string }) => void;
    height?: number;
};

const DEFAULT_CENTER: LatLngLiteral = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;
const PIN_ZOOM = 10;

const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function toNumber(value: string): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinate(value: number): string {
    return value.toFixed(6);
}

function MapClickHandler({
    onPick,
}: {
    onPick: (coords: { lat: string; lng: string }) => void;
}) {
    useMapEvents({
        click(event) {
            onPick({
                lat: formatCoordinate(event.latlng.lat),
                lng: formatCoordinate(event.latlng.lng),
            });
        },
    });

    return null;
}

function RefreshMapSize() {
    const map = useMap();

    useLayoutEffect(() => {
        const id = window.setTimeout(() => {
            map.invalidateSize();
        }, 0);

        return () => window.clearTimeout(id);
    }, [map]);

    return null;
}

function RecenterMap({
    position,
}: {
    position: LatLngLiteral | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!position) return;
        map.setView(position, Math.max(map.getZoom(), PIN_ZOOM), { animate: true });
    }, [map, position]);

    return null;
}

export default function ProjectLocationMap({
    lat,
    lng,
    onChange,
    height = 360,
}: ProjectLocationMapProps) {
    const parsedLat = toNumber(lat);
    const parsedLng = toNumber(lng);

    const markerPosition = useMemo<LatLngLiteral | null>(() => {
        if (parsedLat === null || parsedLng === null) return null;
        return { lat: parsedLat, lng: parsedLng };
    }, [parsedLat, parsedLng]);

    const center = markerPosition ?? DEFAULT_CENTER;

    return (
        <Box
            sx={{
                height,
                width: '100%',
                '& .leaflet-container': {
                    height: '100%',
                    width: '100%',
                    fontFamily: 'inherit',
                },
            }}
        >
            <MapContainer
                center={center}
                zoom={markerPosition ? PIN_ZOOM : DEFAULT_ZOOM}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RefreshMapSize />
                <MapClickHandler onPick={onChange} />
                <RecenterMap position={markerPosition} />

                {markerPosition && <Marker position={markerPosition} icon={markerIcon} />}
            </MapContainer>
        </Box>
    );
}