'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import EventCard from '@/components/common/EventCard';
import Footer from '@/components/common/Footer';
import AnnouncementBanner from '@/components/common/AnnouncementBanner';
import { clubAPI, eventAPI } from '@/lib/api';
import { FaPlus, FaSpinner, FaTrash, FaWpforms } from 'react-icons/fa';
import Link from 'next/link';
import Pagination from '@/components/common/Pagination';

export default function ClubEventsPage() {
    const router = useRouter();
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
    }, []);

    useEffect(() => {
        fetchMyEvents();
    }, [pagination.page]);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const response = await clubAPI.getMyEvents({
                page: pagination.page,
                limit: pagination.limit
            });

            const { upcoming, completed } = response.data.data;
            setUpcomingEvents(upcoming);
            setPastEvents(completed);

            if (response.data.stats) {
                setStats({
                    ...response.data.stats,
                    total: response.data.pagination.total
                });
            }
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole || 'club'} />
            <AnnouncementBanner />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-amrita-maroon tracking-tight">My Events</h1>
                        <p className="text-amrita-textGray text-sm">Manage your club's events</p>
                    </div>

                    <Link href="/club/create" className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
                        <FaPlus size={12} />
                        <span>Create Event</span>
                    </Link>
                </div>

                {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                    <div className="text-center py-12 card">
                        <p className="text-xl text-amrita-textGray mb-4">
                            You haven't created any events yet
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

            <Footer />
        </div>
    );
}
