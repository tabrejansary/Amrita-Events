'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { clubAPI } from '@/lib/api';
import {
    FaChartBar, FaEye, FaUserFriends, FaTrophy,
    FaSpinner, FaChartLine, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#AF0C3E', '#FFD92A', '#6B21A8', '#059669', '#DC2626', '#2563EB', '#EA580C'];

export default function ClubStatsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [range, setRange] = useState('all');
    const [status, setStatus] = useState('all');
    const [userRole, setUserRole] = useState<'club' | 'admin' | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUserRole(user.role);
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'club' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchStats();
    }, [range, status, startDate, endDate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await clubAPI.getClubStats({
                range,
                status,
                startDate: range === 'custom' ? startDate : undefined,
                endDate: range === 'custom' ? endDate : undefined
            });
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    const chartData = stats?.events?.slice(0, 10).map((e: any) => ({
        name: e.title.length > 15 ? e.title.substring(0, 12) + '...' : e.title,
        views: e.views,
        registrations: e.registrations
    })) || [];

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole || 'club'} />

            <div className="container mx-auto px-4 py-8">
                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                            <FaChartBar />
                            <span>Event Analytics</span>
                        </h1>
                        <p className="text-amrita-textGray">
                            Monitoring performance for {status === 'all' ? 'all' : status} events
                            {range !== 'all' ? ` created in last ${range} days` : ''}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Event Date Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-amrita-textGray uppercase px-1">Event Type</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="bg-white border-none rounded-lg px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amrita-maroon outline-none"
                            >
                                <option value="all">All Events</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-amrita-textGray uppercase px-1">Created Within</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                    value={range}
                                    onChange={(e) => setRange(e.target.value)}
                                    className="bg-white border-none rounded-lg px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-amrita-maroon outline-none"
                                >
                                    <option value="all">All Time</option>
                                    <option value="7">Last 1 Week</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="80">Last 80 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                {range === 'custom' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="px-2 py-2 border-none rounded-lg shadow-sm focus:ring-2 focus:ring-amrita-maroon outline-none text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="px-2 py-2 border-none rounded-lg shadow-sm focus:ring-2 focus:ring-amrita-maroon outline-none text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <FaSpinner className="animate-spin text-4xl text-amrita-maroon/20" />
                    </div>
                ) : stats && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPICard
                                title="Total Views"
                                value={stats.summary.totalViews}
                                icon={<FaEye />}
                                color="text-blue-600"
                            />
                            <KPICard
                                title="Total Registrations"
                                value={stats.summary.totalRegistrations}
                                icon={<FaUserFriends />}
                                color="text-green-600"
                            />
                            <KPICard
                                title="Conversion Rate"
                                value={`${stats.summary.conversionRate}%`}
                                icon={<FaChartLine />}
                                color="text-purple-600"
                            />
                            <KPICard
                                title="Total Events"
                                value={stats.summary.totalEvents}
                                icon={<FaChartBar />}
                                color="text-amrita-maroon"
                            />
                        </div>

                        {/* Performance Chart */}
                        <div className="card">
                            <h2 className="text-xl font-bold text-amrita-textDark mb-6">Views vs Registrations (Top 10 Recent)</h2>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="views" fill="#AF0C3E" name="Views" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="registrations" fill="#FFD92A" name="Registrations" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Events Table */}
                        <div className="card overflow-hidden">
                            <h2 className="text-xl font-bold text-amrita-textDark mb-6 px-2">Individual Event Performance</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-amrita-bgLight border-y border-gray-100">
                                        <tr>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Event Title</th>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Category</th>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Views</th>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Registrations</th>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Conversion</th>
                                            <th className="px-4 py-4 text-sm font-bold text-amrita-textDark">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.events.map((event: any) => (
                                            <tr key={event._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-4 font-medium text-amrita-textDark">{event.title}</td>
                                                <td className="px-4 py-4 text-amrita-textGray text-sm">{event.category}</td>
                                                <td className="px-4 py-4 text-amrita-textDark font-bold">{event.views}</td>
                                                <td className="px-4 py-4 text-amrita-textDark font-bold">{event.registrations}</td>
                                                <td className="px-4 py-4">
                                                    <span className="text-amrita-maroon font-bold text-sm bg-amrita-maroon/5 px-2 py-1 rounded">
                                                        {event.conversionRate}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${event.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {event.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

function KPICard({ title, value, icon, color }: any) {
    return (
        <div className="card group hover:scale-[1.02] transition">
            <div className="flex items-center justify-between mb-4">
                <div className={`text-3xl ${color} bg-gray-50 p-3 rounded-xl group-hover:bg-white transition`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-amrita-textGray text-sm font-medium mb-1 tracking-tight">{title}</h3>
            <p className="text-3xl font-black text-amrita-textDark">{value.toLocaleString()}</p>
        </div>
    );
}
