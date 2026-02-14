'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { authAPI } from '@/lib/api';
import { FaUser, FaCamera, FaSave, FaSpinner, FaCheckCircle, FaUsers } from 'react-icons/fa';

export default function ClubSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        name: '',
        clubName: '',
        image: null as File | null,
    });
    const [previewUrl, setPreviewUrl] = useState('');

    const [userRole, setUserRole] = useState<'club' | 'admin' | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role === 'admin') {
                router.push('/admin/settings');
                return;
            }
            setUserRole(parsedUser.role);
        }
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await authAPI.getMe();
            const userData = response.data.data;
            setUser(userData);
            setFormData({
                name: userData.name,
                clubName: userData.clubName,
                image: null,
            });
            if (userData.clubLogo) {
                setPreviewUrl(userData.clubLogo);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('clubName', formData.clubName);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const response = await authAPI.updateProfile(data);
            setMessage({ type: 'success', text: 'Club profile updated successfully!' });

            const updatedUser = response.data.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update club profile'
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
            <Navbar role={userRole || 'club'} />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold text-amrita-maroon mb-8 flex items-center gap-3">
                    <FaUsers /> Club Settings
                </h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message.type === 'success' && <FaCheckCircle />}
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Club Logo Section */}
                    <div className="md:col-span-1">
                        <div className="card text-center py-8">
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Club Logo"
                                        className="w-full h-full rounded-lg object-cover border-4 border-amrita-maroon/20"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                        <FaUsers size={48} />
                                    </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <FaCamera className="text-white text-2xl" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <h3 className="font-bold text-amrita-textDark">{user?.clubName}</h3>
                            <p className="text-sm text-amrita-textGray">{user?.email}</p>
                        </div>
                    </div>

                    {/* Club Details Section */}
                    <div className="md:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="card space-y-4">
                                <h2 className="text-xl font-bold text-amrita-textDark border-b pb-2">Club Details</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Club Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-maroon outline-none"
                                            value={formData.clubName}
                                            onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                                            placeholder="e.g., Tech Club"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Lead Organizer Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amrita-maroon outline-none"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">Email (Contact)</label>
                                        <input
                                            type="email"
                                            disabled
                                            className="w-full px-4 py-2 border bg-gray-50 rounded-lg text-gray-400 cursor-not-allowed"
                                            value={user?.email}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed after registration.</p>
                                    </div>
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
