'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

import PublicHeader from '@/components/common/PublicHeader';

export default function ContactPage() {
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
                    <h1 className="text-4xl font-bold text-amrita-maroon mb-8 text-center">Contact Us</h1>

                    <div className="text-center mt-12 w-full mx-auto">
                        <h2 className="text-2xl font-bold text-amrita-textDark mb-6">Get in Touch</h2>
                        <p className="text-amrita-textGray mb-12">
                            Have questions, suggestions, or need support? We're here to help! Reach out to us through any of the following channels.
                        </p>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-amrita-maroon/10 flex items-center justify-center mb-4">
                                    <FaMapMarkerAlt className="text-amrita-maroon text-2xl" />
                                </div>
                                <h3 className="font-bold text-amrita-textDark mb-2">Address</h3>
                                <p className="text-amrita-textGray text-sm">
                                    Amrita Vishwa Vidyapeetham<br />
                                    Kasavanahalli, Carmelaram P.O.<br />
                                    Bengaluru - 560 035<br />
                                    Karnataka, India
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-amrita-maroon/10 flex items-center justify-center mb-4">
                                    <FaEnvelope className="text-amrita-maroon text-2xl" />
                                </div>
                                <h3 className="font-bold text-amrita-textDark mb-2">Email</h3>
                                <p className="text-amrita-textGray text-sm">
                                    <a href="mailto:pulse@blr.amrita.edu" className="hover:text-amrita-maroon transition">pulse@blr.amrita.edu</a>
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-amrita-maroon/10 flex items-center justify-center mb-4">
                                    <FaPhone className="text-amrita-maroon text-2xl" />
                                </div>
                                <h3 className="font-bold text-amrita-textDark mb-2">Phone</h3>
                                <p className="text-amrita-textGray text-sm">
                                    +91 80 2518 3700
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
