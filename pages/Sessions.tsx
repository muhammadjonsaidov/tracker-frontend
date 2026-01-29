
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SessionRow, SessionPage } from '../types';
import { Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import InlineError from '../components/InlineError';

const SessionsPage: React.FC = () => {
  const [sessionPage, setSessionPage] = useState<SessionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ page: 0, size: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getSessions(params)
      .then(res => {
        setSessionPage(res.data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load sessions.');
        setLoading(false);
      });
  }, [params]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'STOPPED': return 'bg-gray-100 text-gray-700';
      case 'ABORTED': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading && !sessionPage) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      {error && <InlineError message={error} />}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Session ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Sync</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessionPage?.items.map((session) => {
              const hasPoints = !!session.lastPointAt;
              const lastPointLabel = hasPoints ? new Date(session.lastPointAt).toLocaleTimeString() : '—';
              const disableDetails = session.status === 'ACTIVE' && !hasPoints;
              return (
              <tr key={session.sessionId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-600">
                  {session.sessionId.slice(0, 13)}...
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(session.startTime).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {session.stopTime ? new Date(session.stopTime).toLocaleString() : '—'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 italic">
                  {lastPointLabel}
                </td>
                <td className="px-6 py-4 text-right">
                  {disableDetails ? (
                    <span className="inline-flex items-center gap-2 text-gray-400 text-sm font-semibold">
                      <Eye className="w-4 h-4" />
                      Waiting for points
                    </span>
                  ) : (
                    <Link 
                      to={`/sessions/${session.sessionId}`}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold">{sessionPage?.items.length || 0}</span> of <span className="font-bold">{sessionPage?.totalElements || 0}</span> sessions
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={params.page === 0}
            onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
            className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-700">Page {params.page + 1} of {sessionPage?.totalPages || 1}</span>
          <button 
            disabled={params.page >= (sessionPage?.totalPages || 1) - 1}
            onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
            className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionsPage;
