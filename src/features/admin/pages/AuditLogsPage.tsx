import React, { useEffect, useState } from 'react';
import { Shield, Search, RefreshCcw, Calendar, User, Activity } from 'lucide-react';
import { api } from '@/shared/services/api';
import { AuditLogRow } from '@/shared/types';
import InlineError from '@/shared/components/InlineError';

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchLogs = async (pageNum: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.getAuditLogs({ page: pageNum, size: 10 });
            // Spring Data Page structure usually has 'content'
            const data = res.data as any;
            setLogs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setPage(pageNum);
        } catch (err: any) {
            setError(err?.message || 'Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(0);
    }, []);

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600 bg-red-50';
        if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-amber-600 bg-amber-50';
        if (action.includes('LOGIN')) return 'text-green-600 bg-green-50';
        if (action.includes('START')) return 'text-indigo-600 bg-indigo-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
                    <p className="text-sm text-gray-500">Track all administrative and system activities.</p>
                </div>
                <button
                    onClick={() => fetchLogs(page)}
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
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[220px]">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[180px]">Admin</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[200px]">Target</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCcw className="w-8 h-8 animate-spin" />
                                            <p>Loading audit trail...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors h-[73px]">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900 truncate max-w-[140px]" title={log.adminUsername || 'System'}>
                                                {log.adminUsername || 'System'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getActionColor(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="truncate max-w-[180px]" title={`${log.targetType || ''}: ${log.targetId || '-'}`}>
                                            {log.targetType && (
                                                <span className="font-medium text-gray-700">{log.targetType}: </span>
                                            )}
                                            <span className="text-xs font-mono">{log.targetId || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        <div className="flex items-center gap-2 truncate max-w-[120px]" title={log.metadata || '{}'}>
                                            <Activity className="w-3 h-3 shrink-0" />
                                            <span className="text-xs font-mono truncate">{log.metadata || '{}'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <button
                            disabled={page === 0 || loading}
                            onClick={() => fetchLogs(page - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages - 1 || loading}
                            onClick={() => fetchLogs(page + 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogsPage;
