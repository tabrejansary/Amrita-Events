'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { adminAPI } from '@/lib/api';
import {
    FaChartBar, FaCalendarCheck, FaUsers, FaEye, FaSpinner,
    FaChartLine, FaTrophy, FaExclamationTriangle, FaArrowUp,
    FaArrowDown, FaFilter, FaWpforms, FaExternalLinkAlt
} from 'react-icons/fa';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Pagination from '@/components/common/Pagination';

const COLORS = ['#AF0C3E', '#FFD92A', '#6B21A8', '#059669', '#DC2626', '#2563EB', '#EA580C'];

export default function AdminStatsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [trendPeriod, setTrendPeriod] = useState('30d');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Data states
    const [kpis, setKpis] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [eventPerformance, setEventPerformance] = useState<any>({ data: [], pagination: {} });
    const [categoryInsights, setCategoryInsights] = useState<any>(null);
    const [userInsights, setUserInsights] = useState<any>(null);
    const [topPerformers, setTopPerformers] = useState<any>(null);
    const [platformInsights, setPlatformInsights] = useState<any[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('views');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchAllData();
    }, [timeRange, trendPeriod, currentPage, sortBy, sortOrder, categoryFilter, startDate, endDate]);

    const fetchAllData = async () => {
        try {
            setLoading(true);

            // Fetch all analytics data in parallel
            const [
                kpisRes,
                trendsRes,
                perfRes,
                categoryRes,
                userRes,
                topRes,
                insightsRes
            ] = await Promise.all([
                adminAPI.getKPIs(timeRange, timeRange === 'custom' ? startDate : undefined, timeRange === 'custom' ? endDate : undefined),
                adminAPI.getTrends(trendPeriod, timeRange === 'custom' ? startDate : undefined, timeRange === 'custom' ? endDate : undefined),
                adminAPI.getEventPerformance({
                    page: currentPage,
                    limit: 10,
                    sortBy,
                    sortOrder,
                    category: categoryFilter || undefined,
                    startDate: timeRange === 'custom' ? startDate : undefined,
                    endDate: timeRange === 'custom' ? endDate : undefined
                }),
                adminAPI.getCategoryInsights(),
                adminAPI.getUserInsights(),
                adminAPI.getTopPerformers(),
                adminAPI.getPlatformInsights()
            ]);

            setKpis(kpisRes.data.data);
            setTrends(trendsRes.data.data || []);
            setEventPerformance(perfRes.data);
            setCategoryInsights(categoryRes.data.data);
            setUserInsights(userRes.data.data);
            setTopPerformers(topRes.data.data);
            setPlatformInsights(insightsRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !kpis) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role="admin" />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                        <FaChartBar />
                        <span>Platform Analytics</span>
                    </h1>
                    <p className="text-amrita-textGray">Comprehensive insights and performance metrics</p>
                </div>

                {/* KPI Cards */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-amrita-textDark">Key Performance Indicators</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:border-transparent"
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            {timeRange === 'custom' && (
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon"
                                    />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                        {kpis && (
                            <>
                                <KPICard
                                    title="Active Users"
                                    value={kpis.activeUsers.value}
                                    change={kpis.activeUsers.change}
                                    timeRange={kpis.activeUsers.timeRange}
                                    icon={<FaUsers />}
                                    color="text-blue-600"
                                />
                                <KPICard
                                    title="Approved Events"
                                    value={kpis.totalApprovedEvents.value}
                                    change={kpis.totalApprovedEvents.change}
                                    timeRange={kpis.totalApprovedEvents.timeRange}
                                    icon={<FaCalendarCheck />}
                                    color="text-green-600"
                                />
                                <KPICard
                                    title="Total Views"
                                    value={kpis.totalViews.value}
                                    change={kpis.totalViews.change}
                                    timeRange={kpis.totalViews.timeRange}
                                    icon={<FaEye />}
                                    color="text-purple-600"
                                />
                                <KPICard
                                    title="Registrations"
                                    value={kpis.totalRegistrations.value}
                                    change={kpis.totalRegistrations.change}
                                    timeRange={kpis.totalRegistrations.timeRange}
                                    icon={<FaChartLine />}
                                    color="text-orange-600"
                                />
                                <KPICard
                                    title="Conversion Rate"
                                    value={`${kpis.conversionRate.value}%`}
                                    change={kpis.conversionRate.change}
                                    timeRange={kpis.conversionRate.timeRange}
                                    icon={<FaTrophy />}
                                    color="text-amrita-maroon"
                                />
                            </>
                        )}
                        {/* Total Students and Clubs */}
                        {userInsights && (
                            <>
                                <div className="card">
                                    <div className="text-2xl text-blue-600 mb-2"><FaUsers /></div>
                                    <h3 className="text-amrita-textGray text-xs uppercase tracking-wider mb-1">Total Students</h3>
                                    <p className="text-3xl font-black text-amrita-textDark">{userInsights.studentsVsClubs.students.toLocaleString()}</p>
                                </div>
                                <div className="card">
                                    <div className="text-2xl text-green-600 mb-2"><FaUsers /></div>
                                    <h3 className="text-amrita-textGray text-xs uppercase tracking-wider mb-1">Total Clubs</h3>
                                    <p className="text-3xl font-black text-amrita-textDark">{userInsights.studentsVsClubs.clubs.toLocaleString()}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Engagement Trends */}
                <div className="card mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-amrita-maroon">Engagement Trends</h2>
                        <select
                            value={trendPeriod}
                            onChange={(e) => setTrendPeriod(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:border-transparent"
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>

                    {trends.length > 0 && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-semibold text-amrita-textGray mb-4">Events Created Over Time</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="eventsCreated" fill="#AF0C3E" name="Events Created" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-amrita-textGray mb-4">Cumulative Engagement</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="views" stroke="#6B21A8" name="Total Views" strokeWidth={2} />
                                        <Line type="monotone" dataKey="registrations" stroke="#FFD92A" name="Total Registrations" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* Category & User Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Category Insights */}
                    {categoryInsights && categoryInsights.categories.length > 0 && (
                        <div className="card">
                            <h2 className="text-xl font-bold text-amrita-maroon mb-6">Events by Category</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryInsights.categories}
                                        dataKey="count"
                                        nameKey="_id"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {categoryInsights.categories.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* User Activity */}
                    {userInsights && (
                        <div className="card">
                            <h2 className="text-xl font-bold text-amrita-maroon mb-6">User Activity</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-amrita-textGray mb-2">Active vs Inactive (Last 30 Days)</h3>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Active', value: userInsights.activeVsInactive.active },
                                                    { name: 'Inactive', value: userInsights.activeVsInactive.inactive }
                                                ]}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                <Cell fill="#059669" />
                                                <Cell fill="#DC2626" />
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-amrita-bgLight rounded-lg">
                                        <p className="text-sm text-amrita-textGray">Students</p>
                                        <p className="text-2xl font-bold text-amrita-maroon">{userInsights.studentsVsClubs.students}</p>
                                    </div>
                                    <div className="p-4 bg-amrita-bgLight rounded-lg">
                                        <p className="text-sm text-amrita-textGray">Clubs</p>
                                        <p className="text-2xl font-bold text-amrita-maroon">{userInsights.studentsVsClubs.clubs}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Event Performance Table */}
                <div className="card mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-amrita-maroon">Event Performance</h2>
                        {categoryInsights && categoryInsights.categories && (
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:border-transparent"
                            >
                                <option value="">All Categories</option>
                                {categoryInsights.categories.map((cat: any) => (
                                    <option key={cat._id} value={cat._id}>{cat._id}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-amrita-bgLight">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark">Event Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark">Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark">Organizer</th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark cursor-pointer hover:text-amrita-maroon"
                                        onClick={() => {
                                            setSortBy('views');
                                            setSortOrder(sortBy === 'views' && sortOrder === 'desc' ? 'asc' : 'desc');
                                        }}
                                    >
                                        Views {sortBy === 'views' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark cursor-pointer hover:text-amrita-maroon"
                                        onClick={() => {
                                            setSortBy('registrations');
                                            setSortOrder(sortBy === 'registrations' && sortOrder === 'desc' ? 'asc' : 'desc');
                                        }}
                                    >
                                        Registrations {sortBy === 'registrations' && (sortOrder === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark">Conversion %</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-amrita-textDark">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventPerformance.data?.map((event: any) => (
                                    <tr key={event._id} className="border-t border-gray-200 hover:bg-amrita-bgLight">
                                        <td className="px-4 py-3 text-sm text-amrita-textDark">{event.title}</td>
                                        <td className="px-4 py-3 text-sm text-amrita-textGray">{event.category}</td>
                                        <td className="px-4 py-3 text-sm text-amrita-textGray">{event.organizerName}</td>
                                        <td className="px-4 py-3 text-sm text-amrita-textDark font-semibold">{event.views}</td>
                                        <td className="px-4 py-3 text-sm text-amrita-textDark font-semibold">{event.registrations}</td>
                                        <td className="px-4 py-3 text-sm text-amrita-textDark">{event.conversionRate}%</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${event.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {event.isFeatured ? 'Featured' : 'Approved'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {eventPerformance.pagination && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={eventPerformance.pagination.pages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    )}
                </div>



            </div>

            <Footer />
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, change, timeRange, icon, color }: any) {
    const isPositive = change >= 0;

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-2">
                <div className={`text-2xl ${color}`}>{icon}</div>
                <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(change).toFixed(1)}%
                </div>
            </div>
            <h3 className="text-amrita-textGray text-xs uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-black text-amrita-textDark mb-1">{value.toLocaleString()}</p>
            <p className="text-xs text-amrita-textGray">{timeRange}</p>
        </div>
    );
}
