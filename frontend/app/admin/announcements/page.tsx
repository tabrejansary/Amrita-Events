'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { adminAPI } from '@/lib/api';
import { FaBullhorn, FaPaperPlane, FaSpinner, FaHistory } from 'react-icons/fa';

export default function AdminAnnouncementsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetAudience: 'all',
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

        setPageLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await adminAPI.sendAnnouncement(formData);
            setSuccess(`Announcement sent successfully to ${formData.targetAudience === 'all' ? 'all campus users' : formData.targetAudience + 's'}!`);
            setFormData({ title: '', message: '', targetAudience: 'all' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send announcement');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
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
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                            <FaBullhorn />
                            <span>Campus Announcements</span>
                        </h1>
                        <p className="text-amrita-textGray">
                            Send targeted messages to students and event organizers
                        </p>
                    </div>

                    <div className="card">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Announcement Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Important Change in Event Schedule"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Target Audience
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                >
                                    <option value="all">All Users (Students & Organizers)</option>
                                    <option value="student">Students Only</option>
                                    <option value="club">Event Organizers (Clubs) Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Message Content
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Provide detailed information here..."
                                />
                                <p className="text-xs text-amrita-textGray mt-1">
                                    This message will appear in the notification center for the selected group.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <FaSpinner className="animate-spin" />
                                ) : (
                                    <>
                                        <FaPaperPlane />
                                        <span>Send Announcement</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-xl">
                        <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center space-x-2">
                            <FaBullhorn className="text-blue-600" />
                            <span>Pro-Tip: When to use announcements?</span>
                        </h2>
                        <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                            <li>Emergency campus updates or holidays</li>
                            <li>Major festival or cultural event reminders</li>
                            <li>Important platform policy changes</li>
                            <li>Urgent safety information</li>
                        </ul>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
