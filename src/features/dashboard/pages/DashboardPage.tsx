import React, { useEffect, useMemo, useState } from 'react';
import { Users, Activity, Navigation, Clock, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/shared/services/api';
import { LastLocationRow, SessionRow, UserRow } from '@/shared/types';
import InlineError from '@/shared/components/InlineError';

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildWeeklyChartData = (sessions: SessionRow[], endDate: Date) => {
  const endDay = startOfDay(endDate);
  const startDay = addDays(endDay, -6);
  const days = Array.from({ length: 7 }, (_, idx) => addDays(startDay, idx));
  const counts = new Map<string, number>();

  sessions.forEach((session) => {
    if (!session?.startTime) return;
    const sessionDay = startOfDay(new Date(session.startTime));
    const key = toLocalDateKey(sessionDay);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return days.map((day) => ({
    name: day.toLocaleDateString(undefined, { weekday: 'short' }),
    sessions: counts.get(toLocalDateKey(day)) ?? 0,
  }));
};

const formatDuration = (seconds: number | null) => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '-';
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getDurationFromSession = (session: SessionRow) => {
  if (!session.stopTime) return null;
  const startMs = new Date(session.startTime).getTime();
  const stopMs = new Date(session.stopTime).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(stopMs) || stopMs <= startMs) return null;
  return (stopMs - startMs) / 1000;
};

const fetchSessionsInRange = async (from: Date, to: Date) => {
  const size = 200;
  let page = 0;
  let totalPages = 1;
  const items: SessionRow[] = [];

  while (page < totalPages) {
    const res = await api.getSessions({
      from: from.toISOString(),
      to: to.toISOString(),
      page,
      size,
    });
    const data = res.data;
    items.push(...(data?.items ?? []));
    totalPages = Math.max(data?.totalPages ?? 1, 1);
    page += 1;
  }

  return items;
};

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [locations, setLocations] = useState<LastLocationRow[]>([]);
  const [chartData, setChartData] = useState<{ name: string; sessions: number }[]>([]);
  const [distanceTodayKm, setDistanceTodayKm] = useState<number | null>(null);
  const [avgDurationS, setAvgDurationS] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const now = new Date();
      const startToday = startOfDay(now);
      const startWeek = addDays(startToday, -6);
      try {
        const [usersRes, locRes, sessionsRes] = await Promise.allSettled([
          api.getUsers(),
          api.getLastLocations(),
          fetchSessionsInRange(startWeek, now),
        ]);

        let nextUsers: UserRow[] = [];
        let nextLocations: LastLocationRow[] = [];
        let weeklySessions: SessionRow[] = [];
        let nextError = '';

        if (usersRes.status === 'fulfilled') {
          const data = usersRes.value.data;
          nextUsers = (data as any)?.items || (Array.isArray(data) ? data : []);
        } else {
          nextError = (usersRes.reason as any)?.message || 'Failed to load users.';
        }

        if (locRes.status === 'fulfilled') {
          nextLocations = locRes.value.data || [];
        } else if (!nextError) {
          nextError = (locRes.reason as any)?.message || 'Failed to load locations.';
        }

        if (sessionsRes.status === 'fulfilled') {
          weeklySessions = sessionsRes.value || [];
        } else if (!nextError) {
          nextError = (sessionsRes.reason as any)?.message || 'Failed to load sessions.';
        }

        const nextChartData = weeklySessions.length ? buildWeeklyChartData(weeklySessions, now) : [];
        if (isMounted) {
          setUsers(nextUsers);
          setLocations(nextLocations);
          setChartData(nextChartData);
          setError(nextError);
        }

        if (weeklySessions.length) {
          const todaySessions = weeklySessions.filter((session) => {
            const startTime = new Date(session.startTime);
            return Number.isFinite(startTime.getTime()) && startTime >= startToday && startTime <= now;
          });

          if (todaySessions.length) {
            const summaryResults = await Promise.allSettled(
              todaySessions.map((session) => api.getSessionSummary(session.sessionId))
            );
            let totalDistanceM = 0;
            let distanceCount = 0;
            let totalDurationS = 0;
            let durationCount = 0;

            summaryResults.forEach((result, idx) => {
              const session = todaySessions[idx];
              let durationUsed = false;

              if (result.status === 'fulfilled') {
                const summary = (result.value as any).data;
                if (summary && typeof summary.distanceM === 'number') {
                  totalDistanceM += summary.distanceM;
                  distanceCount += 1;
                }
                if (summary && typeof summary.durationS === 'number') {
                  totalDurationS += summary.durationS;
                  durationCount += 1;
                  durationUsed = true;
                }
              }

              if (!durationUsed) {
                const fallbackDuration = getDurationFromSession(session);
                if (typeof fallbackDuration === 'number') {
                  totalDurationS += fallbackDuration;
                  durationCount += 1;
                }
              }
            });

            if (isMounted) {
              setDistanceTodayKm(distanceCount ? totalDistanceM / 1000 : null);
              setAvgDurationS(durationCount ? totalDurationS / durationCount : null);
            }
          } else if (isMounted) {
            setDistanceTodayKm(null);
            setAvgDurationS(null);
          }
        } else if (isMounted) {
          setDistanceTodayKm(null);
          setAvgDurationS(null);
        }
      } catch (err) {
        if (isMounted) setError((err as any)?.message || 'Failed to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const usersById = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((user) => {
      if (user?.id) {
        map[user.id] = user.username || user.email || user.id;
      }
    });
    return map;
  }, [users]);

  const totalUsers = users.length;
  const activeSessions = locations.filter((loc) => !!loc.active).length;

  const stats = [
    { name: 'Total Users', value: totalUsers, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Sessions', value: activeSessions, icon: Activity, color: 'bg-green-500' },
    { name: 'Total Distance Today', value: typeof distanceTodayKm === 'number' ? `${distanceTodayKm.toFixed(2)} km` : '-', icon: Navigation, color: 'bg-indigo-500' },
    { name: 'Avg. Duration', value: formatDuration(avgDurationS), icon: Clock, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No activity yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Latest Active Locations</h3>
          <div className="space-y-4">
            {locations.slice(0, 5).map((loc, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${loc.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      User: {loc.userId ? (usersById[loc.userId] || `${loc.userId.slice(0, 8)}...`) : 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">{loc.ts ? new Date(loc.ts).toLocaleString() : '-'}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {typeof loc.lat === 'number' && typeof loc.lon === 'number' ? `${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}` : '-'}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {typeof loc.speedMps === 'number' ? `${(loc.speedMps * 3.6).toFixed(1)} km/h` : '-'}
                  </p>
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
