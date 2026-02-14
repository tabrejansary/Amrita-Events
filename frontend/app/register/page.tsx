'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { CATEGORIES, DEPARTMENTS, YEARS } from '@/lib/constants';
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
        clubName: '',
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

    const handleNext = () => {
        // Validation
        if (step === 1) {
            const isValidEmail = formData.email.endsWith('@bl.students.amrita.edu') ||
                formData.email.endsWith('@blr.amrita.edu') ||
                formData.email.endsWith('@amrita.edu');

            if (!isValidEmail) {
                setError('Please use your Amrita email address (@bl.students.amrita.edu or @blr.amrita.edu)');
                return;
            }
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                setError('Password must be at least 8 characters and contain at least 1 letter, 1 number, and 1 special character');
                return;
            }
        }

        if (step === 2 && formData.role === 'student') {
            if (!formData.department || !formData.year) {
                setError('Please select department and year');
                return;
            }
        }

        if (step === 2 && formData.role === 'club') {
            if (!formData.clubName) {
                setError('Please enter your club name');
                return;
            }
        }

        setError('');
        setStep(step + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            } else {
                data.append('clubName', formData.clubName);
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

                {/* Progress Steps */}
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

                <div className="card">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Basic Information</h2>

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
                                    Students: @bl.students.amrita.edu | Faculty: @blr.amrita.edu
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
                                    I am a
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="club">Club Organizer</option>
                                </select>
                            </div>

                            <button onClick={handleNext} className="w-full btn-primary py-3">
                                Next
                            </button>
                        </div>
                    )}

                    {/* Step 2: Role-Specific Info */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">
                                {formData.role === 'student' ? 'Academic Information' : 'Club Information'}
                            </h2>

                            {formData.role === 'student' && (
                                <>
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
                                </>
                            )}

                            {formData.role === 'club' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                            Club Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                            value={formData.clubName}
                                            onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                                            placeholder="e.g., Tech Club, Cultural Committee"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-amrita-textDark mb-2">
                                            Club Logo (Optional)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amrita-maroon file:text-white hover:file:bg-amrita-maroon/90"
                                            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex space-x-4">
                                <button onClick={() => setStep(1)} className="flex-1 btn-secondary py-3">
                                    Back
                                </button>
                                <button onClick={handleNext} className="flex-1 btn-primary py-3">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Interests (Students Only) */}
                    {step === 3 && formData.role === 'student' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Select Your Interests</h2>
                            <p className="text-amrita-textGray">
                                Choose at least one category. You'll only see events matching your interests.
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
                                    className="flex-1 btn-primary py-3 disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Complete Registration (Club) */}
                    {step === 3 && formData.role === 'club' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-amrita-textDark">Complete Registration</h2>
                            <p className="text-amrita-textGray">
                                Review your information and complete your registration.
                            </p>

                            <div className="bg-amrita-bgLight p-4 rounded-lg space-y-2 text-sm">
                                <p><strong>Name:</strong> {formData.name}</p>
                                <p><strong>Email:</strong> {formData.email}</p>
                                <p><strong>Club:</strong> {formData.clubName}</p>
                            </div>

                            <div className="flex space-x-4">
                                <button type="button" onClick={() => setStep(2)} className="flex-1 btn-secondary py-3">
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 btn-primary py-3 disabled:opacity-50"
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
                                    className="w-full btn-primary px-8 py-3 inline-block font-bold text-lg shadow-m hover:shadow-lg transition duration-200"
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
