import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Navigation, MapPin } from "lucide-react";
import { useToast } from "../../context/ToastContext";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapClickHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onMove(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  latitude?: number;
  longitude?: number;
  onChange: (latitude: number, longitude: number) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const { showToast } = useToast();
  const [position, setPosition] = useState<[number, number]>([
    latitude ?? 23.8103,
    longitude ?? 90.4125,
  ]);
  const [detecting, setDetecting] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState("");
  const [accuracy, setAccuracy] = useState<number>();

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleMove = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  const detectLocation = () => {
    setDetecting(true);
    setLocationError("");

    if (!navigator.geolocation) {
      const message = "Geolocation is not supported by your browser.";
      setLocationError(message);
      showToast("error", message);
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const newPosition: [number, number] = [coords.latitude, coords.longitude];
        setPosition(newPosition);
        setFlyTarget(newPosition);
        setAccuracy(coords.accuracy);
        onChange(coords.latitude, coords.longitude);
        setDetecting(false);
        showToast("success", "Your current location was detected successfully.");
      },
      (error) => {
        const message =
          error.code === 1
            ? "Location permission was denied. Allow location access in your browser settings and try again."
            : error.code === 3
              ? "Location detection timed out. Turn on GPS/location services and try again."
              : "Could not detect your location. You can pin it manually on the map.";
        setLocationError(message);
        showToast("error", message);
        setDetecting(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      detectLocation();
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-base-content/50 flex items-center gap-1">
          <MapPin size={12} className="text-primary" />
          Click the map to pin your location or use GPS
        </p>
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="btn btn-primary btn-xs gap-1"
        >
          {detecting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Navigation size={11} />
          )}
          {detecting ? "Detecting..." : "Use my current location"}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border-2 border-base-300">
        <MapContainer
          center={position}
          zoom={15}
          className="grayscale-map h-56 w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler onMove={handleMove} />
          {flyTarget && <FlyTo lat={flyTarget[0]} lng={flyTarget[1]} />}
          <Marker position={position} />
        </MapContainer>
      </div>

      <p className="text-xs text-base-content/50 tabular-nums">
        {position[0].toFixed(6)}, {position[1].toFixed(6)}
        {accuracy !== undefined && ` (accuracy: approximately ${Math.round(accuracy)}m)`}
      </p>
      {locationError && <p className="text-xs text-error">{locationError}</p>}
    </div>
  );
}
