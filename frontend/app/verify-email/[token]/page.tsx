'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import Footer from '@/components/common/Footer';

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const verificationAttempted = useRef(false);

    useEffect(() => {
        const verifyEmail = async () => {
            if (verificationAttempted.current) return;
            verificationAttempted.current = true;

            try {
                const response = await authAPI.verifyEmail(token);
                setStatus('success');
                setMessage(response.data.message || 'Your email has been verified successfully!');

                // Automatically redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Email verification failed. The link may be invalid or expired.');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, router]);

    return (
        <div className="min-h-screen bg-amrita-bgLight flex flex-col justify-between">
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center">
                    <div className="flex justify-center mb-4">
                        <Link
                            href="/"
                            className="w-20 h-20 rounded-full border-4 border-amrita-maroon flex items-center justify-center p-2 bg-white shadow-md overflow-hidden transition-transform hover:scale-110 active:scale-95"
                            title="Go to Home"
                        >
                            <img src="/logo.png" alt="Amrita Events Logo" className="w-full h-full object-contain" />
                        </Link>
                    </div>
                    {status === 'loading' ? (
                        <div className="space-y-4">
                            <FaSpinner className="animate-spin text-4xl text-amrita-maroon mx-auto" />
                            <h2 className="text-2xl font-bold text-amrita-textDark">Verifying Your Email...</h2>
                            <p className="text-amrita-textGray">Please wait while we confirm your account.</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="space-y-6">
                            <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-amrita-textDark">Success!</h2>
                            <p className="text-amrita-textGray">{message}</p>
                            <div className="pt-4">
                                <Link
                                    href="/login"
                                    className="w-full btn-primary px-8 py-3 inline-block font-bold text-lg"
                                >
                                    Go to Login
                                </Link>
                            </div>
                            <p className="text-xs text-amrita-textGray mt-4">Redirecting you to login in 3 seconds...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <FaExclamationCircle className="text-6xl text-red-500 mx-auto" />
                            <h2 className="text-2xl font-bold text-amrita-textDark">Verification Failed</h2>
                            <p className="text-amrita-textGray">{message}</p>
                            <div className="pt-4">
                                <Link
                                    href="/login"
                                    className="w-full btn-secondary px-8 py-3 inline-block font-bold text-lg"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
