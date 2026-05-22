import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 1.2 });
  }, [target]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.county ||
      data.address?.state ||
      ""
    );
  } catch {
    return "";
  }
}

export default function LocationPicker({ coordinates, locationName, onLocationChange }) {
  const [marker, setMarker] = useState(
    coordinates?.lat ? [coordinates.lat, coordinates.lng] : null
  );
  const [flyTarget, setFlyTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null); // 'denied' | 'unavailable' | null
  const markerRef = useRef(null);

  const defaultCenter = [36.8, 10.18]; // Tunis fallback

  const commit = async (lat, lng) => {
    setMarker([lat, lng]);
    const city = await reverseGeocode(lat, lng);
    onLocationChange({ lat, lng, locationName: city });
  };

  const pinAndFly = (lat, lng, zoom = 15) => {
    setFlyTarget({ center: [lat, lng], zoom });
    commit(lat, lng);
  };

  const zoomViaIP = async () => {
    const services = [
      () => fetch("https://freeipapi.com/api/json").then(r => r.json()).then(d => d.latitude && { lat: d.latitude, lng: d.longitude }),
      () => fetch("https://ipwho.is/").then(r => r.json()).then(d => d.success && { lat: d.latitude, lng: d.longitude }),
    ];
    for (const fn of services) {
      try {
        const pos = await fn();
        if (pos) {
          // Only center the map — no pin, no reverse geocode
          setFlyTarget({ center: [pos.lat, pos.lng], zoom: 13 });
          return;
        }
      } catch { /* try next */ }
    }
  };

  const requestGPS = () => {
    if (!navigator.geolocation) { setGpsError('unavailable'); return; }
    setLocating(true);
    setGpsError(null);

    const onSuccess = (pos) => {
      pinAndFly(pos.coords.latitude, pos.coords.longitude, 16);
      setLocating(false);
    };

    const onError = (err) => {
      if (err.code === 1) {
        // Explicitly denied — zoom via IP so user can click nearby
        setGpsError('denied');
        setLocating(false);
        zoomViaIP();
      } else {
        // Timeout or signal unavailable — retry without high accuracy
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          () => {
            setGpsError('unavailable');
            setLocating(false);
            zoomViaIP();
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  };

  // On first mount: use saved coords or request GPS
  useEffect(() => {
    if (coordinates?.lat) {
      setFlyTarget({ center: [coordinates.lat, coordinates.lng], zoom: 15 });
    } else {
      requestGPS();
    }
  }, []);

  const eventHandlers = {
    dragend() {
      const latlng = markerRef.current?.getLatLng();
      if (latlng) commit(latlng.lat, latlng.lng);
    },
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Your Location</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {locationName || <span className="text-gray-400 font-normal">Detecting…</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={requestGPS}
          disabled={locating}
          className="flex items-center gap-2 text-xs font-black px-4 py-2 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl hover:bg-[#7C3AED]/20 transition-all disabled:opacity-50 uppercase tracking-wide whitespace-nowrap"
        >
          {locating
            ? <span className="animate-spin inline-block w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full" />
            : "📍"}
          {locating ? "Locating…" : "My location"}
        </button>
      </div>

      {gpsError === 'denied' && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
          GPS access was denied. Enable it in your browser settings, or click the map to place your pin manually.
        </p>
      )}
      {gpsError === 'unavailable' && (
        <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl">
          Could not detect your location automatically. Click anywhere on the map to place your pin.
        </p>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: 360 }}>
        <MapContainer
          center={marker ?? defaultCenter}
          zoom={marker ? 15 : 6}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo target={flyTarget} />
          <ClickHandler onClick={(lat, lng) => pinAndFly(lat, lng, 16)} />
          {marker && (
            <Marker
              position={marker}
              draggable
              ref={markerRef}
              eventHandlers={eventHandlers}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Drag the pin or click the map to adjust — then save your profile
      </p>
    </div>
  );
}
