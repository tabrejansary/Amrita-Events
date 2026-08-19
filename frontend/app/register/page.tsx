'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Footer from '@/components/common/Footer';

export default function RegisterPage() {
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

    const { settings } = useSystemSettings();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        year: 1,
        interests: [] as string[],
        image: null as File | null,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const validateStep1 = () => {
        const isValidEmail = formData.email.endsWith('@bl.students.amrita.edu') ||
            formData.email.endsWith('@blr.amrita.edu') ||
            formData.email.endsWith('@amrita.edu') ||
            formData.email.endsWith('@gmail.com');

        if (!isValidEmail) {
            setError('Please use your Amrita email address (@bl.students.amrita.edu, @blr.amrita.edu, or @gmail.com for testing)');
            return false;
        }

        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be at least 8 characters and contain at least 1 letter, 1 number, and 1 special character');
            return false;
        }

        setError('');
        return true;
    };

    const handleNext = () => {
        if (!validateStep1()) return;

        if (step === 1) {
            if (formData.role === 'club') {
                // Submit directly for club users
                handleRegisterSubmit();
                return;
            }
            setStep(2);
            return;
        }

        if (step === 2 && formData.role === 'student') {
            if (!formData.department || !formData.year) {
                setError('Please select department and year');
                return;
            }
            setError('');
            setStep(3);
        }
    };

    const handleRegisterSubmit = async () => {
        if (formData.role === 'student' && formData.interests.length === 0) {
            setError('Please select at least one interest');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('role', formData.role);

            if (formData.role === 'student') {
                data.append('department', formData.department);
                data.append('year', formData.year.toString());
                data.append('interests', JSON.stringify(formData.interests));
            }

            if (formData.image) {
                data.append('image', formData.image);
            }

            await authAPI.register(data);
            setStep(4);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleRegisterSubmit();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amrita-bgLight to-white flex flex-col justify-between">
            <div className="max-w-2xl w-full mx-auto px-4 py-12 flex-grow">
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
                    <h1 className="text-4xl font-bold text-amrita-maroon mb-2">Join Amrita Events</h1>
                    <p className="text-amrita-textGray">Create your account to get started</p>
                </div>

                {/* Progress Steps (shown for student flow) */}
                {formData.role === 'student' && step < 4 && (
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-amrita-maroon text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                1
                            </div>
                            <div className={`w-16 h-1 ${step >= 2 ? 'bg-amrita-maroon' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-amrita-maroon text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                2
                            </div>
                            <div className={`w-16 h-1 ${step >= 3 ? 'bg-amrita-maroon' : 'bg-gray-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-amrita-maroon text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                3
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Account Information</h2>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>

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
                                    placeholder="bl.sc.u4cse24070@bl.students.amrita.edu"
                                />
                                <p className="text-xs text-amrita-textGray mt-1">
                                    @bl.students.amrita.edu | @blr.amrita.edu | @amrita.edu | @gmail.com (for testing)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter your password"
                                />
                                <p className="text-xs text-amrita-textGray mt-1">
                                    Min. 8 characters with at least 1 letter, 1 number, and 1 special character.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    I am registering as:
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon font-semibold"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="club">Club Organizer (Create or Join a Club)</option>
                                </select>
                            </div>

                            {formData.role === 'club' && (
                                <div className="p-3 bg-amrita-maroon/5 rounded-lg border border-amrita-maroon/20">
                                    <p className="text-xs text-amrita-maroon font-medium leading-relaxed">
                                        💡 You will be able to create your club or join your team with an invite code right after logging in.
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={loading || !formData.name || !formData.email || !formData.password}
                                className="w-full btn-primary py-3 font-bold disabled:opacity-50"
                            >
                                {formData.role === 'club' ? (loading ? 'Creating Account...' : 'Register as Club Organizer') : 'Next: Academic Info'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Student Academic Info */}
                    {step === 2 && formData.role === 'student' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Academic Information</h2>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Department
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {settings.departments.filter(d => d !== 'All' && d !== 'Other').map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Year
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                >
                                    {settings.years.map(year => (
                                        <option key={year} value={year}>Year {year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                    Profile Picture (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amrita-maroon file:text-white hover:file:bg-amrita-maroon/90"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button onClick={() => setStep(1)} className="flex-1 btn-secondary py-3">
                                    Back
                                </button>
                                <button onClick={handleNext} className="flex-1 btn-primary py-3 font-bold">
                                    Next: Select Interests
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Student Interests */}
                    {step === 3 && formData.role === 'student' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Select Your Interests</h2>
                            <p className="text-amrita-textGray">
                                Choose at least one category to personalize your campus event feed.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {settings.categories.map(category => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => handleInterestToggle(category)}
                                        className={`p-4 rounded-lg border-2 transition text-left ${formData.interests.includes(category)
                                            ? 'border-amrita-maroon bg-amrita-maroon bg-opacity-10'
                                            : 'border-gray-200 hover:border-amrita-maroon'
                                            }`}
                                    >
                                        <div className="font-semibold text-amrita-textDark">{category}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex space-x-4">
                                <button type="button" onClick={() => setStep(2)} className="flex-1 btn-secondary py-3">
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || formData.interests.length === 0}
                                    className="flex-1 btn-primary py-3 font-bold disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 4: Success Message */}
                    {step === 4 && (
                        <div className="text-center space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold text-amrita-textDark">Check Your Email!</h2>
                            <p className="text-amrita-textGray max-w-sm mx-auto text-lg leading-relaxed">
                                We've sent a verification link to <strong>{formData.email}</strong>.
                                Please click the link to verify your account and start using Amrita Events.
                            </p>
                            <div className="pt-6">
                                <Link
                                    href="/login"
                                    className="w-full btn-primary px-8 py-3 inline-block font-bold text-lg shadow-md hover:shadow-lg transition duration-200"
                                >
                                    Go to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {step < 4 && (
                        <div className="mt-6 text-center text-sm text-amrita-textGray">
                            Already have an account?{' '}
                            <Link href="/login" className="text-amrita-maroon font-semibold hover:underline">
                                Login here
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
