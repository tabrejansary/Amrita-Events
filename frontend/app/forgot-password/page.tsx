'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Footer from '@/components/common/Footer';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await authAPI.forgotPassword(email);
            setSubmitted(true);
            setMessage('If an account exists with that email, a password reset link has been sent.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-amrita-bgLight flex flex-col justify-between">
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-center mb-4">
                        <Link
                            href="/"
                            className="w-20 h-20 rounded-full border-4 border-amrita-maroon flex items-center justify-center p-2 bg-white shadow-md overflow-hidden transition-transform hover:scale-110 active:scale-95"
                            title="Go to Home"
                        >
                            <img src="/logo.png" alt="Amrita Events Logo" className="w-full h-full object-contain" />
                        </Link>
                    </div>
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-amrita-maroon">
                            Forgot Password
                        </h2>
                        <p className="mt-2 text-center text-sm text-amrita-textGray">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {submitted ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-3">
                                <FaCheckCircle className="mt-1 flex-shrink-0" />
                                <p className="text-sm">{message}</p>
                            </div>
                            <Link
                                href="/login"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-amrita-maroon hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amrita-maroon transition duration-200"
                            >
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-3">
                                    <FaExclamationCircle className="mt-1 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email-address" className="block text-sm font-semibold text-amrita-textDark mb-1">
                                    Amrita Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <FaEnvelope />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amrita-maroon focus:border-transparent sm:text-sm transition duration-200"
                                        placeholder="e.g., student@bl.students.amrita.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-amrita-maroon hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amrita-maroon transition duration-200 disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>

                            <div className="text-center">
                                <Link href="/login" className="inline-flex items-center space-x-2 text-sm font-medium text-amrita-maroon hover:underline transition duration-200">
                                    <FaArrowLeft className="text-xs" />
                                    <span>Back to Login</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
