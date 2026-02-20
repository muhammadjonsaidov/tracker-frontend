import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Eye, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/shared/services/api';
import { SessionPage } from '@/shared/types';
import InlineError from '@/shared/components/InlineError';

const SessionsPage: React.FC = () => {
  const [sessionPage, setSessionPage] = useState<SessionPage | null>(null);
  const [usersById, setUsersById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUsers({ size: 1000 })
      .then((res) => {
        const map: Record<string, string> = {};
        (res.data.items || []).forEach((user) => {
          map[user.id] = user.username || user.email || user.id;
        });
        setUsersById(map);
      })
      .catch(() => setUsersById({}));
  }, []);

  const fetchSessions = async (pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSessions({ page: pageNum, size: 10 });
      setSessionPage(res.data);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(0);
  }, []);

  const sessions = useMemo(() => sessionPage?.items ?? [], [sessionPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'STOPPED': return 'bg-gray-100 text-gray-700';
      case 'ABORTED': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tracking Sessions</h2>
          <p className="text-sm text-gray-500">View and analyze user tracking sessions.</p>
        </div>
        <button
          onClick={() => fetchSessions(page)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <InlineError message={error} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[140px]">Session ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Start Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">End Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Last Sync</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCcw className="w-8 h-8 animate-spin" />
                      <p>Loading sessions...</p>
                    </div>
                  </td>
                </tr>
              ) : sessions.map((session) => {
                const hasPoints = !!session.lastPointAt;
                const lastPointLabel = hasPoints ? new Date(session.lastPointAt).toLocaleTimeString() : '—';
                const disableDetails = session.status === 'ACTIVE' && !hasPoints;
                const userLabel = session.username
                  || (session.userId ? usersById[session.userId] : undefined)
                  || '—';
                return (
                  <tr key={session.sessionId} className="hover:bg-gray-50 transition-colors h-[73px]">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {session.sessionId.slice(0, 13)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate" title={userLabel}>
                        {userLabel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(session.startTime).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {session.stopTime ? new Date(session.stopTime).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${getStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 italic whitespace-nowrap">
                      {lastPointLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {disableDetails ? (
                        <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                          <Eye className="w-4 h-4" />
                          Waiting
                        </span>
                      ) : (
                        <Link
                          to={`/sessions/${session.sessionId}`}
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sessionPage && sessionPage.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page === 0 || loading}
              onClick={() => fetchSessions(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {sessionPage.totalPages}
            </span>
            <button
              disabled={page >= sessionPage.totalPages - 1 || loading}
              onClick={() => fetchSessions(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default SessionsPage;
