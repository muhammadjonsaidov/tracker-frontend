import React, { useEffect, useMemo, useState } from 'react';
import { Search, Shield, Trash2, RefreshCcw } from 'lucide-react';
import { api } from '@/shared/services/api';
import { UserRow } from '@/shared/types';
import InlineError from '@/shared/components/InlineError';
import ConfirmModal from '@/shared/components/ConfirmModal';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => { },
  });

  const fetchUsers = async (pageNum: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getUsers({ page: pageNum, size: 10 });
      const data = res.data;
      setUsers(data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0);
  }, []);

  const handleDelete = (userId: string, username: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${username}"? This action cannot be undone and will remove all associated data.`,
      type: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(userId);
        try {
          await api.deleteUser(userId);
          fetchUsers(page); // Refresh current page
        } catch (err: any) {
          setError(err.message || 'Failed to delete user');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleToggleRole = (user: UserRow) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setModalConfig({
      isOpen: true,
      title: 'Update User Role',
      message: `Change role for ${user.username} to ${newRole}?`,
      type: 'info',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(user.id);
        try {
          await api.updateUserRole(user.id, newRole);
          fetchUsers(page); // Refresh current page
        } catch (err: any) {
          setError(err.message || 'Failed to update role');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Client-side search for the current page content (server-side search could be added later if needed)
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  const UserActions = ({ user }: { user: UserRow }) => (
    <div className="flex items-center gap-1">
      <button
        disabled={!!actionLoading}
        onClick={() => handleToggleRole(user)}
        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Toggle Role"
      >
        <Shield className="w-4 h-4" />
      </button>
      <button
        disabled={!!actionLoading}
        onClick={() => handleDelete(user.id, user.username)}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete User"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500">Manage system users and their permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(page)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Filter current page..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <InlineError message={error} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[250px]">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[150px]">Joined At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCcw className="w-8 h-8 animate-spin" />
                      <p>Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors h-[73px]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={`https://picsum.photos/seed/${user.id}/40/40`} className="w-10 h-10 rounded-full border border-gray-100" />
                      <div className="truncate">
                        <p className="font-bold text-gray-900 truncate">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserActions user={user} />
                  </td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found.
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
              onClick={() => fetchUsers(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1 || loading}
              onClick={() => fetchUsers(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        loading={!!actionLoading}
      />
    </div>
  );
};

export default UsersPage;
