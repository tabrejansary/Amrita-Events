'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import EventCard from '@/components/common/EventCard';
import Footer from '@/components/common/Footer';
import AnnouncementBanner from '@/components/common/AnnouncementBanner';
import { eventAPI } from '@/lib/api';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Pagination from '@/components/common/Pagination';
import { FaFilter, FaSpinner, FaCalendarAlt, FaClock, FaStar, FaGlobeAmericas, FaBookmark, FaHistory, FaCheckSquare } from 'react-icons/fa';

type SectionType = 'trending' | 'upcoming' | 'this-week' | 'featured' | 'general' | 'saved' | 'registered' | 'past';

export default function StudentFeedPage() {
    const router = useRouter();
    const { settings } = useSystemSettings();
    const [user, setUser] = useState<any>(null);
    const [activeSection, setActiveSection] = useState<SectionType>('upcoming'); // Default to upcoming

    const [events, setEvents] = useState<any[]>([]);
    const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [isOnline, setIsOnline] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'admin') {
            router.push('/admin/events');
            return;
        }
        if (parsedUser.role === 'club') {
            router.push('/club/events');
            return;
        }
        setUser(parsedUser);

        // Load initial section and saved event IDs (for bookmark status)
        fetchSavedEventIds();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [activeSection, pagination.page, selectedCategory, selectedDepartment, isOnline]);

    const fetchSavedEventIds = async () => {
        try {
            const res = await eventAPI.getSavedEvents({ limit: 1000 }); // Get many IDs to show bookmark status
            setSavedEventIds(res.data.data.map((e: any) => e._id));
        } catch (err) {
            console.error('Failed to fetch saved event IDs:', err);
        }
    };

    const fetchEvents = async () => {
        setRefreshing(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                category: selectedCategory,
                department: selectedDepartment,
                isOnline: isOnline === '' ? undefined : isOnline
            };

            let response;
            switch (activeSection) {
                case 'trending': response = await eventAPI.getTrendingEvents(params); break;
                case 'upcoming': response = await eventAPI.getUpcomingEvents(params); break;
                case 'this-week': response = await eventAPI.getThisWeekEvents(params); break;
                case 'featured': response = await eventAPI.getFeaturedEvents(params); break;
                case 'general': response = await eventAPI.getGeneralEvents(params); break;
                case 'saved': response = await eventAPI.getSavedEvents(params); break;
                case 'registered': response = await eventAPI.getRegisteredEvents(params); break;
                case 'past': response = await eventAPI.getPastEvents(params); break;
            }

            if (response?.data?.success) {
                setEvents(response.data.data);
                if (response.data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.data.pagination.total,
                        pages: response.data.pagination.pages
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    const handleBookmarkChange = () => {
        fetchSavedEventIds();
        if (activeSection === 'saved') {
            fetchEvents();
        }
    };

    const handleRegisterChange = () => {
        if (activeSection === 'registered') {
            fetchEvents();
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSectionChange = (section: SectionType) => {
        setActiveSection(section);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedDepartment('');
        setIsOnline('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const sections = [
        { id: 'upcoming', label: 'Recommended', icon: <FaCalendarAlt /> },
        { id: 'trending', label: 'Trending', icon: <FaStar className="text-amrita-yellow" /> },
        { id: 'registered', label: 'Registered', icon: <FaCheckSquare className="text-green-500" /> },
        { id: 'this-week', label: 'This Week', icon: <FaClock /> },
        { id: 'featured', label: 'Featured', icon: <FaStar /> },
        { id: 'general', label: 'Campus-Wide', icon: <FaGlobeAmericas /> },
        { id: 'saved', label: 'Saved', icon: <FaBookmark /> },
        { id: 'past', label: 'Past', icon: <FaHistory /> },
    ];



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight text-amrita-textDark">
            <Navbar role="student" />
            <AnnouncementBanner />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-amrita-maroon tracking-tight">Your Event Feed</h1>
                    <p className="text-amrita-textGray text-sm">
                        Events based on: <span className="text-amrita-textDark font-semibold">
                            {(() => {
                                // Robust parsing for interests
                                let displayInterests: string[] = [];
                                if (user?.interests) {
                                    if (Array.isArray(user.interests)) {
                                        user.interests.forEach((i: any) => {
                                            if (typeof i === 'string') {
                                                // Check if it's a JSON stringified array
                                                if (i.trim().startsWith('[')) {
                                                    try {
                                                        const parsed = JSON.parse(i);
                                                        if (Array.isArray(parsed)) displayInterests.push(...parsed);
                                                        else displayInterests.push(i);
                                                    } catch (e) {
                                                        displayInterests.push(i);
                                                    }
                                                } else {
                                                    displayInterests.push(i);
                                                }
                                            } else {
                                                displayInterests.push(String(i));
                                            }
                                        });
                                    }
                                }
                                return [...new Set(displayInterests)].join(', ');
                            })()}
                        </span>
                    </p>
                </div>

                {/* Section Tabs */}
                <div className="mb-6 overflow-x-auto scrollbar-hide">
                    <div className="flex space-x-2 min-w-max pb-1">
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionChange(section.id as SectionType)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-bold ${activeSection === section.id
                                    ? 'bg-amrita-maroon text-white shadow-md'
                                    : 'bg-white text-amrita-textDark hover:bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <span className={`${activeSection === section.id ? 'text-amrita-yellow' : 'text-amrita-maroon'}`}>
                                    {section.icon}
                                </span>
                                <span>{section.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="card !p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold flex items-center space-x-2 text-amrita-textDark">
                            <FaFilter size={12} className="text-amrita-maroon" />
                            <span className="uppercase tracking-wider">Quick Filters</span>
                        </h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-amrita-bgLight text-amrita-maroon text-[10px] font-bold px-3 py-1 rounded-md hover:bg-amrita-maroon/5 transition uppercase tracking-widest border border-amrita-maroon/10"
                        >
                            {showFilters ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase">Category</label>
                                    <select
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-amrita-maroon focus:outline-none"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {settings.categories.map((cat: string) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase">Department</label>
                                    <select
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-amrita-maroon focus:outline-none"
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                    >
                                        <option value="">All Departments</option>
                                        {settings.departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase">Event Type</label>
                                    <select
                                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-amrita-maroon focus:outline-none"
                                        value={isOnline}
                                        onChange={(e) => setIsOnline(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        <option value="false">Offline</option>
                                        <option value="true">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="text-[10px] text-amrita-maroon font-bold hover:underline uppercase tracking-wider"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Events Grid */}
                {refreshing && !loading ? (
                    <div className="flex justify-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12 card">
                        <p className="text-xl text-amrita-textGray mb-4">
                            No events found in this section
                        </p>
                        <p className="text-amrita-textGray">
                            {activeSection === 'saved'
                                ? 'Start bookmarking events to save them here!'
                                : 'Try changing sections or adjusting your filters'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-amrita-textGray">
                            Showing {events.length} of {pagination.total} event{pagination.total !== 1 ? 's' : ''}
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {events.map(event => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    isBookmarked={savedEventIds.includes(event._id)}
                                    onBookmarkChange={handleBookmarkChange}
                                    onRegisterChange={handleRegisterChange}
                                />
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
