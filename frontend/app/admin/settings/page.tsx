"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { systemAPI } from '@/lib/api';
import { FaPlus, FaTrash, FaSave, FaSpinner, FaHistory, FaTags, FaUniversity, FaUsers, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function AdminSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>(null);

    const [categories, setCategories] = useState<string[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [years, setYears] = useState<number[]>([]);

    const [newCategory, setNewCategory] = useState('');
    const [newDepartment, setNewDepartment] = useState('');
    const [newYear, setNewYear] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token || user.role !== 'admin') {
            router.push('/login');
            return;
        }

        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await systemAPI.getSettings();
            const { categories, departments, years } = response.data.data;
            setCategories(categories);
            setDepartments(departments);
            setYears(years);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage({ type: '', text: '' });
            await systemAPI.updateSettings({ categories, departments, years });
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const addItem = (list: any[], setList: Function, value: any, clearInput: Function) => {
        if (!value) return;
        if (list.includes(value)) {
            setMessage({ type: 'error', text: 'Item already exists' });
            return;
        }
        setList([...list, value]);
        clearInput('');
        setMessage({ type: '', text: '' });
    };

    const removeItem = (list: any[], setList: Function, index: number) => {
        const newList = [...list];
        newList.splice(index, 1);
        setList(newList);
    };

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amrita-bgLight">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight text-amrita-textDark">
            <Navbar role="admin" />

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-amrita-maroon mb-2 italic tracking-tight">Settings</h1>
                        <p className="text-amrita-textGray font-medium">Manage system configurations and administrative access</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl font-semibold border-2 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-100 shadow-sm'
                        : 'bg-red-50 text-red-700 border-red-100 shadow-sm'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* ACCORDION ITEM 1: System Configuration */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => toggleSection('system')}
                            className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-amrita-maroon/10 rounded-lg text-amrita-maroon">
                                    <FaTags />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-bold text-amrita-textDark">System Configuration</h2>
                                    <p className="text-sm text-amrita-textGray font-medium">Categories, Departments, and Years</p>
                                </div>
                            </div>
                            {openSection === 'system' ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                        </button>

                        {openSection === 'system' && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex justify-end mb-6">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center justify-center space-x-2 bg-amrita-maroon text-white px-6 py-2 rounded-lg hover:bg-amrita-maroon/90 transition shadow-lg shadow-amrita-maroon/20 disabled:opacity-50 font-bold"
                                    >
                                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Categories */}
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-amrita-maroon mb-4 flex items-center gap-2"><FaTags /> Categories</h3>
                                        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                            {categories.map((cat, index) => (
                                                <div key={cat} className="flex items-center justify-between p-2 bg-amrita-bgLight rounded-lg">
                                                    <span className="font-medium text-sm">{cat}</span>
                                                    <button onClick={() => removeItem(categories, setCategories, index)} className="text-gray-400 hover:text-red-500 p-1"><FaTrash size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add..."
                                                className="flex-1 px-3 py-2 bg-amrita-bgLight border rounded-lg text-sm focus:ring-1 focus:ring-amrita-maroon outline-none"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addItem(categories, setCategories, newCategory, setNewCategory)}
                                            />
                                            <button onClick={() => addItem(categories, setCategories, newCategory, setNewCategory)} className="bg-amrita-maroon text-white p-2 rounded-lg"><FaPlus /></button>
                                        </div>
                                    </div>

                                    {/* Departments */}
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2"><FaUniversity /> Departments</h3>
                                        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                            {departments.map((dept, index) => (
                                                <div key={dept} className="flex items-center justify-between p-2 bg-amrita-bgLight rounded-lg">
                                                    <span className="font-medium text-sm">{dept}</span>
                                                    <button onClick={() => removeItem(departments, setDepartments, index)} className="text-gray-400 hover:text-red-500 p-1"><FaTrash size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add..."
                                                className="flex-1 px-3 py-2 bg-amrita-bgLight border rounded-lg text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                                                value={newDepartment}
                                                onChange={(e) => setNewDepartment(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addItem(departments, setDepartments, newDepartment, setNewDepartment)}
                                            />
                                            <button onClick={() => addItem(departments, setDepartments, newDepartment, setNewDepartment)} className="bg-blue-600 text-white p-2 rounded-lg"><FaPlus /></button>
                                        </div>
                                    </div>

                                    {/* Years */}
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2"><FaHistory /> Academic Years</h3>
                                        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                            {years.map((year, index) => (
                                                <div key={year} className="flex items-center justify-between p-2 bg-amrita-bgLight rounded-lg">
                                                    <span className="font-medium text-sm">Year {year}</span>
                                                    <button onClick={() => removeItem(years, setYears, index)} className="text-gray-400 hover:text-red-500 p-1"><FaTrash size={12} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="Add..."
                                                className="flex-1 px-3 py-2 bg-amrita-bgLight border rounded-lg text-sm focus:ring-1 focus:ring-green-600 outline-none"
                                                value={newYear}
                                                onChange={(e) => setNewYear(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addItem(years, setYears, parseInt(newYear), setNewYear)}
                                            />
                                            <button onClick={() => addItem(years, setYears, parseInt(newYear), setNewYear)} className="bg-green-600 text-white p-2 rounded-lg"><FaPlus /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start space-x-3">
                                    <FaHistory className="text-orange-500 mt-1 flex-shrink-0" />
                                    <p className="text-sm text-orange-800">
                                        <strong>Note:</strong> Changes to these lists will be reflected immediately across the student registration, event creation, and feed filter forms.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACCORDION ITEM 2: Platform Admins */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => toggleSection('admins')}
                            className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                                    <FaUsers />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-bold text-amrita-textDark">Platform Admins</h2>
                                    <p className="text-sm text-amrita-textGray font-medium">Manage admin access and invitations</p>
                                </div>
                            </div>
                            {openSection === 'admins' ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                        </button>

                        {openSection === 'admins' && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                    <div>
                                        <h3 className="text-lg font-bold text-indigo-900 mb-2">Manage Administrators</h3>
                                        <p className="text-indigo-600/80 mb-0 max-w-lg">
                                            View the list of current platform administrators, remove access, or invite new members to the specific admin team.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/admin/admins')}
                                        className="whitespace-nowrap bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center space-x-2 font-bold"
                                    >
                                        <FaUsers />
                                        <span>Go to Admin Management</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
