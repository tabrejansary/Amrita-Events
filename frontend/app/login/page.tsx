'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                if (user.role === 'student') {
                    router.push('/student/feed');
                } else if (user.role === 'club') {
                    router.push('/club/events');
                } else if (user.role === 'admin') {
                    router.push('/admin/pending');
                }
            } catch (error) {
                console.error('Failed to parse user data during auto-redirect:', error);
            }
        }
    }, [router]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');

    const handleResendVerification = async () => {
        if (!formData.email) {
            setError('Please enter your email address first.');
            return;
        }
        setResending(true);
        setError('');
        try {
            await authAPI.resendVerification(formData.email);
            setResendSuccess('Verification email sent! Please check your inbox.');
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResendSuccess('');
        setLoading(true);

        try {
            const response = await authAPI.login(formData);

            // Store token and user data
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data));

            // Redirect based on role
            const role = response.data.data.role;
            if (role === 'student') {
                router.push('/student/feed');
            } else if (role === 'club') {
                router.push('/club/events');
            } else if (role === 'admin') {
                router.push('/admin/pending');
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                setError('Too many login attempts. Please try again after 10 minutes.');
            } else {
                setError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amrita-bgLight to-white flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Link
                            href="/"
                            className="w-20 h-20 rounded-full border-4 border-amrita-maroon flex items-center justify-center p-2 bg-white shadow-xl overflow-hidden transition-transform hover:scale-110 active:scale-95"
                            title="Go to Home"
                        >
                            <img src="/logo.png" alt="Amrita Events Logo" className="w-full h-full object-contain" />
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold text-amrita-maroon mb-2">Amrita Events</h1>
                    <p className="text-amrita-textGray">Login to your account</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                <p>{error}</p>
                                {error.includes('verify your email') && (
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resending}
                                        className="mt-2 text-sm font-bold underline hover:text-red-800 disabled:opacity-50"
                                    >
                                        {resending ? 'Sending...' : 'Resend verification link'}
                                    </button>
                                )}
                            </div>
                        )}

                        {resendSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                {resendSuccess}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                Amrita Email
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="bl.sc.u4cse24063@bl.students.amrita.edu"
                            />
                            <p className="text-xs text-amrita-textGray mt-1">
                                Students: @bl.students.amrita.edu | Faculty: @blr.amrita.edu
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-amrita-textDark">
                                    Password
                                </label>
                                <Link href="/forgot-password" className="text-xs text-amrita-maroon hover:underline font-medium">
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-amrita-textGray">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-amrita-maroon font-semibold hover:underline">
                            Register here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
