'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { adminAPI } from '@/lib/api';
import { FaUserPlus, FaUsers, FaSpinner, FaEnvelope, FaUser } from 'react-icons/fa';
import Pagination from '@/components/common/Pagination';

export default function AdminManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [admins, setAdmins] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
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
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [pagination.page]);

    const fetchAdmins = async () => {
        try {
            const response = await adminAPI.getAdmins({
                page: pagination.page,
                limit: pagination.limit
            });
            setAdmins(response.data.data);
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    pages: response.data.pagination.pages
                }));
            }
        } catch (err: any) {
            console.error('Failed to fetch admins:', err);
        } finally {
            setPageLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await adminAPI.inviteAdmin(formData);
            setSuccess(response.data.message);
            setFormData({ name: '', email: '' });
            fetchAdmins(); // Refresh the list
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to invite admin');
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
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Invite Form */}
                    <div className="lg:col-span-1">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                                <FaUserPlus />
                                <span>Invite Admin</span>
                            </h1>
                            <p className="text-amrita-textGray">Create a new admin account and send invitation</p>
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

                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-amrita-textDark mb-1">Full Name</label>
                                    <div className="relative">
                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-amrita-textDark mb-1">Email Address</label>
                                    <div className="relative">
                                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="admin@amrita.edu"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : <><FaUserPlus /><span>Send Invitation</span></>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Admin List */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-amrita-maroon mb-2 flex items-center space-x-3">
                                <FaUsers />
                                <span>Platform Admins</span>
                            </h2>
                            <p className="text-amrita-textGray">List of all users with administrative privileges</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-amrita-textDark">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-amrita-textDark">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-amrita-textDark">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {admins.map((admin) => (
                                        <tr key={admin._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-amrita-textDark">{admin.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-amrita-textGray">{admin.email}</td>
                                            <td className="px-6 py-4 text-sm text-amrita-textGray">
                                                {new Date(admin.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
