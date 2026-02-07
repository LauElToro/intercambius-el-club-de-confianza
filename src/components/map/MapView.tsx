import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapViewProps {
  center: { lat: number; lng: number };
  radiusKm?: number;
  className?: string;
  height?: number;
}

/**
 * Mapa con círculo de radio. Usa Leaflet (OpenStreetMap) sin credenciales.
 * Cuando tengas VITE_GOOGLE_MAPS_API_KEY, se puede cambiar a Google Maps.
 */
export const MapView = ({ center, radiusKm = 25, className = "", height = 240 }: MapViewProps) => {
  const zoom = radiusKm <= 10 ? 12 : radiusKm <= 50 ? 10 : 8;

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "hsl(var(--primary))",
            fillColor: "hsl(var(--primary) / 0.2)",
            fillOpacity: 0.3,
            weight: 2,
          }}
        />
        <MapCenterUpdater center={center} />
      </MapContainer>
    </div>
  );
};

function MapCenterUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}
