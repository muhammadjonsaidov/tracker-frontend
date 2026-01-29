
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { LastLocationRow } from '../types';
import InlineError from '../components/InlineError';

declare const L: any;

const LiveMap: React.FC = () => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [locations, setLocations] = useState<LastLocationRow[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [error, setError] = useState('');
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;

    const initMap = () => {
      const container = document.getElementById('live-map');
      if (container && !mapRef.current && typeof L !== 'undefined') {
        mapRef.current = L.map('live-map').setView([41.3111, 69.2797], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(mapRef.current);
      }
    };

    const updateMarker = (loc: LastLocationRow) => {
      if (!mapRef.current || !isMounted) return;

      const { userId, lat, lon, active, speedMps } = loc;
      const fillColor = active ? '#22c55e' : '#94a3b8';
      const popupHtml = `
          <div class="p-1">
            <p class="font-bold">User: ${userId.slice(0, 8)}</p>
            <p class="text-xs text-gray-600">Speed: ${(speedMps * 3.6).toFixed(1)} km/h</p>
            <p class="text-xs text-gray-600">Status: ${active ? 'Active' : 'Idle'}</p>
          </div>
        `;
      
      if (markersRef.current[userId]) {
        const marker = markersRef.current[userId];
        marker.setLatLng([lat, lon]);
        marker.setStyle({
          fillColor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
        if (marker.getPopup()) {
          marker.setPopupContent(popupHtml);
        } else {
          marker.bindPopup(popupHtml);
        }
      } else {
        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapRef.current);
        
        marker.bindPopup(popupHtml);
        markersRef.current[userId] = marker;
      }
    };

    const startStream = async () => {
      try {
        const tokenRes = await api.getStreamToken();
        if (!isMounted) return;

        const sseUrl = api.getSseUrl(tokenRes.data.token);
        eventSource = new EventSource(sseUrl);
        
        eventSource.onopen = () => {
          if (isMounted) setStatus('connected');
        };
        
        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const update: LastLocationRow = JSON.parse(event.data);
            updateMarker(update);
            setLocations(prev => {
              const filtered = prev.filter(l => l.userId !== update.userId);
              return [update, ...filtered];
            });
          } catch (e) {
            console.warn('Malformed SSE data', e);
          }
        };

        eventSource.onerror = (e) => {
          if (isMounted) {
            console.error('SSE Error Event', e);
            setStatus('error');
            setError('Realtime stream error. Please retry.');
          }
          eventSource?.close();
        };
      } catch (err) {
        console.error('Failed to start stream', err);
        if (isMounted) setStatus('error');
        if (isMounted) setError((err as any)?.message || 'Failed to start realtime stream.');
      }
    };

    initMap();
    const refreshLocations = () => {
      api.getLastLocations()
        .then(res => {
          if (isMounted && res.data) {
            res.data.forEach(updateMarker);
            setLocations(res.data);
          }
        })
        .catch(err => {
          console.error('Location fetch failed', err);
          if (isMounted) setError((err as any)?.message || 'Failed to load locations.');
        });
    };

    refreshLocations();

    startStream();
    pollingRef.current = window.setInterval(refreshLocations, 5000);

    return () => {
      isMounted = false;
      eventSource?.close();
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-4">
      {error && <InlineError message={error} />}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-600 capitalize">Real-time Stream: {status}</span>
        </div>
        <div className="text-sm text-gray-500">Showing {locations.length} tracked objects</div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div id="live-map" className="w-full h-full"></div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Live Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {locations.map((loc) => (
              <div 
                key={loc.userId} 
                className="p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => mapRef.current?.setView([loc.lat, loc.lon], 16)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono font-bold text-gray-500">ID: {loc.userId.slice(0, 6)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${loc.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {loc.active ? 'LIVE' : 'IDLE'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">Lat: {loc.lat.toFixed(5)}</p>
                <p className="text-sm font-medium text-gray-800">Lon: {loc.lon.toFixed(5)}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                  <span>{(loc.speedMps * 3.6).toFixed(1)} km/h</span>
                  <span>{new Date(loc.ts).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {locations.length === 0 && <p className="text-center text-gray-400 py-8 text-sm italic">Waiting for data...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
