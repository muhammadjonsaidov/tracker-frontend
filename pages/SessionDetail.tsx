
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SessionSummaryResponse, PointRow } from '../types';
import { ArrowLeft, Navigation, Watch, FastForward, Maximize, MapPin, Info } from 'lucide-react';
import InlineError from '../components/InlineError';

declare const L: any;

const SessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SessionSummaryResponse | null>(null);
  const [points, setPoints] = useState<PointRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryNotice, setSummaryNotice] = useState('');
  const [pointsNotice, setPointsNotice] = useState('');
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any>(null);
  const pollingRef = useRef<number | null>(null);
  const fetchingRef = useRef(false);
  const summaryRef = useRef<SessionSummaryResponse | null>(null);
  const pointsRef = useRef<PointRow[]>([]);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!sessionId || fetchingRef.current) return;
    fetchingRef.current = true;
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }

    const summaryNeeded = !summaryRef.current;
    const summaryPromise = summaryNeeded ? api.getSessionSummary(sessionId) : null;
    const pointsPromise = api.getSessionPoints(sessionId, { max: 1000 });

    const [summaryResult, pointsResult] = await Promise.allSettled([
      summaryPromise ?? Promise.resolve(null),
      pointsPromise
    ]);

    let nextSummary = summaryRef.current;
    if (summaryNeeded && summaryResult.status === 'fulfilled' && summaryResult.value) {
      nextSummary = (summaryResult.value as any).data ?? null;
    }
    const nextPoints =
      pointsResult.status === 'fulfilled' ? (pointsResult.value as any).data || [] : pointsRef.current;

    setSummary(nextSummary ?? null);
    setPoints(nextPoints ?? []);

    const summaryMissing = !nextSummary;
    const pointsMissing = (nextPoints?.length ?? 0) === 0;

    if (summaryNeeded && summaryResult.status === 'rejected' && summaryMissing) {
      setSummaryNotice('Session summary is not available yet. This can happen while the session is ACTIVE.');
    } else {
      setSummaryNotice('');
    }

    if (pointsMissing) {
      setPointsNotice('No tracking points yet. This can happen right after a session starts.');
    } else {
      setPointsNotice('');
    }

    const hasFailure =
      (summaryNeeded && summaryResult.status === 'rejected') || pointsResult.status === 'rejected';
    if (hasFailure && summaryMissing && pointsMissing) {
      const err = summaryResult.status === 'rejected' ? summaryResult.reason : pointsResult.reason;
      setError((err as any)?.message || 'Failed to load session data.');
    } else if (!silent) {
      setError('');
    }

    if (!silent) {
      setLoading(false);
    }
    fetchingRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    fetchData();

    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
    }
    pollingRef.current = window.setInterval(() => {
      const summaryReady = !!summaryRef.current;
      const pointsReady = (pointsRef.current?.length ?? 0) > 0;
      if (summaryReady && pointsReady) {
        if (pollingRef.current) {
          window.clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }
      fetchData({ silent: true });
    }, 5000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      overlaysRef.current = null;
    };
  }, [sessionId, fetchData]);

  useEffect(() => {
    if (!points.length) return;

    if (!mapRef.current) {
      mapRef.current = L.map('session-map').setView([points[0].lat, points[0].lon], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);
    }

    if (!overlaysRef.current) {
      overlaysRef.current = L.layerGroup().addTo(mapRef.current);
    } else {
      overlaysRef.current.clearLayers();
    }

    const pathCoords = points.map(p => [p.lat, p.lon]);
    
    // Start Marker
    L.circleMarker(pathCoords[0], { radius: 6, color: '#22c55e', fillOpacity: 1 })
      .addTo(overlaysRef.current)
      .bindPopup('Start Point');
    
    // End Marker
    L.circleMarker(pathCoords[pathCoords.length - 1], { radius: 6, color: '#ef4444', fillOpacity: 1 })
      .addTo(overlaysRef.current)
      .bindPopup('End Point');

    // Draw Line
    const polyline = L.polyline(pathCoords, { color: '#4f46e5', weight: 4, opacity: 0.8 })
      .addTo(overlaysRef.current);
    
    // Zoom to fit
    mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });

  }, [points]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <InlineError message={error} />;
  if (!summary && !points.length) return <div>Session not found.</div>;

  const formatDuration = (sec?: number) => {
    if (typeof sec !== 'number') return '—';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {summaryNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <Info className="h-5 w-5 shrink-0" />
          <span>{summaryNotice}</span>
        </div>
      )}
      {pointsNotice && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <Info className="h-5 w-5 shrink-0" />
          <span>{pointsNotice}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sessions
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-mono">SESSION ID</p>
          <p className="font-mono text-sm text-gray-800">{sessionId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Trip Summary</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-bold text-gray-900">{typeof summary?.distanceM === 'number' ? `${(summary.distanceM / 1000).toFixed(2)} km` : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-bold text-gray-900">{formatDuration(summary?.durationS)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                  <FastForward className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Speed</p>
                  <p className="font-bold text-gray-900">{typeof summary?.avgSpeedMps === 'number' ? `${(summary.avgSpeedMps * 3.6).toFixed(1)} km/h` : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-xl text-red-600">
                  <Maximize className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max Speed</p>
                  <p className="font-bold text-gray-900">{typeof summary?.maxSpeedMps === 'number' ? `${(summary.maxSpeedMps * 3.6).toFixed(1)} km/h` : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Points Captured</p>
                  <p className="font-bold text-gray-900">{summary?.pointsCount ?? points.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[500px]">
          {points.length > 0 ? (
            <div id="session-map" className="w-full h-full"></div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No tracking points yet.
            </div>
          )}
        </div>
      </div>

      {/* Raw Points Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Raw Tracking Points</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Lat</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Lon</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Speed</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {points.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-600">{new Date(p.ts).toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm font-mono">{p.lat.toFixed(6)}</td>
                  <td className="px-6 py-3 text-sm font-mono">{p.lon.toFixed(6)}</td>
                  <td className="px-6 py-3 text-sm text-indigo-600 font-medium">
                    {p.speedMps ? (p.speedMps * 3.6).toFixed(1) : 0} km/h
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400">
                    {p.accuracyM ? `${p.accuracyM.toFixed(1)}m` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
