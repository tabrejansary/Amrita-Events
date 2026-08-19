'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBell, FaCalendarAlt, FaHome, FaCog, FaSignOutAlt, FaUser, FaChartBar, FaWpforms, FaBars, FaTimes } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { authAPI, notificationAPI } from '@/lib/api';

interface NavbarProps {
    role?: 'student' | 'club' | 'admin';
}

export default function Navbar({ role }: NavbarProps) {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await authAPI.getMe();
                    const freshUser = response.data.data;
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } catch (err) {
                    console.error('Failed to sync user data in Navbar:', err);
                }
            }
        };

        fetchUserData();

        if (role) {
            fetchUnreadCount();
            const handleUpdate = () => fetchUnreadCount();
            window.addEventListener('notificationsUpdated', handleUpdate);
            const interval = setInterval(fetchUnreadCount, 60000);

            return () => {
                clearInterval(interval);
                window.removeEventListener('notificationsUpdated', handleUpdate);
            };
        }
    }, [role, pathname]);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getNotifications();
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const getNavLinks = () => {
        if (!role) return [];
        switch (role) {
            case 'student':
                return [
                    { href: '/student/feed', label: 'Events', icon: <FaCalendarAlt /> },
                    { href: '/student/notifications', label: 'Notifications', icon: <FaBell />, showBadge: true },
                    { href: '/student/settings', label: 'Settings', icon: <FaCog /> },
                ];
            case 'club':
                return [
                    { href: '/club/events', label: 'My Events', icon: <FaCalendarAlt /> },
                    { href: '/club/forms', label: 'Form Templates', icon: <FaWpforms /> },
                    { href: '/club/notifications', label: 'Notifications', icon: <FaBell />, showBadge: true },
                    { href: '/club/stats', label: 'Statistics', icon: <FaChartBar /> },
                    { href: '/club/create', label: 'Create Event', icon: <FaHome /> },
                    { href: '/club/settings', label: 'Settings', icon: <FaCog /> },
                ];
            case 'admin':
                return [
                    { href: '/admin/pending', label: 'Pending Events', icon: <FaHome /> },
                    { href: '/admin/events', label: 'All Events', icon: <FaCalendarAlt /> },
                    { href: '/admin/announcements', label: 'Announcements', icon: <FaBell />, showBadge: true },
                    { href: '/admin/stats', label: 'Analytics', icon: <FaChartBar /> },
                    { href: '/admin/settings', label: 'Settings', icon: <FaCog /> },
                ];
            default:
                return [];
        }
    };

    const navLinks = getNavLinks();

    return (
        <nav className="bg-amrita-maroon text-white shadow-md sticky top-0 z-[100]">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden transition-transform group-hover:scale-110 flex-shrink-0">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col justify-center leading-none">
                            <span className="text-lg md:text-xl font-bold tracking-tight whitespace-nowrap leading-tight">Amrita Events</span>
                            <span className="text-amrita-yellow text-[9px] md:text-[10px] font-medium uppercase tracking-widest whitespace-nowrap block leading-tight">All Events, One Place</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1 text-xs font-bold">
                        {role && navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition relative whitespace-nowrap ${pathname === link.href
                                    ? 'bg-amrita-yellow text-amrita-maroon'
                                    : 'hover:bg-white/10 text-white/90 hover:text-white'
                                    }`}
                            >
                                <div className="relative">
                                    {link.icon}
                                    {(link as any).showBadge && unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Side: User & Mobile Toggle */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Profile Info (Desktop) */}
                        <div className="hidden sm:flex items-center space-x-2 border-l border-white/20 pl-4 py-1">
                            <div className="text-right">
                                <p className="text-[10px] md:text-xs font-bold text-amrita-yellow uppercase tracking-wider">{role || 'User'}</p>
                                <p className="text-xs md:text-sm font-medium line-clamp-1 max-w-[140px]" title={role === 'club' ? (user?.club?.name || user?.name) : user?.name}>
                                    {role === 'club' ? (user?.club?.name || user?.name || 'Club') : (user?.name || 'Profile')}
                                </p>
                            </div>
                            {((role === 'club' && user?.club?.logo) || user?.profileImage) ? (
                                <img
                                    src={(role === 'club' && user?.club?.logo) || user?.profileImage}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover border border-white/30"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                                    <FaUser className="text-sm" />
                                </div>
                            )}
                        </div>

                        {/* Logout Button (Desktop) */}
                        <button
                            onClick={handleLogout}
                            className="hidden sm:flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-amrita-yellow text-amrita-maroon rounded-lg hover:brightness-110 transition font-bold shadow-md text-xs md:text-sm"
                        >
                            <FaSignOutAlt className="rotate-180" />
                            <span>Logout</span>
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
                        >
                            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar/Menu */}
            {isMenuOpen && (
                <div className="lg:hidden bg-white text-amrita-textDark border-t border-gray-100 shadow-xl animate-in slide-in-from-top duration-300">
                    <div className="container mx-auto px-4 py-6 space-y-4">
                        {/* Mobile Profile Link */}
                        <div className="flex items-center space-x-4 p-3 bg-amrita-bgLight rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-amrita-maroon/10 flex items-center justify-center overflow-hidden">
                                {(user?.profileImage || (role === 'club' && user?.club?.logo)) ? (
                                    <img src={user.profileImage || user.club?.logo} alt="Profile" className="w-full h-full object-cover" />
                                ) : <FaUser className="text-amrita-maroon" />}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-amrita-textDark">
                                    {role === 'club' ? (user?.club?.name || user?.name || 'Club') : (user?.name || 'My Profile')}
                                </p>
                                <p className="text-xs font-medium text-amrita-textGray uppercase">{role || 'User'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1">
                            {role && navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${pathname === link.href
                                        ? 'bg-amrita-maroon text-white shadow-md'
                                        : 'hover:bg-gray-50 text-amrita-textDark font-medium'
                                        }`}
                                >
                                    <div className="text-lg">{link.icon}</div>
                                    <span>{link.label}</span>
                                    {(link as any).showBadge && unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-auto">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition"
                        >
                            <FaSignOutAlt className="rotate-180" />
                            <span>Logout of Account</span>
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
