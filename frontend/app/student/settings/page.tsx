'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { authAPI } from '@/lib/api';
import { DEPARTMENTS, YEARS, CATEGORIES } from '@/lib/constants';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { FaUser, FaCamera, FaSave, FaSpinner, FaCheckCircle } from 'react-icons/fa';

export default function StudentSettingsPage() {
    const router = useRouter();
    const { settings } = useSystemSettings();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        department: '',
        year: 1,
        interests: [] as string[],
        image: null as File | null,
    });
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getMe();
            const userData = response.data.data;
            setUser(userData);
            let fetchedInterests: string[] = [];
            const rawInterests = userData.interests || [];

            // Robust flattened parsing
            if (Array.isArray(rawInterests)) {
                rawInterests.forEach((i: any) => {
                    if (typeof i === 'string') {
                        if (i.trim().startsWith('[')) {
                            try {
                                const parsed = JSON.parse(i);
                                if (Array.isArray(parsed)) {
                                    parsed.forEach(pi => fetchedInterests.push(String(pi).trim()));
                                } else {
                                    fetchedInterests.push(i.trim());
                                }
                            } catch (e) {
                                fetchedInterests.push(i.trim());
                            }
                        } else {
                            fetchedInterests.push(i.trim());
                        }
                    } else {
                        fetchedInterests.push(String(i));
                    }
                });
            }

            // Deduplicate
            fetchedInterests = [...new Set(fetchedInterests)];

            setFormData({
                name: userData.name,
                department: userData.department,
                year: userData.year,
                interests: fetchedInterests,
                image: null,
            });
            console.log('Processed user interests:', fetchedInterests);
            if (userData.profileImage) {
                setPreviewUrl(userData.profileImage);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleInterestToggle = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('department', formData.department);
            data.append('year', formData.year.toString());
            data.append('interests', JSON.stringify(formData.interests));
            if (formData.image) {
                data.append('image', formData.image);
            }

            const response = await authAPI.updateProfile(data);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Update local storage user data
            const updatedUser = response.data.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Clear message after 3 seconds
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role="student" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold text-amrita-maroon mb-8 flex items-center gap-3">
                    <FaUser /> Account Settings
                </h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message.type === 'success' && <FaCheckCircle />}
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Profile Image Section */}
                    <div className="md:col-span-1">
                        <div className="card text-center py-8">
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover border-4 border-amrita-maroon/20"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                        <FaUser size={48} />
                                    </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <FaCamera className="text-white text-2xl" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <h3 className="font-bold text-amrita-textDark">{user?.name}</h3>
                            <p className="text-sm text-amrita-textGray break-all px-2">{user?.email}</p>
                        </div>
                    </div>

                    {/* Basic Info Section */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="card space-y-4">
                                <h2 className="text-xl font-bold text-amrita-textDark border-b pb-2">Personal Information</h2>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-maroon outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Department</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-maroon outline-none"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            {settings.departments.filter(d => d !== 'All').map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Year</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-maroon outline-none"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        >
                                            {settings.years.map(year => (
                                                <option key={year} value={year}>Year {year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="card space-y-4">
                                <h2 className="text-xl font-bold text-amrita-textDark border-b pb-2">My Interests</h2>
                                <p className="text-sm text-amrita-textGray">Tailor your event feed by selecting what you love.</p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {settings.categories.map(category => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => handleInterestToggle(category)}
                                            className={`px-3 py-2 text-sm rounded-full border-2 transition-all text-center ${formData.interests.includes(category)
                                                ? 'border-amrita-maroon bg-amrita-maroon text-white'
                                                : 'border-gray-200 text-amrita-textDark hover:border-amrita-maroon'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary px-8 py-3 flex items-center gap-2 font-bold shadow-lg disabled:opacity-50"
                                >
                                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
