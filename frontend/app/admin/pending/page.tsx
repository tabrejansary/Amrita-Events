'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import EventCard from '@/components/common/EventCard';
import Footer from '@/components/common/Footer';
import { adminAPI } from '@/lib/api';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import Pagination from '@/components/common/Pagination';

export default function AdminPendingPage() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
        if (user.role !== 'admin') {
            router.push('/');
            return;
        }
    }, []);

    useEffect(() => {
        fetchPendingEvents();
    }, [pagination.page]);

    const fetchPendingEvents = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getPendingEvents({
                page: pagination.page,
                limit: pagination.limit
            });
            setEvents(response.data.data);
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                }));
            }
        } catch (error) {
            console.error('Failed to fetch pending events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleApprove = async (eventId: string) => {
        try {
            await adminAPI.approveEvent(eventId);
            setEvents(events.filter(e => e._id !== eventId));
            alert('Event approved successfully!');
        } catch (error) {
            alert('Failed to approve event');
        }
    };

    const handleReject = async (eventId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await adminAPI.rejectEvent(eventId, reason);
            setEvents(events.filter(e => e._id !== eventId));
            alert('Event rejected');
        } catch (error) {
            alert('Failed to reject event');
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
            <Navbar role="admin" />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-amrita-maroon mb-2">Pending Events</h1>
                <p className="text-amrita-textGray mb-8">Review and moderate events awaiting approval</p>

                {events.length === 0 ? (
                    <div className="text-center py-12 card">
                        <p className="text-xl text-amrita-textGray">
                            No pending events to review
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {events.map(event => (
                                <div key={event._id} className="flex flex-col">
                                    <EventCard event={event} />
                                    <div className="mt-2 flex space-x-2">
                                        <button
                                            onClick={() => handleApprove(event._id)}
                                            className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition flex items-center justify-center space-x-1.5 font-bold text-[11px]"
                                        >
                                            <FaCheck size={10} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleReject(event._id)}
                                            className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition flex items-center justify-center space-x-1.5 font-bold text-[11px]"
                                        >
                                            <FaTimes size={10} />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
}
