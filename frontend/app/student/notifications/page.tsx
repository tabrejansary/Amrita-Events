'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { notificationAPI } from '@/lib/api';
import { FaBell, FaCheck, FaSpinner, FaTrash } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';
import Pagination from '@/components/common/Pagination';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
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

        setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [pagination.page]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications({
                page: pagination.page,
                limit: pagination.limit
            });
            setNotifications(response.data.data);
            setUnreadCount(response.data.unreadCount || 0);

            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                }));
            }

            // Auto-mark all as read after a short delay to ensure the UI has time to show them
            if (response.data.unreadCount > 0) {
                setTimeout(async () => {
                    try {
                        await notificationAPI.markAllAsRead();
                        // Trigger navbar update
                        window.dispatchEvent(new Event('notificationsUpdated'));
                        setUnreadCount(0);
                    } catch (err) {
                        console.error('Failed to auto-mark as read:', err);
                    }
                }, 2000); // 2 second delay so user sees them as "new" briefly
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            // Trigger navbar update
            window.dispatchEvent(new Event('notificationsUpdated'));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            // Trigger navbar update
            window.dispatchEvent(new Event('notificationsUpdated'));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const clearAll = async () => {
        if (!confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
        try {
            await notificationAPI.deleteAll();
            setNotifications([]);
            setUnreadCount(0);
            setPagination(prev => ({ ...prev, total: 0, pages: 1, page: 1 }));
            // Trigger navbar update
            window.dispatchEvent(new Event('notificationsUpdated'));
        } catch (error) {
            console.error('Failed to clear notifications:', error);
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
            <Navbar role={user?.role} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                                <FaBell />
                                <span>Notifications</span>
                            </h1>
                            <p className="text-amrita-textGray">
                                Keep track of event updates and announcements
                            </p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-amrita-maroon text-sm font-semibold hover:underline flex items-center space-x-1"
                                >
                                    <FaCheck />
                                    <span>Mark read</span>
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-red-600 text-sm font-semibold hover:underline flex items-center space-x-1"
                                >
                                    <FaTrash />
                                    <span>Clear all</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="text-center py-12 card">
                            <p className="text-xl text-amrita-textGray">
                                You have no notifications yet
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`card transition-all ${!notification.read ? 'border-l-4 border-l-amrita-maroon bg-white' : 'opacity-75'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${notification.type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                                                        notification.type === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                                                            notification.type === 'featured' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {notification.type}
                                                    </span>
                                                    <span className="text-xs text-amrita-textGray">
                                                        {formatDate(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <h3 className={`font-bold text-amrita-textDark ${!notification.read ? 'text-lg' : 'text-base'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-amrita-textGray mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification._id)}
                                                    className="text-amrita-maroon hover:bg-amrita-bgLight p-2 rounded-full transition"
                                                    title="Mark as read"
                                                >
                                                    <FaCheck />
                                                </button>
                                            )}
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
            </div>

            <Footer />
        </div>
    );
}
