"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon paths in Next.js/webpack environment.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ coords }: { coords: { lat: number; lon: number } }) {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lon], map.getZoom());
    }
  }, [coords, map]);

  return null;
}

function DraggableMarker({ position, onDragEnd }: { position: [number, number]; onDragEnd: (lat: number, lon: number) => void }) {
  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const marker = e.target;
        const latlng = marker.getLatLng();
        onDragEnd(latlng.lat, latlng.lng);
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker draggable eventHandlers={eventHandlers} position={position}>
      <Popup>Drag marker to your exact home location</Popup>
    </Marker>
  );
}

export function LeafletPinMap({ current, onCoordsChange }: { current: { lat: number; lon: number }; onCoordsChange: (lat: number, lon: number) => void }) {
  return (
    <MapContainer
      center={[current.lat, current.lon]}
      zoom={15}
      scrollWheelZoom={true}
      style={{ height: "240px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <RecenterMap coords={current} />
      <DraggableMarker position={[current.lat, current.lon]} onDragEnd={onCoordsChange} />
    </MapContainer>
  );
}
