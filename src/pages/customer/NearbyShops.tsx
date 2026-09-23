import { useTheme } from "../../context/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { MapPin, Store, LocateFixed, Navigation } from "lucide-react";
import api from "../../lib/api";
import { Shop } from "../../types";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAuth } from "../../context/AuthContext";

function FitShopMarkers({ shops }: { shops: Shop[] }) {
  const map = useMap();
  useEffect(() => {
    const points = shops
      .filter((shop) => shop.location)
      .map((shop) => [shop.location!.coordinates[1], shop.location!.coordinates[0]] as [number, number]);
    if (points.length > 0) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
  }, [map, shops]);
  return null;
}

export default function NearbyShops() {
  const { t, theme } = useTheme();
  const { profile } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [mapShops, setMapShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const distanceInMeters = (shop: Shop) => {
    if (!location || !shop.location) return null;
    const [lng, lat] = shop.location.coordinates;
    const radians = (value: number) => (value * Math.PI) / 180;
    const dLat = radians(lat - location.lat);
    const dLng = radians(lng - location.lng);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(radians(location.lat)) * Math.cos(radians(lat)) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  const formatDistance = (meters: number | null) =>
    meters === null ? "" : meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  const userIcon = L.divIcon({ className: "map-user-marker", html: '<span class="map-user-marker-dot"></span>', iconSize: [24, 24], iconAnchor: [12, 12] });
  const shopIcon = (isOpen: boolean) => L.divIcon({
    className: `map-shop-marker ${isOpen ? "is-open" : "is-closed"}`,
    html: '<span class="map-shop-marker-pin"><span></span></span>',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });

  const fetchNearby = (lat: number, lng: number) => {
    const currentRequest = ++requestId.current;
    setError("");
    setShops([]);
    setLoading(true);
    api
      .get(`/shops/nearby?lat=${lat}&lng=${lng}&maxDistance=1000`)
      .then((res) => {
        if (currentRequest !== requestId.current) return;
        setShops((res.data as Shop[]).filter((shop) => {
          const distance = distanceInMetersFrom(lat, lng, shop);
          return distance !== null && distance <= 1000;
        }));
      })
      .catch(() => {
        if (currentRequest === requestId.current) setError("Failed to load shops");
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
  };

  const distanceInMetersFrom = (lat: number, lng: number, shop: Shop) => {
    if (!shop.location) return null;
    const [shopLng, shopLat] = shop.location.coordinates;
    const radians = (value: number) => (value * Math.PI) / 180;
    const dLat = radians(shopLat - lat);
    const dLng = radians(shopLng - lng);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(radians(lat)) * Math.cos(radians(shopLat)) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t("nearby.location_unavailable"));
      return;
    }
    setLoading(true);
    setError("");
    const handleSuccess = ({ coords }: GeolocationPosition) => {
      const loc = { lat: coords.latitude, lng: coords.longitude };
      setLocation(loc);
      fetchNearby(loc.lat, loc.lng);
    };
    const handleError = () => {
        setLoading(false);
        setError(t("nearby.location_permission"));
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
    api.get("/shops/map").then((res) => setMapShops(res.data)).catch(() => setMapShops([]));
  }, []);

  useEffect(() => {
    if (profile?.latitude !== undefined && profile.longitude !== undefined) {
      const loc = { lat: profile.latitude, lng: profile.longitude };
      setLocation(loc);
      fetchNearby(loc.lat, loc.lng);
    } else {
      setLocation(null);
      setShops([]);
      setError(t("nearby.set_location_first"));
    }
  }, [profile?.latitude, profile?.longitude]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("label.nearby_shops")}</h1>
        <p className="text-base-content/50 mt-1">
          {t("nearby.within_radius")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={useCurrentLocation} className="btn btn-outline btn-sm gap-2">
            <Navigation size={15} />
            {t("nearby.use_current_location")}
          </button>
          {profile?.latitude !== undefined && (
            <span className="self-center text-xs text-base-content/50">
              {t("nearby.using_saved_location")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-warning text-sm">{error}</div>
      )}

      {/* Map */}
      {location && (
        <div className="nearby-map-shell h-[24rem] overflow-hidden rounded-2xl border border-base-300">
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]} icon={userIcon}>
              <Popup>{t("nearby.your_location")}</Popup>
            </Marker>
            <Circle center={[location.lat, location.lng]} radius={1000} pathOptions={{ color: theme === "dark" ? "#ff8a4c" : "#fd7424", fillColor: theme === "dark" ? "#ff8a4c" : "#fd7424", fillOpacity: 0.1, weight: 2, dashArray: "8 8" }} />
            <FitShopMarkers shops={mapShops} />
            {mapShops.map(
              (shop) =>
                shop.location && (
                  <Marker
                    key={shop._id}
                    icon={shopIcon(shop.isOpen)}
                    position={[
                      shop.location.coordinates[1],
                      shop.location.coordinates[0],
                    ]}
                  >
                    <Tooltip permanent direction="top" offset={[0, -34]}>{shop.name}</Tooltip>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{shop.name}</p>
                        <p className="text-gray-500">{shop.address}</p>
                        <span
                          className={`text-xs font-medium ${
                            shop.isOpen ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {shop.isOpen ? t("nearby.open") : t("nearby.closed")}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>
      )}

      {/* Shop list */}
      {loading ? (
        <div className="space-y-4" aria-label="Loading nearby shops">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <LoadingSkeleton className="h-6 w-48" />
                <LoadingSkeleton className="h-6 w-20 rounded-full" />
              </div>
              <LoadingSkeleton className="h-4 w-3/4 max-w-md" />
              <LoadingSkeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 text-base-content/40">
          <Store size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t("nearby.no_shops")}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <div
              key={shop._id}
              className="bg-base-100 border border-base-300 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Store size={20} className="text-primary" />
                </div>
                <span
                  className={`badge badge-sm ${
                    shop.isOpen ? "badge-success" : "badge-ghost"
                  }`}
                >
                  {shop.isOpen ? t("nearby.open") : t("nearby.closed")} · {formatDistance(distanceInMeters(shop))}
                </span>
              </div>
              <h3 className="font-semibold text-lg">{shop.name}</h3>
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary">
                <LocateFixed size={14} /> {formatDistance(distanceInMeters(shop))} {t("nearby.distance_away")}
              </p>
              {shop.address && (
                <p className="text-sm text-base-content/50 flex items-center gap-1 mt-1">
                  <MapPin size={12} />
                  {shop.address}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/customer/order?shopId=${shop._id}&shopName=${encodeURIComponent(shop.name)}`}
                  className={`btn btn-primary btn-sm flex-1 ${!shop.isOpen ? "btn-disabled" : ""}`}
                >
                  {t("nearby.order")}
                </Link>
                <Link
                  to={`/customer/baki?shopId=${shop._id}`}
                  className="btn btn-ghost btn-sm"
                >
                  {t("nearby.baki")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
