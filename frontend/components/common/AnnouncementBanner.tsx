'use client';

import { useEffect, useState } from 'react';
import { notificationAPI } from '@/lib/api';
import { FaBullhorn, FaTimes, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';

export default function AnnouncementBanner() {
    const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLatestAnnouncement();
    }, []);

    const fetchLatestAnnouncement = async () => {
        try {
            const response = await notificationAPI.getNotifications();
            const announcements = response.data.data.filter((n: any) => n.type === 'announcement');

            if (announcements.length > 0) {
                // Get the most recent one
                setLatestAnnouncement(announcements[0]);

                // Only show if not dismissed in this session
                const dismissedId = sessionStorage.getItem('dismissedAnnouncement');
                if (dismissedId !== announcements[0]._id) {
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch announcements for banner:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        if (latestAnnouncement) {
            sessionStorage.setItem('dismissedAnnouncement', latestAnnouncement._id);
        }
        setIsVisible(false);
    };

    if (loading || !isVisible || !latestAnnouncement) return null;

    return (
        <div className="bg-amrita-yellow border-b border-amrita-textDark border-opacity-10 relative overflow-hidden group">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>

            <div className="container mx-auto px-4 py-2 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="bg-amrita-maroon text-white p-1.5 rounded-full animate-bounce-subtle shrink-0">
                        <FaBullhorn className="text-xs" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 overflow-hidden">
                        <span className="font-bold text-amrita-maroon text-sm whitespace-nowrap">IMPORTANT NOTICE:</span>
                        <span className="text-amrita-textDark text-sm truncate font-medium">
                            {latestAnnouncement.title} - {latestAnnouncement.message.substring(0, 100)}
                            {latestAnnouncement.message.length > 100 ? '...' : ''}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 ml-4">
                    <Link
                        href={latestAnnouncement.role === 'admin' ? '/admin/announcements' : '/student/notifications'}
                        className="text-amrita-maroon hover:underline text-xs font-bold flex items-center space-x-1"
                    >
                        <span>View All</span>
                        <FaChevronRight className="text-[10px]" />
                    </Link>
                    <button
                        onClick={handleDismiss}
                        className="text-amrita-maroon hover:bg-amrita-maroon hover:bg-opacity-10 p-1.5 rounded-full transition"
                        title="Dismiss"
                    >
                        <FaTimes className="text-xs" />
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
