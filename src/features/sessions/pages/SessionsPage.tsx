import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/shared/services/api';
import { SessionPage } from '@/shared/types';
import InlineError from '@/shared/components/InlineError';

const SessionsPage: React.FC = () => {
  const [sessionPage, setSessionPage] = useState<SessionPage | null>(null);
  const [usersById, setUsersById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({ page: 0, size: 10 });
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getUsers()
      .then((res) => {
        if (!isMounted) return;
        const map: Record<string, string> = {};
        (res.data || []).forEach((user) => {
          if (user?.id) {
            map[user.id] = user.username || user.email || user.id;
          }
        });
        setUsersById(map);
      })
      .catch(() => {
        if (isMounted) setUsersById({});
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    api.getSessions(params)
      .then((res) => {
        if (!isMounted) return;
        setSessionPage(res.data);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load sessions.');
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [params]);

  const sessions = useMemo(() => sessionPage?.items ?? [], [sessionPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'STOPPED': return 'bg-gray-100 text-gray-700';
      case 'ABORTED': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading && !sessionPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <InlineError message={error} />}
      <div className="space-y-3 md:hidden">
        {sessions.map((session) => {
          const hasPoints = !!session.lastPointAt;
          const lastPointLabel = hasPoints ? new Date(session.lastPointAt).toLocaleTimeString() : '—';
          const disableDetails = session.status === 'ACTIVE' && !hasPoints;
          const userLabel = session.username
            || (session.userId ? usersById[session.userId] : undefined)
            || '—';
          return (
            <div key={session.sessionId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-gray-500">{session.sessionId.slice(0, 13)}...</p>
                  <p className="text-sm font-semibold text-gray-900">{userLabel}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Start: {new Date(session.startTime).toLocaleString()}</span>
                </div>
                <div>
                  End: {session.stopTime ? new Date(session.stopTime).toLocaleString() : '—'}
                </div>
                <div>
                  Last Sync: <span className="italic">{lastPointLabel}</span>
                </div>
              </div>
              <div className="mt-4">
                {disableDetails ? (
                  <span className="inline-flex items-center gap-2 text-gray-400 text-sm font-semibold">
                    <Eye className="w-4 h-4" />
                    Waiting for points
                  </span>
                ) : (
                  <Link
                    to={`/sessions/${session.sessionId}`}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
            No sessions found.
          </div>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Session ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Start Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">End Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Sync</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => {
                const hasPoints = !!session.lastPointAt;
                const lastPointLabel = hasPoints ? new Date(session.lastPointAt).toLocaleTimeString() : '—';
                const disableDetails = session.status === 'ACTIVE' && !hasPoints;
                const userLabel = session.username
                  || (session.userId ? usersById[session.userId] : undefined)
                  || '—';
                return (
                  <tr key={session.sessionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {session.sessionId.slice(0, 13)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {userLabel}
                      </div>
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
                );
              })}
            </tbody>
          </table>
        </div>
        {sessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500 font-medium">No sessions found.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold">{sessions.length}</span> of <span className="font-bold">{sessionPage?.totalElements || 0}</span> sessions
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={params.page === 0}
            onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
            className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-gray-700">Page {params.page + 1} of {sessionPage?.totalPages || 1}</span>
          <button
            disabled={params.page >= (sessionPage?.totalPages || 1) - 1}
            onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
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
