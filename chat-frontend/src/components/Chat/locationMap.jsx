import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Define default icon once outside the component to avoid recreation
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMap = ({ locationUrl, className, zoom = 13 }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Memoize the coordinate extraction function
  const extractCoordinates = useCallback((url) => {
    if (!url) return null;
    
    try {
      // Handle different Google Maps URL formats:
      // 1. ?q=latitude,longitude
      // 2. /@latitude,longitude,zoom
      // 3. !1dlatitude!2dlongitude
      const qParamMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qParamMatch) {
        return [parseFloat(qParamMatch[1]), parseFloat(qParamMatch[2])];
      }

      const atParamMatch = url.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atParamMatch) {
        return [parseFloat(atParamMatch[1]), parseFloat(atParamMatch[2])];
      }

      const exclamationMatch = url.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
      if (exclamationMatch) {
        return [parseFloat(exclamationMatch[1]), parseFloat(exclamationMatch[2])];
      }

      console.warn("Could not extract coordinates from URL:", url);
      return null;
    } catch (error) {
      console.error("Error extracting coordinates:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        doubleClickZoom: true,
        closePopupOnClick: false,
        trackResize: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        detectRetina: true
      }).addTo(mapRef.current);
    }

    return () => {
      // Cleanup marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !locationUrl) return;

    const coordinates = extractCoordinates(locationUrl);
    if (!coordinates) return;

    const [lat, lng] = coordinates;

    // Update map view
    mapRef.current.setView([lat, lng], zoom);

    // Remove previous marker if exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = L.marker([lat, lng])
      .addTo(mapRef.current)
      .bindPopup('Shared Location')
      .openPopup();

  }, [locationUrl, zoom, extractCoordinates]);

  return (
    <div 
      className={`${className || 'w-full h-64'} rounded-lg overflow-hidden shadow-md`} 
      ref={mapContainerRef}
      aria-label="Interactive map showing the location"
    />
  );
};

export default LocationMap;