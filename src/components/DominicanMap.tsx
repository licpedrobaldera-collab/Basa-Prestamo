import React, { useEffect, useRef } from 'react';
import { RouteStop } from '../types';
import { formatDOP } from '../utils/loanCalculator';
import { MapPin, Navigation, Phone } from 'lucide-react';

interface DominicanMapProps {
  stops: RouteStop[];
  onSelectStop?: (stop: RouteStop) => void;
  currentLocation?: { lat: number; lng: number } | null;
}

declare global {
  interface Window {
    L: any;
  }
}

export const DominicanMap: React.FC<DominicanMapProps> = ({
  stops,
  onSelectStop,
  currentLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered at Santo Domingo, Dominican Republic
      const map = window.L.map(mapContainerRef.current).setView([18.4861, -69.9312], 13);

      window.L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add current user location marker if present
    if (currentLocation) {
      const userIcon = window.L.divIcon({
        className: 'user-gps-marker',
        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
        iconSize: [16, 16],
      });
      const userMarker = window.L.marker([currentLocation.lat, currentLocation.lng], {
        icon: userIcon,
      })
        .addTo(map)
        .bindPopup('<b>Tu ubicación actual (Cobrador)</b>');
      markersRef.current.push(userMarker);
    }

    // Add stops markers
    const latLngs: [number, number][] = [];

    stops.forEach((stop, index) => {
      const lat = stop.gpsLat || 18.4861 + (index * 0.008);
      const lng = stop.gpsLng || -69.9312 + (index * 0.009);
      latLngs.push([lat, lng]);

      let color = '#eab308'; // yellow / pending
      if (stop.status === 'PAGADO') color = '#10b981'; // green
      if (stop.status === 'AUSENTE' || stop.status === 'INUBICABLE') color = '#ef4444'; // red
      if (stop.status === 'PROMESA') color = '#f97316'; // orange

      const customIcon = window.L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="background: ${color}; color: black; font-weight: 800; font-size: 11px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">
            ${index + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; min-width: 170px;">
          <div style="font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${index + 1}. ${stop.clientName}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${stop.address}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 600;">
            <span>Cuota:</span> <span style="color: #059669;">${formatDOP(stop.quota)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px;">
            <span>Estado:</span> <span style="font-weight: bold; color: ${color};">${stop.status}</span>
          </div>
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <a href="tel:${stop.phone}" style="display: inline-block; padding: 4px 8px; background: #0284c7; color: white; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">
              Llamar
            </a>
            <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" style="display: inline-block; padding: 4px 8px; background: #334155; color: white; border-radius: 6px; text-decoration: none; font-size: 10px;">
              GPS Navegar
            </a>
          </div>
        </div>
      `;

      const marker = window.L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have points
    if (latLngs.length > 0) {
      const bounds = window.L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [stops, currentLocation, onSelectStop]);

  return (
    <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] flex items-center gap-2 shadow-lg">
        <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-slate-300 font-medium">
          {stops.length} Puntos de Cobranza en Ruta RD
        </span>
      </div>
    </div>
  );
};
