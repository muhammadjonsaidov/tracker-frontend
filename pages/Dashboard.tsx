
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserRow, LastLocationRow } from '../types';
import { Users, Activity, Navigation, Clock, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InlineError from '../components/InlineError';

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [locations, setLocations] = useState<LastLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [usersRes, locRes] = await Promise.all([
          api.getUsers(),
          api.getLastLocations()
        ]);
        if (isMounted) {
          setUsers(usersRes.data || []);
          setLocations(locRes.data || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        if (isMounted) setError((err as any)?.message || 'Failed to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const stats = [
    { name: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Sessions', value: locations.filter(l => l.active).length, icon: Activity, color: 'bg-green-500' },
    { name: 'Total Distance Today', value: '142.5 km', icon: Navigation, color: 'bg-indigo-500' },
    { name: 'Avg. Duration', value: '42m', icon: Clock, color: 'bg-orange-500' },
  ];

  const chartData = [
    { name: 'Mon', sessions: 12 },
    { name: 'Tue', sessions: 19 },
    { name: 'Wed', sessions: 15 },
    { name: 'Thu', sessions: 22 },
    { name: 'Fri', sessions: 30 },
    { name: 'Sat', sessions: 25 },
    { name: 'Sun', sessions: 18 },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      {error && <InlineError message={error} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Weekly Activity</h3>
            <button className="text-sm text-indigo-600 font-medium flex items-center gap-1">
              Details <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Latest Active Locations</h3>
          <div className="space-y-4">
            {locations.slice(0, 5).map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${loc.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="font-semibold text-gray-800">User ID: {loc.userId.slice(0, 8)}...</p>
                    <p className="text-xs text-gray-500">{new Date(loc.ts).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}</p>
                  <p className="text-xs text-indigo-600">{(loc.speedMps * 3.6).toFixed(1)} km/h</p>
                </div>
              </div>
            ))}
            {locations.length === 0 && <p className="text-center text-gray-500 py-8">No active locations tracked.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
