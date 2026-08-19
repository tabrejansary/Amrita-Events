'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { formatDate, generateGoogleCalendarLink } from '@/lib/utils';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaBookmark, FaRegBookmark, FaCalendarPlus, FaArrowRight, FaTicketAlt, FaBuilding } from 'react-icons/fa';
import { eventAPI } from '@/lib/api';

interface RegisteredEventCardProps {
    event: any;
    isBookmarked?: boolean;
    onBookmarkChange?: () => void;
}

export default function RegisteredEventCard({ event, isBookmarked: initialBookmarked = false, onBookmarkChange }: RegisteredEventCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

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

    const handleAddToCalendar = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const calLink = generateGoogleCalendarLink(event);
        window.open(calLink, '_blank');
    };

    const isPast = new Date(event.eventDate) < new Date() || event.status === 'completed';

    return (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
            {/* Top accent line */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amrita-maroon w-full"></div>

            <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-stretch">
                {/* Left: Event Poster Thumbnail */}
                <div className="relative w-full md:w-56 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                    {event.posterImage ? (
                        <Image
                            src={event.posterImage}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amrita-maroon/10 to-emerald-100 flex items-center justify-center text-amrita-maroon font-bold text-2xl">
                            {event.title?.[0]?.toUpperCase() || <FaTicketAlt size={32} />}
                        </div>
                    )}

                    {/* Verified Registration Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-emerald-600/95 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow flex items-center space-x-1.5 uppercase tracking-wider">
                        <FaCheckCircle size={11} className="text-emerald-200" />
                        <span>Registered</span>
                    </div>

                    {/* Category pill on poster */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {event.category}
                    </div>

                    {/* Bookmark Button */}
                    <button
                        onClick={handleBookmarkToggle}
                        disabled={bookmarkLoading}
                        className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm shadow p-1.5 rounded-lg transition hover:bg-white text-xs"
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}
                    >
                        {isBookmarked ? (
                            <FaBookmark className="text-amrita-maroon" />
                        ) : (
                            <FaRegBookmark className="text-gray-500" />
                        )}
                    </button>
                </div>

                {/* Center: Detailed Info */}
                <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs text-amrita-textGray font-semibold flex items-center gap-1.5">
                                <span>Organized by</span>
                                <span className="text-amrita-maroon font-bold bg-amrita-maroon/5 px-2 py-0.5 rounded">
                                    {event.organizerName || event.organizer?.name || 'Club'}
                                </span>
                            </span>

                            {isPast && (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Completed
                                </span>
                            )}
                        </div>

                        <Link href={`/events/${event._id}`}>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-amrita-maroon transition-colors line-clamp-1">
                                {event.title}
                            </h3>
                        </Link>

                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {event.description}
                        </p>
                    </div>

                    {/* Metadata Grid Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-xs">
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <FaCalendarAlt className="text-amrita-maroon flex-shrink-0" />
                            <div className="truncate">
                                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Date</span>
                                <span className="font-bold text-gray-800 text-[11px] truncate block">{formatDate(event.eventDate)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <FaClock className="text-amrita-maroon flex-shrink-0" />
                            <div className="truncate">
                                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Time</span>
                                <span className="font-bold text-gray-800 text-[11px] truncate block">{event.eventTime || 'TBA'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <FaMapMarkerAlt className="text-amrita-maroon flex-shrink-0" />
                            <div className="truncate">
                                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Venue</span>
                                <span className="font-bold text-gray-800 text-[11px] truncate block" title={event.venue}>
                                    {event.venue || 'Campus Venue'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <FaBuilding className="text-amrita-maroon flex-shrink-0" />
                            <div className="truncate">
                                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Target</span>
                                <span className="font-bold text-gray-800 text-[11px] truncate block">{event.department || 'All Depts'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Quick Action CTA Column */}
                <div className="md:w-48 flex md:flex-col justify-between md:justify-center gap-2.5 pt-3 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 flex-shrink-0">
                    <Link
                        href={`/events/${event._id}`}
                        className="flex-1 md:flex-none py-2.5 px-4 bg-amrita-maroon text-white font-bold text-xs rounded-xl hover:bg-amrita-maroon/90 transition shadow-sm flex items-center justify-center space-x-1.5"
                    >
                        <span>View Details</span>
                        <FaArrowRight size={11} />
                    </Link>

                    <button
                        type="button"
                        onClick={handleAddToCalendar}
                        className="flex-1 md:flex-none py-2 px-3 bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-100 transition border border-gray-200 flex items-center justify-center space-x-1.5"
                        title="Add to Google Calendar"
                    >
                        <FaCalendarPlus className="text-emerald-600" size={13} />
                        <span>Add to Cal</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
