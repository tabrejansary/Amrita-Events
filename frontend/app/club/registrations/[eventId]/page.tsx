'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { registrationAPI, eventAPI, formAPI } from '@/lib/api';
import { FaDownload, FaSearch, FaFilter, FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function RegistrationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [form, setForm] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [userRole, setUserRole] = useState<'student' | 'club' | 'admin' | null>(null);

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
        fetchData();
    }, [params.eventId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const userData = localStorage.getItem('user');
            if (!userData) {
                router.push('/login');
                return;
            }
            const user = JSON.parse(userData);

            const [eventRes, regRes] = await Promise.all([
                eventAPI.getEvent(params.eventId as string),
                registrationAPI.getEventRegistrations(params.eventId as string)
            ]);

            const eventData = eventRes.data.data;

            // SECURITY CHECK: Verify if the current user is the organizer of this event
            const organizerId = typeof eventData.organizer === 'object'
                ? (eventData.organizer._id || eventData.organizer.id)
                : eventData.organizer;

            if (user._id !== organizerId && user.id !== organizerId) {
                console.error('Unauthorized access attempt to registration details');
                // Redirect based on role
                if (user.role === 'admin') router.push('/admin/events');
                else if (user.role === 'club') router.push('/club/events');
                else router.push('/student/feed');
                return;
            }

            setEvent(eventData);
            setRegistrations(regRes.data.data);

            if (eventData.customForm) {
                const formId = typeof eventData.customForm === 'string' ? eventData.customForm : eventData.customForm._id;
                const formRes = await formAPI.getFormById(formId);
                setForm(formRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch registration data:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch = reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reg.user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = filterYear === 'All' || reg.user.year?.toString() === filterYear;
        const matchesDept = filterDept === 'All' || reg.user.department === filterDept;

        return matchesSearch && matchesYear && matchesDept;
    });

    const exportToCSV = () => {
        if (!registrations.length) return;

        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return '""';
            let stringVal = String(val);
            // Replace double quotes with escaped double quotes
            stringVal = stringVal.replace(/"/g, '""');
            // Wrap in quotes if it contains comma, newline or double quote
            if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
                return `"${stringVal}"`;
            }
            return stringVal;
        };

        // Header
        const formHeaders = form?.fields.map((f: any) => f.label) || [];
        const headers = ['Name', 'Email', 'Department', 'Year', ...formHeaders, 'Submitted At'];

        // Rows
        const rows = filteredRegistrations.map(reg => {
            const rowData = [
                escapeCSV(reg.user.name),
                escapeCSV(reg.user.email),
                escapeCSV(reg.user.department || 'N/A'),
                escapeCSV(reg.user.year || 'N/A')
            ];

            // Map answers to columns
            formHeaders.forEach((header: string) => {
                const answer = reg.answers.find((a: any) => a.label === header);
                const value = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '';
                rowData.push(escapeCSV(value));
            });

            rowData.push(escapeCSV(new Date(reg.submittedAt).toLocaleString()));
            return rowData.join(',');
        });

        const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title}_registrations.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    const departments = Array.from(new Set(registrations.map(r => r.user.department))).filter(Boolean);
    const years = Array.from(new Set(registrations.map(r => r.user.year?.toString()))).filter(Boolean).sort();

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole || 'club'} />

            <div className="container mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-amrita-maroon mb-6 hover:underline font-semibold"
                >
                    <FaArrowLeft />
                    <span>Back to Events</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-amrita-textDark tracking-tight">{event?.title}</h1>
                        <p className="text-amrita-textGray text-sm">
                            <span className="font-bold text-amrita-maroon">{filteredRegistrations.length}</span> Total Registrations
                        </p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="btn-secondary flex items-center justify-center space-x-2 py-1.5 px-4 text-xs font-bold shadow-sm"
                    >
                        <FaDownload size={12} />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="card !p-3 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Student name or email..."
                            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <FaFilter size={12} className="text-amrita-maroon ml-1" />
                        <select
                            className="flex-1 p-1.5 border border-gray-200 rounded-md outline-none text-sm bg-white"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="All">All Departments</option>
                            {departments.map((dept: any) => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FaFilter size={12} className="text-amrita-maroon ml-1" />
                        <select
                            className="flex-1 p-1.5 border border-gray-200 rounded-md outline-none text-sm bg-white"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="All">All Years</option>
                            {years.map((year: any) => (
                                <option key={year} value={year}>{year} Year</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Spreadsheet Table */}
                <div className="card overflow-hidden !p-0 border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-amrita-maroon font-bold text-[11px] uppercase tracking-wider">
                                    <th className="px-4 py-3 min-w-[150px]">Student Details</th>
                                    <th className="px-4 py-3 min-w-[180px]">Contact Info</th>
                                    <th className="px-4 py-3 min-w-[100px]">Dept/Year</th>
                                    {form?.fields.map((field: any) => (
                                        <th key={field._id} className="px-4 py-3 min-w-[150px]">{field.label}</th>
                                    ))}
                                    <th className="px-4 py-3 min-w-[130px]">Submission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRegistrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={100} className="px-4 py-8 text-center text-amrita-textGray italic">
                                            No registrations found matching the filters
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRegistrations.map((reg) => (
                                        <tr key={reg._id} className="hover:bg-amrita-maroon/5 transition-colors text-xs border-b border-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-amrita-textDark">{reg.user.name}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-amrita-textGray select-all" title={reg.user.email}>{reg.user.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                                    {reg.user.department} • {reg.user.year} yr
                                                </span>
                                            </td>
                                            {form?.fields.map((field: any) => {
                                                const answer = reg.answers.find((a: any) => a.label === field.label);
                                                const displayValue = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '-';

                                                return (
                                                    <td key={field._id} className="px-4 py-3 text-amrita-textDark max-w-[250px]">
                                                        <div
                                                            className="truncate"
                                                            title={displayValue}
                                                        >
                                                            {answer ? (
                                                                Array.isArray(answer.value) ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {answer.value.map((v: string, i: number) => (
                                                                            <span key={i} className="bg-amrita-maroon/5 text-amrita-maroon px-2 py-0.5 rounded text-[10px] font-bold">
                                                                                {v}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : answer.value
                                                            ) : (
                                                                <span className="text-gray-300">-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-gray-400 font-medium">
                                                {new Date(reg.submittedAt).toLocaleDateString()}
                                                <span className="block text-[10px] opacity-70">
                                                    {new Date(reg.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
