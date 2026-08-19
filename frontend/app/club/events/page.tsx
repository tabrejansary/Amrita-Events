'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import EventCard from '@/components/common/EventCard';
import Footer from '@/components/common/Footer';
import AnnouncementBanner from '@/components/common/AnnouncementBanner';
import { clubAPI, eventAPI } from '@/lib/api';
import { FaPlus, FaSpinner, FaTrash, FaWpforms, FaUsers, FaKey, FaCopy, FaCheck, FaEnvelope, FaPaperPlane, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import Pagination from '@/components/common/Pagination';

export default function ClubEventsPage() {
    const router = useRouter();
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [clubInfo, setClubInfo] = useState<any>(null);
    const [hasClub, setHasClub] = useState(true);
    const [copied, setCopied] = useState(false);

    // Email Invite state
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });

    // Onboarding modal / state if no club yet
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [clubForm, setClubForm] = useState({ name: '', description: '', inviteCode: '' });
    const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const [stats, setStats] = useState({
        approved: 0,
        pending: 0,
        totalViews: 0,
        total: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
    });
    const [userRole, setUserRole] = useState<'club' | 'admin' | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        setUserRole(user.role);

        if (user.role === 'admin') {
            router.push('/admin/events');
            return;
        }
        if (user.role !== 'club') {
            router.push('/student/feed');
            return;
        }

        fetchClubAndEvents();
    }, [pagination.page]);

    const fetchClubAndEvents = async () => {
        try {
            setLoading(true);

            // 1. Fetch user's club info
            try {
                const clubRes = await clubAPI.getMyClub();
                setClubInfo(clubRes.data.data);
                setHasClub(true);
            } catch (err: any) {
                if (err.response?.status === 404 || err.response?.status === 400) {
                    setHasClub(false);
                    setLoading(false);
                    return;
                }
            }

            // 2. Fetch club events
            const response = await clubAPI.getMyEvents({
                page: pagination.page,
                limit: pagination.limit
            });

            const { upcoming, completed } = response.data.data;
            setUpcomingEvents(upcoming || []);
            setPastEvents(completed || []);

            if (response.data.stats) {
                setStats({
                    ...response.data.stats,
                    total: response.data.pagination?.total || 0
                });
            }
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                }));
            }
        } catch (error: any) {
            console.error('Failed to fetch events:', error);
            if (error.response?.data?.message?.includes('not part of any club')) {
                setHasClub(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setActionLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', clubForm.name);
            formData.append('description', clubForm.description);
            if (clubLogoFile) {
                formData.append('logo', clubLogoFile);
            }

            await clubAPI.createClub(formData);
            await fetchClubAndEvents();
        } catch (err: any) {
            setActionError(err.response?.data?.message || 'Failed to create club');
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinClub = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError('');
        setActionLoading(true);

        try {
            await clubAPI.joinClub({ inviteCode: clubForm.inviteCode.trim() });
            await fetchClubAndEvents();
        } catch (err: any) {
            setActionError(err.response?.data?.message || 'Failed to join club. Check your invite code.');
        } finally {
            setActionLoading(false);
        }
    };

    const copyInviteCode = () => {
        if (clubInfo?.inviteCode) {
            navigator.clipboard.writeText(clubInfo.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSendInviteEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setSendingInvite(true);
        setInviteStatus({ type: '', message: '' });

        try {
            const res = await clubAPI.sendInviteEmail(inviteEmail.trim());
            setInviteStatus({ type: 'success', message: res.data.message || 'Invitation sent successfully!' });
            setInviteEmail('');
            setTimeout(() => {
                setIsEmailModalOpen(false);
                setInviteStatus({ type: '', message: '' });
            }, 2500);
        } catch (err: any) {
            setInviteStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to send invitation email.'
            });
        } finally {
            setSendingInvite(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (eventId: string, isPast: boolean = false) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            await eventAPI.deleteEvent(eventId);
            if (isPast) {
                setPastEvents(pastEvents.filter(e => e._id !== eventId));
            } else {
                setUpcomingEvents(upcomingEvents.filter(e => e._id !== eventId));
            }
            alert('Event deleted successfully');
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    // Onboarding if user has no club
    if (!hasClub) {
        return (
            <div className="min-h-screen bg-amrita-bgLight">
                <Navbar role={userRole || 'club'} />
                <div className="max-w-xl mx-auto px-4 py-16">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amrita-maroon/10 text-amrita-maroon rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FaUsers size={30} />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Welcome to Amrita Club Portal</h1>
                            <p className="text-gray-600 text-sm mt-1">
                                To start posting and managing events, create your club or join your team's club.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => { setTab('create'); setActionError(''); }}
                                className={`flex-1 py-3 font-semibold text-sm border-b-2 transition ${tab === 'create'
                                    ? 'border-amrita-maroon text-amrita-maroon'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Create New Club
                            </button>
                            <button
                                onClick={() => { setTab('join'); setActionError(''); }}
                                className={`flex-1 py-3 font-semibold text-sm border-b-2 transition ${tab === 'join'
                                    ? 'border-amrita-maroon text-amrita-maroon'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Join with Invite Code
                            </button>
                        </div>

                        {actionError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-100">
                                {actionError}
                            </div>
                        )}

                        {tab === 'create' ? (
                            <form onSubmit={handleCreateClub} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Club Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., IEEE Student Branch, ACM Chapter"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:outline-none"
                                        value={clubForm.name}
                                        onChange={e => setClubForm({ ...clubForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Brief description about your club..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:outline-none"
                                        value={clubForm.description}
                                        onChange={e => setClubForm({ ...clubForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Club Logo (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amrita-maroon file:text-white hover:file:bg-amrita-maroon/90"
                                        onChange={e => setClubLogoFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-amrita-maroon text-white font-bold rounded-lg hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-2"
                                >
                                    {actionLoading ? <FaSpinner className="animate-spin" /> : <span>Create Club & Get Invite Code</span>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleJoinClub} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        8-Character Invite Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        placeholder="e.g., A3F9B21C"
                                        className="w-full px-4 py-2 uppercase font-mono tracking-widest text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:outline-none"
                                        value={clubForm.inviteCode}
                                        onChange={e => setClubForm({ ...clubForm, inviteCode: e.target.value.toUpperCase() })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ask your club lead for your club's invite code.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !clubForm.inviteCode}
                                    className="w-full py-3 bg-amrita-maroon text-white font-bold rounded-lg hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {actionLoading ? <FaSpinner className="animate-spin" /> : <span>Join Club Team</span>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole || 'club'} />
            <AnnouncementBanner />

            <div className="container mx-auto px-4 py-8">
                {/* Club Header & Invite Code Banner */}
                {clubInfo && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            {clubInfo.logo ? (
                                <img src={clubInfo.logo} alt={clubInfo.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-amrita-maroon text-white flex items-center justify-center text-xl font-bold">
                                    {clubInfo.name?.[0]?.toUpperCase() || 'C'}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{clubInfo.name}</h1>
                                <p className="text-gray-500 text-sm">
                                    {clubInfo.members?.length || 1} team member{clubInfo.members?.length === 1 ? '' : 's'} sharing this dashboard
                                </p>
                            </div>
                        </div>

                        {clubInfo.inviteCode && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center space-x-3 bg-amrita-maroon/5 border border-amrita-maroon/20 rounded-xl px-4 py-2">
                                    <div className="text-left">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-amrita-maroon block">
                                            Member Invite Code
                                        </span>
                                        <span className="font-mono font-bold text-gray-900 text-base">
                                            {clubInfo.inviteCode}
                                        </span>
                                    </div>
                                    <button
                                        onClick={copyInviteCode}
                                        className="p-2 bg-white text-amrita-maroon rounded-lg shadow-sm border border-gray-200 hover:bg-amrita-maroon hover:text-white transition"
                                        title="Copy Invite Code"
                                    >
                                        {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
                                    </button>
                                </div>

                                <button
                                    onClick={() => { setIsEmailModalOpen(true); setInviteStatus({ type: '', message: '' }); }}
                                    className="px-3.5 py-2.5 bg-amrita-maroon text-white text-xs font-bold rounded-xl hover:bg-amrita-maroon/90 transition shadow-sm flex items-center space-x-1.5"
                                >
                                    <FaEnvelope size={12} />
                                    <span>Send to Member Email</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-amrita-maroon tracking-tight">Club Events</h2>
                        <p className="text-amrita-textGray text-sm">Events posted by your club members</p>
                    </div>

                    <Link href="/club/create" className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <FaPlus size={12} />
                        <span>Create Event</span>
                    </Link>
                </div>

                {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                    <div className="text-center py-12 card">
                        <p className="text-xl text-amrita-textGray mb-4">
                            Your club hasn't created any events yet
                        </p>
                        <Link href="/club/create" className="btn-primary inline-block">
                            Create Your First Event
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Upcoming Events Section */}
                        <section>
                            <h2 className="text-xl font-bold text-amrita-textDark mb-4 flex items-center">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full mr-2"></span>
                                Upcoming Events
                            </h2>

                            {upcomingEvents.length === 0 ? (
                                <div className="card text-center py-8">
                                    <p className="text-amrita-textGray">No upcoming events scheduled</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {upcomingEvents.map(event => (
                                        <div key={event._id} className="relative">
                                            {(event.status === 'pending' || event.status === 'rejected') && (
                                                <div className="absolute top-2 left-2 z-10">
                                                    <span className={`text-xs font-bold px-3 py-1 rounded shadow-md ${event.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {event.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <EventCard event={event} showAnalytics />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Link
                                                    href={`/events/${event._id}/edit`}
                                                    className="flex-1 min-w-[60px] text-center btn-secondary text-[11px] py-1 px-2 rounded-md font-bold"
                                                >
                                                    Edit
                                                </Link>
                                                {(!event.registrationLink || event.useInternalRegistration || (event.registrations > 0)) && (
                                                    <Link
                                                        href={`/club/registrations/${event._id}`}
                                                        className="flex-[2] min-w-[100px] bg-amrita-maroon text-white text-[11px] py-1 rounded-md hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-1 font-bold"
                                                    >
                                                        <FaWpforms size={12} />
                                                        <span>Registrations</span>
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(event._id)}
                                                    className="flex-1 min-w-[60px] bg-red-50 text-red-600 text-[11px] py-1 rounded-md hover:bg-red-600 hover:text-white transition font-bold border border-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {pagination.pages > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.pages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </section>

                        <hr className="border-gray-200" />

                        {/* Completed Events Section */}
                        <section>
                            <h2 className="text-xl font-bold text-amrita-textDark mb-4 flex items-center">
                                <span className="w-1.5 h-6 bg-amrita-maroon rounded-full mr-2"></span>
                                Completed Events
                            </h2>

                            {pastEvents.length === 0 ? (
                                <div className="card text-center py-8">
                                    <p className="text-amrita-textGray">No completed events yet</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                                    {pastEvents.map(event => (
                                        <div key={event._id} className="relative grayscale-[0.3] hover:grayscale-0 transition duration-300">
                                            <EventCard event={event} showAnalytics />
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {(!event.registrationLink || event.useInternalRegistration || (event.registrations > 0)) && (
                                                    <Link
                                                        href={`/club/registrations/${event._id}`}
                                                        className="flex-1 min-w-[100px] bg-amrita-maroon text-white text-[11px] py-1.5 rounded-md hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-1 font-bold"
                                                    >
                                                        <FaWpforms size={12} />
                                                        <span>Registrations</span>
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(event._id, true)}
                                                    className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition flex items-center justify-center border border-red-100"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {/* Send Invite Email Modal */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center space-x-2.5 text-amrita-maroon">
                                <FaEnvelope className="text-xl" />
                                <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                            </div>
                            <button
                                onClick={() => setIsEmailModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Send an official invitation email with the <strong>{clubInfo?.name}</strong> invite code (<strong>{clubInfo?.inviteCode}</strong>) to another club organizer.
                        </p>

                        {inviteStatus.message && (
                            <div className={`p-3 rounded-lg text-xs font-medium mb-4 border flex items-center space-x-2 ${inviteStatus.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                {inviteStatus.type === 'success' ? <FaCheck /> : <span>⚠️</span>}
                                <span>{inviteStatus.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSendInviteEmail} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Recipient's Amrita Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="teammate@bl.students.amrita.edu"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amrita-maroon focus:outline-none text-sm text-gray-900"
                                />

                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingInvite || !inviteEmail}
                                    className="flex-1 py-2.5 bg-amrita-maroon text-white font-bold rounded-xl text-sm hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
                                >
                                    {sendingInvite ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>Sending Email...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane size={12} />
                                            <span>Send Invite</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
