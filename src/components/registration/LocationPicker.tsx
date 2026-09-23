import { useEffect, useRef, useState } from "react";
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
  address?: string;
  onChange: (latitude: number, longitude: number) => void;
  autoDetectOnMount?: boolean;
}

export default function LocationPicker({
  latitude,
  longitude,
  address = "",
  onChange,
  autoDetectOnMount = false,
}: Props) {
  const { showToast } = useToast();
  const [position, setPosition] = useState<[number, number]>([
    latitude ?? 23.8103,
    longitude ?? 90.4125,
  ]);
  const [detecting, setDetecting] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState("");
  const [accuracy, setAccuracy] = useState<number>();
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const [manualLocationError, setManualLocationError] = useState("");
  const currentLocationRef = useRef({ latitude, longitude });
  const requestHadLocationRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    currentLocationRef.current = { latitude, longitude };
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!detecting) {
      setShowSlowMessage(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSlowMessage(true), 5000);
    return () => window.clearTimeout(timer);
  }, [detecting]);

  const handleMove = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChangeRef.current(lat, lng);
  };

  useEffect(() => {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 3) {
      setManualLocationError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(trimmedAddress)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } }
        );
        if (!response.ok) {
          throw new Error(`Location search failed with status ${response.status}`);
        }

        const results = (await response.json()) as Array<{ lat: string; lon: string }>;
        const result = results[0];
        if (!result) {
          setManualLocationError(
            "We could not find that address. Please choose your location manually on the map."
          );
          return;
        }

        const newPosition: [number, number] = [Number(result.lat), Number(result.lon)];
        if (newPosition.some((coordinate) => !Number.isFinite(coordinate))) {
          throw new Error("The location search returned invalid coordinates.");
        }
        setPosition(newPosition);
        setFlyTarget(newPosition);
        setAccuracy(undefined);
        setManualLocationError("");
        onChangeRef.current(newPosition[0], newPosition[1]);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setManualLocationError(
          "We could not update the map for that address. Please choose your location manually on the map."
        );
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [address]);

  const detectLocation = () => {
    setDetecting(true);
    setLocationError("");
    setShowSlowMessage(false);
    requestHadLocationRef.current =
      latitude !== undefined && longitude !== undefined;

    if (!navigator.geolocation) {
      const message = "Geolocation is not supported by your browser.";
      setLocationError(message);
      setManualLocationError(
        "Please add your location manually or choose it on the map manually."
      );
      showToast("error", message);
      setDetecting(false);
      return;
    }

    const handleSuccess = ({ coords }: GeolocationPosition) => {
      const currentLocation = currentLocationRef.current;
      if (
        !requestHadLocationRef.current &&
        currentLocation.latitude !== undefined &&
        currentLocation.longitude !== undefined
      ) {
        setDetecting(false);
        return;
      }
      const newPosition: [number, number] = [coords.latitude, coords.longitude];
      setPosition(newPosition);
      setFlyTarget(newPosition);
      setAccuracy(coords.accuracy);
      onChangeRef.current(coords.latitude, coords.longitude);
      setDetecting(false);
      setManualLocationError("");
      showToast("success", "Your current location was detected successfully.");
    };

    const handleError = (error: GeolocationPositionError) => {
      const message =
        error.code === 1
          ? "Location permission was denied. Allow location access in your browser settings and try again."
          : error.code === 3
            ? "Location detection timed out. Turn on GPS/location services and try again."
            : "Could not detect your location. You can pin it manually on the map.";
      setLocationError(message);
      setManualLocationError(
        "Please add your location manually or choose it on the map manually."
      );
      showToast("error", message);
      setDetecting(false);
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (autoDetectOnMount && latitude === undefined && longitude === undefined) {
      detectLocation();
    }
  }, [autoDetectOnMount]);

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
      {manualLocationError && (
        <p className="alert alert-warning py-2 text-xs">{manualLocationError}</p>
      )}
      {showSlowMessage && (
        <p className="text-xs text-base-content/60">
          Still finding your location... this can take longer on mobile.
        </p>
      )}
    </div>
  );
}
