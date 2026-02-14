'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();

    // Check if we are on a dashboard page
    const isDashboard = pathname?.startsWith('/admin') ||
        pathname?.startsWith('/club') ||
        pathname?.startsWith('/student');

    if (isDashboard) {
        return (
            <footer className="bg-amrita-bgLight border-t border-gray-200 mt-8">
                <div className="container mx-auto px-4 py-6">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-amrita-maroon mb-3">Amrita Events</h3>
                            <p className="text-amrita-textGray text-sm">
                                All Events, One Place. Your one-stop platform for all campus events at Amrita Vishwa
                                Vidyapeetham, Bengaluru.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-amrita-textDark mb-3">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-amrita-textGray">
                                <li><a href="/about" className="hover:text-amrita-maroon transition">About</a></li>
                                <li><a href="/contact" className="hover:text-amrita-maroon transition">Contact</a></li>
                                <li><a href="/guidelines" className="hover:text-amrita-maroon transition">Event Guidelines</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-amrita-textDark mb-3">Campus</h4>
                            <p className="text-sm text-amrita-textGray">
                                Amrita Vishwa Vidyapeetham<br />
                                Bengaluru Campus<br />
                                Karnataka, India
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-6 text-center text-sm text-amrita-textGray">
                        <p>&copy; 2026 Amrita Events. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        );
    }

    // Default Footer (Landing, Auth, Static Pages)
    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">

                {/* Links */}
                <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm font-semibold text-amrita-textDark">
                    <a href="/about" className="hover:text-amrita-maroon transition">About</a>
                    <a href="/contact" className="hover:text-amrita-maroon transition">Contact</a>
                    <a href="/guidelines" className="hover:text-amrita-maroon transition">Event Guidelines</a>
                </div>

                {/* Info */}
                <div className="space-y-1 text-amrita-textGray text-sm mb-4">
                    <p className="font-bold text-amrita-maroon">Amrita Vishwa Vidyapeetham</p>
                    <p>Bengaluru Campus</p>
                </div>

                {/* Copyright */}
                <p className="text-xs text-gray-400">
                    &copy; 2026 Amrita Events. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
