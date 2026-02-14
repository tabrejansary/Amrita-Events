'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

import PublicHeader from '@/components/common/PublicHeader';

export default function AboutPage() {
    const [userRole, setUserRole] = useState<'student' | 'club' | 'admin' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUserRole(user.role);
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-amrita-bgLight flex flex-col">
            {!loading && (userRole ? <Navbar role={userRole} /> : <PublicHeader />)}
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
                    <h1 className="text-4xl font-bold text-amrita-maroon mb-6 text-center">About Amrita Events</h1>
                    <div className="prose prose-lg text-amrita-textDark mx-auto">
                        <p className="mb-6">
                            Welcome to <strong>Amrita Events</strong>, the official campus event discovery platform for Amrita Vishwa Vidyapeetham, Bengaluru Campus.
                        </p>
                        <p className="mb-6">
                            Our mission is to connect students with the vibrant life of our campus. From technical workshops and hackathons to cultural festivals and club meetups, Amrita Events brings everything together in one place.
                        </p>
                        <h2 className="text-2xl font-bold text-amrita-maroon mt-8 mb-4">Our Vision</h2>
                        <p className="mb-6">
                            To create a connected, engaged, and dynamic campus community where every student can easily find opportunities to learn, grow, and celebrate.
                        </p>
                        <h2 className="text-2xl font-bold text-amrita-maroon mt-8 mb-4">For Students</h2>
                        <ul className="list-disc pl-6 mb-6 space-y-2">
                            <li>Discover events tailored to your interests.</li>
                            <li>Register for workshops and competitions with a single click.</li>
                            <li>Stay updated with real-time notifications.</li>
                            <li>Track your participation and achievements.</li>
                        </ul>
                        <h2 className="text-2xl font-bold text-amrita-maroon mt-8 mb-4">For Clubs</h2>
                        <ul className="list-disc pl-6 mb-6 space-y-2">
                            <li>Streamline event management and promotion.</li>
                            <li>Reach a wider audience across the campus.</li>
                            <li>Access analytics to improve event engagement.</li>
                        </ul>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
