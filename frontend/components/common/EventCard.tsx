'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { formatDate, truncateText, generateGoogleCalendarLink } from '@/lib/utils';
import { FaMapMarkerAlt, FaCalendarAlt, FaEye, FaUserFriends, FaBookmark, FaRegBookmark, FaCheckSquare } from 'react-icons/fa';
import { eventAPI } from '@/lib/api';

interface Event {
    _id: string;
    title: string;
    description: string;
    category: string;
    venue: string;
    eventDate: string;
    eventTime: string;
    posterImage?: string;
    organizerName: string;
    isFeatured?: boolean;
    views?: number;
    registrations?: number;
    isRegistered?: boolean;
    status?: string;
}

interface EventCardProps {
    event: Event;
    showAnalytics?: boolean;
    isBookmarked?: boolean;
    onBookmarkChange?: () => void;
    onRegisterChange?: () => void;
}

export default function EventCard({ event, showAnalytics = false, isBookmarked: initialBookmarked = false, onBookmarkChange, onRegisterChange }: EventCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [isRegistered, setIsRegistered] = useState(event.isRegistered || false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setIsBookmarked(initialBookmarked);
        setIsRegistered(event.isRegistered || false);

        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setUserRole(user.role);
            if (user.registeredEvents && user.registeredEvents.includes(event._id)) {
                setIsRegistered(true);
            }
        }
    }, [initialBookmarked, event.isRegistered, event._id]);

    const handleBookmarkToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setBookmarkLoading(true);
        try {
            const response = await eventAPI.toggleBookmark(event._id);
            setIsBookmarked(response.data.bookmarked);
            if (onBookmarkChange) {
                onBookmarkChange();
            }
        } catch (error) {
            console.error('Failed to toggle bookmark:', error);
        } finally {
            setBookmarkLoading(false);
        }
    };

    return (
        <Link href={`/events/${event._id}`}>
            <div className="card hover:shadow-md transition cursor-pointer relative group !p-2.5">
                {event.isFeatured && (
                    <div className="absolute top-0 right-0 bg-amrita-yellow text-amrita-maroon text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-sm">
                        FEATURED
                    </div>
                )}
                {event.status === 'completed' && (
                    <div className="absolute top-0 right-0 bg-gray-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 shadow-sm">
                        COMPLETED
                    </div>
                )}

                {/* Bookmark Button */}
                {userRole === 'student' && (
                    <button
                        onClick={handleBookmarkToggle}
                        disabled={bookmarkLoading}
                        className="absolute top-2 left-2 z-10 bg-white shadow-sm hover:shadow-md p-1.5 rounded-lg transition"
                        title={isBookmarked ? 'Remove bookmark' : 'Save event'}
                    >
                        {isBookmarked ? (
                            <FaBookmark className="text-amrita-maroon text-xs" />
                        ) : (
                            <FaRegBookmark className="text-amrita-textGray text-xs" />
                        )}
                    </button>
                )}

                {/* Event Poster */}
                {event.posterImage && (
                    <div className="relative w-full aspect-[4/5] md:aspect-[3/4] mb-3 rounded-md overflow-hidden bg-gray-100">
                        <Image
                            src={event.posterImage}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Event Details */}
                <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-amrita-textDark line-clamp-1 group-hover:text-amrita-maroon transition-colors">{event.title}</h3>
                        <span className="bg-amrita-maroon/5 text-amrita-maroon text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap uppercase tracking-wider">
                            {event.category}
                        </span>
                    </div>

                    <p className="text-amrita-textGray text-[11px] leading-relaxed line-clamp-2">
                        {truncateText(event.description, 80)}
                    </p>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-amrita-textGray font-medium">
                        <div className="flex items-center space-x-1">
                            <FaCalendarAlt className="text-amrita-maroon/70" />
                            <span>{formatDate(event.eventDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <FaMapMarkerAlt className="text-amrita-maroon/70" />
                            <span className="line-clamp-1">{event.venue}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                        <span className="text-[10px] text-amrita-textGray font-medium italic">by {event.organizerName}</span>

                        {userRole === 'student' && event.status === 'completed' && (
                            <div className="flex items-center space-x-1 text-gray-400 text-[10px] font-bold uppercase">
                                <FaCheckSquare size={10} />
                                <span>Ended</span>
                            </div>
                        )}

                        {(userRole === 'admin' || userRole === 'club') && (
                            <div className="flex items-center text-[10px] text-amrita-maroon font-bold">
                                <FaUserFriends size={12} className="mr-1" />
                                <span>{event.registrations || 0}</span>
                            </div>
                        )}
                    </div>

                    {showAnalytics && (
                        <div className="flex items-center space-x-3 pt-2 border-t border-gray-50 text-[10px] text-amrita-textGray font-medium">
                            <div className="flex items-center space-x-1">
                                <FaEye className="text-amrita-maroon/50" />
                                <span>{event.views || 0} hits</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
