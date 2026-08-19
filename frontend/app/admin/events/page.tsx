'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import EventCard from '@/components/common/EventCard';
import OrganizerCard from '@/components/admin/OrganizerCard';
import Footer from '@/components/common/Footer';
import { adminAPI, eventAPI } from '@/lib/api';
import Link from 'next/link';
import { FaSpinner, FaStar, FaTrash, FaFilter, FaSearch, FaEdit, FaArrowLeft, FaChevronRight, FaWpforms, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Pagination from '@/components/common/Pagination';

export default function AdminAllEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedOrganizer, setSelectedOrganizer] = useState<any | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'dashboard' | 'special-all' | 'featured-all' | 'organizer-month' | 'organizer-all'>('dashboard');

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        setCurrentUserId(user._id || user.id);
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [viewMode, pagination.page, filterStatus, searchTerm]);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                status: filterStatus,
                search: searchTerm
            };

            if (viewMode === 'special-all') {
                params.isSpecial = 'true';
                params.upcoming = 'true';
            }
            if (viewMode === 'featured-all') {
                params.isFeatured = 'true';
                params.upcoming = 'true';
            }

            // In dashboard mode, we still fetch a limited set for previews
            const [eventsRes, clubsRes] = await Promise.all([
                adminAPI.getAllEvents(params),
                viewMode === 'dashboard' ? adminAPI.getClubs({ limit: 20 }) : Promise.resolve({ data: { data: [] } })
            ]);

            setEvents(eventsRes.data.data);
            if (viewMode === 'dashboard') {
                setClubs(clubsRes.data.data);
            }

            if (eventsRes.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: eventsRes.data.pagination.total,
                    pages: eventsRes.data.pagination.pages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewModeChange = (mode: any) => {
        setViewMode(mode);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleToggleFeature = async (eventId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            await adminAPI.toggleFeature(eventId);

            // Update main events list
            setEvents(prev => prev.map(e =>
                e._id === eventId ? { ...e, isFeatured: newStatus } : e
            ));

            // Also update selectedOrganizer events if viewing a club
            setSelectedOrganizer((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    events: (prev.events || []).map((e: any) =>
                        e._id === eventId ? { ...e, isFeatured: newStatus } : e
                    )
                };
            });
        } catch (error) {
            alert('Failed to update featured status');
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

        try {
            await eventAPI.deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e._id !== eventId));

            // Also update selectedOrganizer if viewing a club
            setSelectedOrganizer((prev: any) => {
                if (!prev) return prev;
                const newEvents = (prev.events || []).filter((e: any) => e._id !== eventId);
                return {
                    ...prev,
                    eventCount: Math.max(0, newEvents.length),
                    events: newEvents
                };
            });
            alert('Event deleted successfully');
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organizer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organizer?.clubName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Categorize events
    const upcomingSpecialEvents = filteredEvents.filter(e =>
        (e.organizer?.role === 'admin' || e.organizerName?.toLowerCase() === 'admin') &&
        e.status !== 'completed'
    );

    const completedSpecialEvents = filteredEvents.filter(e =>
        (e.organizer?.role === 'admin' || e.organizerName?.toLowerCase() === 'admin') &&
        e.status === 'completed'
    );

    const upcomingFeaturedEvents = filteredEvents.filter(e =>
        e.isFeatured && e.status !== 'completed'
    );

    // Process Organizers (Strictly Clubs from database + any active club events)
    const organizersMap = new Map();

    // 1. Add all registered clubs from the database
    clubs.forEach(club => {
        const id = (club._id || club.id)?.toString();
        if (id) {
            organizersMap.set(id, {
                ...club,
                _id: id,
                name: club.name || club.clubName || 'Unknown Club',
                clubName: club.name || club.clubName || 'Unknown Club',
                clubLogo: club.logo || club.clubLogo,
                role: 'club',
                eventCount: club.eventCount || 0,
                events: []
            });
        }
    });

    // 2. Attach events to their corresponding club
    filteredEvents.forEach(e => {
        const isSpecialEvent = e.organizer?.role === 'admin' || e.organizerName?.toLowerCase() === 'admin';
        if (!isSpecialEvent) {
            const orgId = (typeof e.organizer === 'object' ? (e.organizer?._id || e.organizer?.id) : e.organizer)?.toString();

            if (orgId && organizersMap.has(orgId)) {
                const org = organizersMap.get(orgId);
                org.events.push(e);
                if (org.events.length > org.eventCount) {
                    org.eventCount = org.events.length;
                }
            } else if (e.organizer?.name || e.organizerName) {
                const clubName = e.organizer?.name || e.organizerName;
                let matched = false;
                for (const org of organizersMap.values()) {
                    if (org.name?.toLowerCase() === clubName.toLowerCase()) {
                        org.events.push(e);
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    const id = orgId || clubName;
                    organizersMap.set(id, {
                        _id: id,
                        name: clubName,
                        clubName: clubName,
                        clubLogo: e.organizer?.logo,
                        role: 'club',
                        eventCount: 1,
                        events: [e]
                    });
                }
            }
        }
    });

    const organizers = Array.from(organizersMap.values());

    // Helper to group events by month
    const groupEventsByMonth = (eventsList: any[]) => {
        const groups: { [key: string]: any[] } = {};
        eventsList.forEach(event => {
            const date = new Date(event.eventDate);
            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(event);
        });
        return groups;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    const handleBack = () => {
        if (viewMode === 'organizer-month') {
            setViewMode('organizer-all');
        } else {
            setViewMode('dashboard');
            setSelectedOrganizer(null);
        }
    };

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role="admin" />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-amrita-maroon tracking-tight">
                            {viewMode === 'special-all' ? 'Upcoming Special Events' :
                                viewMode === 'featured-all' ? 'Upcoming Featured Events' :
                                    viewMode === 'organizer-all' ? `${selectedOrganizer?.clubName || selectedOrganizer?.name}'s Events` :
                                        viewMode === 'organizer-month' ? `${selectedMonth} Events` :
                                            'Event Management'}
                        </h1>
                        <p className="text-amrita-textGray text-sm italic">
                            {viewMode === 'dashboard' ? 'Manage campus events and featured listings' : 'Viewing full list of events'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/club/create" className="btn-primary flex items-center justify-center space-x-2 px-6">
                            <span>Create Special Event</span>
                        </Link>
                        {viewMode === 'dashboard' && (
                            <>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search events or clubs..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:outline-none w-full sm:w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amrita-maroon focus:outline-none"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>

                {viewMode !== 'dashboard' && (
                    <button
                        onClick={() => handleViewModeChange('dashboard')}
                        className="flex items-center text-amrita-maroon hover:underline mb-6 font-semibold"
                    >
                        <FaArrowLeft className="mr-2" /> Back to {viewMode === 'organizer-month' ? 'Organizer Details' : 'Dashboard'}
                    </button>
                )}

                {viewMode === 'special-all' && (
                    <div className="space-y-8">
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {events.map(event => (
                                <AdminEventItem
                                    key={event._id}
                                    event={event}
                                    currentUserId={currentUserId}
                                    handleToggleFeature={handleToggleFeature}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {viewMode === 'featured-all' && (
                    <div className="space-y-8">
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {events.map(event => (
                                <AdminEventItem
                                    key={event._id}
                                    event={event}
                                    currentUserId={currentUserId}
                                    handleToggleFeature={handleToggleFeature}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                {viewMode === 'organizer-all' && selectedOrganizer && (
                    <div>
                        <div className="flex items-center space-x-6 mb-10 bg-white p-6 rounded-xl shadow-sm">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-amrita-bgLight shadow-inner bg-amrita-maroon flex items-center justify-center">
                                <img
                                    src={selectedOrganizer.clubLogo || selectedOrganizer.profileImage || '/default-club-logo.png'}
                                    alt={selectedOrganizer.clubName || selectedOrganizer.name}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', `<span class="text-2xl font-bold text-white">${(selectedOrganizer.clubName || selectedOrganizer.name || '?')[0].toUpperCase()}</span>`);
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-amrita-maroon">{selectedOrganizer.clubName || selectedOrganizer.name}</h2>
                                <p className="text-amrita-textGray">{selectedOrganizer.eventCount} total events</p>
                            </div>
                        </div>

                        {/* Split Organizer Events View */}
                        <div className="space-y-16">
                            {/* Upcoming Section */}
                            <section>
                                <h3 className="text-xl font-bold text-amrita-textDark mb-6 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Upcoming Events
                                </h3>
                                {selectedOrganizer.events.filter((e: any) => e.status !== 'completed').length > 0 ? (
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                        {selectedOrganizer.events.filter((e: any) => e.status !== 'completed').map((event: any) => (
                                            <AdminEventItem
                                                key={event._id}
                                                event={event}
                                                currentUserId={currentUserId}
                                                handleToggleFeature={handleToggleFeature}
                                                handleDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-amrita-textGray italic bg-white p-6 rounded-lg border border-dashed text-center">No upcoming events from this club.</p>
                                )}
                            </section>

                            <hr className="border-gray-200" />

                            {/* Completed Section */}
                            <section>
                                <h3 className="text-xl font-bold text-amrita-textGray mb-6 flex items-center">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                                    Completed Events
                                </h3>
                                {selectedOrganizer.events.filter((e: any) => e.status === 'completed').length > 0 ? (
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-75 grayscale-[0.2]">
                                        {selectedOrganizer.events.filter((e: any) => e.status === 'completed').map((event: any) => (
                                            <AdminEventItem
                                                key={event._id}
                                                event={event}
                                                currentUserId={currentUserId}
                                                handleToggleFeature={handleToggleFeature}
                                                handleDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-amrita-textGray italic text-center">No completed events yet.</p>
                                )}
                            </section>
                        </div>
                    </div>
                )}

                {viewMode === 'organizer-month' && selectedOrganizer && selectedMonth && (
                    <div className="space-y-8">
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {groupEventsByMonth(selectedOrganizer.events)[selectedMonth].map((event: any) => (
                                <AdminEventItem
                                    key={event._id}
                                    event={event}
                                    currentUserId={currentUserId}
                                    handleToggleFeature={handleToggleFeature}
                                    handleDelete={handleDelete}
                                />
                            ))}
                        </div>
                        <div className="text-center py-12 border-t border-dashed border-gray-300">
                            <p className="text-amrita-textGray font-medium italic">That's all the events for {selectedMonth}!</p>
                        </div>
                    </div>
                )}

                {viewMode === 'dashboard' && (
                    <div className="space-y-16">
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-12 card">
                                <p className="text-xl text-amrita-textGray">No events found</p>
                            </div>
                        ) : (
                            <>
                                {/* Section 1: Upcoming Special Events */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-amrita-maroon">Upcoming Special Events (by Admin)</h2>
                                        <button
                                            onClick={() => handleViewModeChange('special-all')}
                                            className="text-amrita-maroon flex items-center font-semibold hover:underline"
                                        >
                                            View all <FaChevronRight className="ml-1 text-xs" />
                                        </button>
                                    </div>
                                    {upcomingSpecialEvents.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {upcomingSpecialEvents.slice(0, 6).map(event => (
                                                <AdminEventItem
                                                    key={event._id}
                                                    event={event}
                                                    currentUserId={currentUserId}
                                                    handleToggleFeature={handleToggleFeature}
                                                    handleDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-amrita-textGray italic">No upcoming special events created by admin.</p>
                                    )}
                                </section>

                                <hr className="border-gray-200" />

                                {/* Section 2: Upcoming Featured Events */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-amrita-maroon">Upcoming Featured Events</h2>
                                        <button
                                            onClick={() => handleViewModeChange('featured-all')}
                                            className="text-amrita-maroon flex items-center font-semibold hover:underline"
                                        >
                                            View all <FaChevronRight className="ml-1 text-xs" />
                                        </button>
                                    </div>
                                    {upcomingFeaturedEvents.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {upcomingFeaturedEvents.slice(0, 6).map(event => (
                                                <AdminEventItem
                                                    key={event._id}
                                                    event={event}
                                                    currentUserId={currentUserId}
                                                    handleToggleFeature={handleToggleFeature}
                                                    handleDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-amrita-textGray italic">No upcoming featured events found.</p>
                                    )}
                                </section>

                                <hr className="border-gray-200" />

                                {/* Section 3: Organizers */}
                                <section>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-amrita-maroon">Events from Organizers (Clubs)</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {organizers.map(org => (
                                            <OrganizerCard
                                                key={org._id || org.id}
                                                organizer={org}
                                                onClick={() => {
                                                    setSelectedOrganizer(org);
                                                    setViewMode('organizer-all');
                                                }}
                                            />
                                        ))}
                                    </div>
                                </section>

                                <hr className="border-gray-200" />

                                {/* Section 4: Completed Special Events */}
                                <section className="bg-gray-50 -mx-4 px-4 py-12 border-t border-gray-100">
                                    <div className="max-w-7xl mx-auto">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h2 className="text-2xl font-bold text-amrita-maroon">Completed Special Events</h2>
                                                <p className="text-amrita-textGray text-sm">Past events created by Admin</p>
                                            </div>
                                            <div className="flex items-center space-x-2 text-amrita-textGray text-sm font-medium">
                                                <span className="bg-gray-200 px-3 py-1 rounded-full">{completedSpecialEvents.length} total</span>
                                            </div>
                                        </div>

                                        {completedSpecialEvents.length > 0 ? (
                                            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-80 grayscale-[0.3]">
                                                {completedSpecialEvents.slice(0, 6).map(event => (
                                                    <AdminEventItem
                                                        key={event._id}
                                                        event={event}
                                                        currentUserId={currentUserId}
                                                        handleToggleFeature={handleToggleFeature}
                                                        handleDelete={handleDelete}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-amrita-textGray italic">No completed special events found.</p>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

// Sub-component to clean up the main page code
function AdminEventItem({ event, currentUserId, handleToggleFeature, handleDelete }: any) {
    const isFeatured = Boolean(event.isFeatured);

    return (
        <div className="relative group">
            <EventCard event={event} />

            <div className="mt-3 flex flex-wrap gap-2">
                {event.status !== 'completed' && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleFeature(event._id, isFeatured);
                            }}
                            className={`flex-1 min-w-[80px] px-3 py-1.5 rounded-md transition flex items-center justify-center space-x-1.5 border cursor-pointer shadow-sm ${isFeatured
                                ? 'bg-amrita-yellow border-amrita-yellow text-amrita-maroon font-bold'
                                : 'border-gray-300 text-gray-700 bg-white hover:border-amrita-yellow hover:text-amrita-maroon text-[11px] font-semibold'
                                }`}
                            title={isFeatured ? 'Click to unfeature' : 'Click to feature on homepage'}
                        >
                            <FaStar size={12} className={isFeatured ? 'text-amrita-maroon' : 'text-gray-400'} />
                            <span className="text-[11px]">{isFeatured ? 'Featured ★' : 'Feature'}</span>
                        </button>

                        {((event.organizer && currentUserId === (typeof event.organizer === 'object' ? event.organizer._id : event.organizer)) || event.organizerName === 'Admin') && (
                            <Link
                                href={`/events/${event._id}/edit`}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                                title="Edit special event"
                            >
                                <FaEdit size={12} />
                            </Link>
                        )}
                    </>
                )}

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(event._id);
                    }}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-md hover:bg-red-600 hover:text-white transition flex items-center justify-center flex-1 min-w-[80px] font-bold cursor-pointer"
                    title="Delete Event"
                >
                    <FaTrash size={12} className="mr-1.5" />
                    <span className="text-[11px]">Delete</span>
                </button>

                {/* Only show registrations link to the actual organizer. Admins who are not organizers shouldn't see student data. */}
                {(((event.organizer && currentUserId === (typeof event.organizer === 'object' ? event.organizer._id : event.organizer)) || event.organizerName === 'Admin') &&
                    (!event.registrationLink || event.useInternalRegistration || (event.registrations > 0))) && (
                        <Link
                            href={`/club/registrations/${event._id}`}
                            className="px-3 py-1 bg-amrita-maroon text-white rounded-md hover:bg-amrita-maroon/90 transition flex items-center justify-center flex-1 min-w-[100px] space-x-1.5 font-bold"
                            title="View Registrations"
                        >
                            <FaWpforms size={12} />
                            <span className="text-[11px]">Registrations</span>
                        </Link>
                    )}
            </div>

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
        </div>
    );
}
