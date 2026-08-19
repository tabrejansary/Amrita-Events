'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { authAPI, clubAPI } from '@/lib/api';
import { FaUser, FaCamera, FaSave, FaSpinner, FaCheckCircle, FaUsers, FaCopy, FaCheck, FaTrash, FaKey, FaShieldAlt, FaEnvelope, FaPaperPlane, FaTimes } from 'react-icons/fa';

export default function ClubSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [club, setClub] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [copied, setCopied] = useState(false);

    // Email Invite state
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        userName: '',
        clubName: '',
        clubDescription: '',
        logoFile: null as File | null,
    });
    const [previewLogo, setPreviewLogo] = useState('');
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
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch User
            const userRes = await authAPI.getMe();
            const userData = userRes.data.data;
            setUser(userData);

            // Fetch Club
            try {
                const clubRes = await clubAPI.getMyClub();
                const clubData = clubRes.data.data;
                setClub(clubData);
                setFormData({
                    userName: userData.name || '',
                    clubName: clubData.name || '',
                    clubDescription: clubData.description || '',
                    logoFile: null,
                });
                if (clubData.logo) {
                    setPreviewLogo(clubData.logo);
                }
            } catch (err: any) {
                console.warn('No club found or failed to fetch club:', err);
                setFormData(prev => ({
                    ...prev,
                    userName: userData.name || '',
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings data:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, logoFile: file }));
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const copyInviteCode = () => {
        if (club?.inviteCode) {
            navigator.clipboard.writeText(club.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member from your club?')) return;

        try {
            await clubAPI.removeMember(memberId);
            setMessage({ type: 'success', text: 'Member removed from club.' });
            fetchData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove member.' });
        }
    };

    const handleRegenerateCode = async () => {
        if (!confirm('Regenerate invite code? Previous invite codes will no longer work.')) return;

        try {
            const res = await clubAPI.regenerateInviteCode();
            setClub((prev: any) => ({ ...prev, inviteCode: res.data.data.inviteCode }));
            setMessage({ type: 'success', text: 'Invite code refreshed successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to refresh invite code.' });
        }
    };

    const handleSendInviteEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setSendingInvite(true);
        setInviteStatus({ type: '', message: '' });

        try {
            const res = await clubAPI.sendInviteEmail(inviteEmail.trim());
            setInviteStatus({ type: 'success', message: res.data.message || 'Invitation sent successfully!' });
            setInviteEmail('');
            setTimeout(() => {
                setIsEmailModalOpen(false);
                setInviteStatus({ type: '', message: '' });
            }, 2500);
        } catch (err: any) {
            setInviteStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to send invitation email.'
            });
        } finally {
            setSendingInvite(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Update user profile name if changed
            if (formData.userName !== user?.name) {
                const userFormData = new FormData();
                userFormData.append('name', formData.userName);
                await authAPI.updateProfile(userFormData);
            }

            // 2. Update Club info if user belongs to a club
            if (club) {
                const clubFormData = new FormData();
                clubFormData.append('name', formData.clubName);
                clubFormData.append('description', formData.clubDescription);
                if (formData.logoFile) {
                    clubFormData.append('logo', formData.logoFile);
                }
                await clubAPI.updateClub(clubFormData);
            }

            setMessage({ type: 'success', text: 'Club settings updated successfully!' });
            await fetchData();

            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update club settings'
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

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-amrita-maroon flex items-center gap-3">
                            <FaUsers /> Club Settings
                        </h1>
                        <p className="text-amrita-textGray text-sm mt-1">
                            Manage your club profile, team members, and organization details
                        </p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success' && <FaCheckCircle className="text-green-600 flex-shrink-0" />}
                        <span className="font-medium text-sm">{message.text}</span>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Club Brand Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                {previewLogo ? (
                                    <img
                                        src={previewLogo}
                                        alt="Club Logo"
                                        className="w-full h-full rounded-2xl object-cover border-2 border-amrita-maroon/20 shadow-inner"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-2xl bg-amrita-maroon/10 flex items-center justify-center text-amrita-maroon font-bold text-3xl">
                                        {formData.clubName?.[0]?.toUpperCase() || <FaUsers size={40} />}
                                    </div>
                                )}
                                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-semibold">
                                    <FaCamera className="text-xl mb-1" />
                                    <span>Change Logo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </label>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">{formData.clubName || 'My Club'}</h2>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{formData.clubDescription || 'No description provided'}</p>

                            {/* Invite Code Box */}
                            {club?.inviteCode && (
                                <div className="mt-6 p-4 bg-amrita-maroon/5 rounded-xl border border-amrita-maroon/20 text-left">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amrita-maroon flex items-center gap-1">
                                            <FaKey /> Invite Code
                                        </span>
                                        <button
                                            onClick={handleRegenerateCode}
                                            className="text-[10px] text-gray-400 hover:text-amrita-maroon font-semibold underline"
                                        >
                                            Regenerate
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wider">
                                            {club.inviteCode}
                                        </span>
                                        <button
                                            onClick={copyInviteCode}
                                            className="p-1.5 bg-white text-amrita-maroon rounded-lg shadow-sm border border-gray-200 hover:bg-amrita-maroon hover:text-white transition"
                                            title="Copy Code"
                                        >
                                            {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setIsEmailModalOpen(true); setInviteStatus({ type: '', message: '' }); }}
                                        className="w-full py-2 bg-amrita-maroon text-white font-bold text-xs rounded-lg hover:bg-amrita-maroon/90 transition shadow-sm flex items-center justify-center space-x-1.5"
                                    >
                                        <FaEnvelope size={12} />
                                        <span>Send to Member Email</span>
                                    </button>

                                    <p className="text-[11px] text-gray-500 mt-2">
                                        Share this 8-digit code or send an invitation email to let organizers join your dashboard.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Edit Club Details & Personal Info */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                                <FaShieldAlt className="text-amrita-maroon" /> Organization Details
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Club / Committee Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amrita-maroon focus:outline-none text-gray-900"
                                        value={formData.clubName}
                                        onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                                        placeholder="e.g., FACE Club, IEEE Student Branch"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Club Description
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amrita-maroon focus:outline-none text-gray-900"
                                        value={formData.clubDescription}
                                        onChange={(e) => setFormData({ ...formData, clubDescription: e.target.value })}
                                        placeholder="Tell students what your club is about..."
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Your Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amrita-maroon focus:outline-none text-gray-900"
                                            value={formData.userName}
                                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Your Amrita Email
                                        </label>
                                        <input
                                            type="email"
                                            disabled
                                            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed text-sm"
                                            value={user?.email || ''}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary px-8 py-3 flex items-center gap-2 font-bold rounded-xl shadow-md disabled:opacity-50"
                                >
                                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                                </button>
                            </div>
                        </form>

                        {/* Team Members Roster */}
                        {club && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <FaUsers className="text-amrita-maroon" /> Team Members ({club.members?.length || 1})
                                        </h3>
                                        <p className="text-xs text-gray-500">All organizers who have access to post events under this club</p>
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {club.members?.map((member: any) => {
                                        const isOwner = member._id === club.owner?._id || member._id === club.owner;
                                        const isMe = member._id === user?._id;

                                        return (
                                            <div key={member._id} className="py-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-amrita-maroon/10 text-amrita-maroon font-bold flex items-center justify-center text-sm">
                                                        {member.name?.[0]?.toUpperCase() || <FaUser />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm text-gray-900">{member.name}</span>
                                                            {isMe && (
                                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">You</span>
                                                            )}
                                                            {isOwner && (
                                                                <span className="text-[10px] bg-amrita-yellow text-amrita-maroon px-2 py-0.5 rounded-full font-bold">Owner / Lead</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500">{member.email}</span>
                                                    </div>
                                                </div>

                                                {club.isOwner && !isOwner && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        title="Remove Member"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send Invite Email Modal */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center space-x-2.5 text-amrita-maroon">
                                <FaEnvelope className="text-xl" />
                                <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
                            </div>
                            <button
                                onClick={() => setIsEmailModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Send an official invitation email with the <strong>{club?.name}</strong> invite code (<strong>{club?.inviteCode}</strong>) to another club organizer.
                        </p>

                        {inviteStatus.message && (
                            <div className={`p-3 rounded-lg text-xs font-medium mb-4 border flex items-center space-x-2 ${inviteStatus.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                {inviteStatus.type === 'success' ? <FaCheck /> : <span>⚠️</span>}
                                <span>{inviteStatus.message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSendInviteEmail} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Recipient's Amrita Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="teammate@bl.students.amrita.edu"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amrita-maroon focus:outline-none text-sm text-gray-900"
                                />

                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEmailModalOpen(false)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingInvite || !inviteEmail}
                                    className="flex-1 py-2.5 bg-amrita-maroon text-white font-bold rounded-xl text-sm hover:bg-amrita-maroon/90 transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md"
                                >
                                    {sendingInvite ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            <span>Sending Email...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane size={12} />
                                            <span>Send Invite</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
