'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { formAPI } from '@/lib/api';
import { FaPlus, FaTrash, FaCopy, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import FormBuilder, { FormField } from '@/components/forms/FormBuilder';

export default function FormTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [templateTitle, setTemplateTitle] = useState('');
    const [userRole, setUserRole] = useState<'club' | 'admin' | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setUserRole(user.role);
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await formAPI.getTemplates();
            setTemplates(response.data.data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async (fields: FormField[]) => {
        if (!templateTitle.trim()) {
            alert('Please enter a title for the template');
            return;
        }

        try {
            if (editingTemplate) {
                await formAPI.updateForm(editingTemplate._id, {
                    title: templateTitle,
                    fields: fields
                });
                alert('Template updated successfully!');
            } else {
                await formAPI.createForm({
                    title: templateTitle,
                    fields: fields,
                    isTemplate: true
                });
                alert('Template created successfully!');
            }
            setIsCreating(false);
            setEditingTemplate(null);
            setTemplateTitle('');
            fetchTemplates();
        } catch (error) {
            alert('Failed to save template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await formAPI.deleteForm(id);
            setTemplates(templates.filter(t => t._id !== id));
        } catch (error) {
            alert('Failed to delete template');
        }
    };

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole || 'club'} />

            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-amrita-maroon mb-2">Form Templates</h1>
                        <p className="text-amrita-textGray">Save and reuse registration forms for multiple events</p>
                    </div>
                    {!isCreating && (
                        <button
                            onClick={() => {
                                setIsCreating(true);
                                setEditingTemplate(null);
                                setTemplateTitle('');
                            }}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <FaPlus />
                            <span>Create Template</span>
                        </button>
                    )}
                </div>

                {isCreating ? (
                    <div className="card space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-amrita-maroon">
                                {editingTemplate ? 'Edit Template' : 'New Template'}
                            </h2>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="text-amrita-textGray hover:text-amrita-maroon font-semibold"
                            >
                                Cancel
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Template Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amrita-maroon/20"
                                value={templateTitle}
                                onChange={(e) => setTemplateTitle(e.target.value)}
                                placeholder="e.g., Coding Competition Form"
                            />
                        </div>

                        <FormBuilder
                            initialFields={editingTemplate?.fields}
                            onSave={handleSaveTemplate}
                        />
                    </div>
                ) : (
                    loading ? (
                        <div className="flex justify-center py-12">
                            <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(template => (
                                <div key={template._id} className="card hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-amrita-maroon mb-2">{template.title}</h3>
                                        <p className="text-sm text-amrita-textGray mb-4">
                                            {template.fields.length} questions
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {template.fields.slice(0, 3).map((f: any, i: number) => (
                                                <span key={i} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-amrita-textGray">
                                                    {f.label}
                                                </span>
                                            ))}
                                            {template.fields.length > 3 && (
                                                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-amrita-textGray">
                                                    +{template.fields.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex border-t border-gray-50 pt-4 mt-4 space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditingTemplate(template);
                                                setTemplateTitle(template.title);
                                                setIsCreating(true);
                                            }}
                                            className="flex-1 text-xs py-2 border rounded hover:bg-gray-50 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template._id)}
                                            className="flex-1 text-xs py-2 border border-red-100 text-red-500 rounded hover:bg-red-50 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="col-span-full py-12 text-center text-amrita-textGray card font-italic">
                                    <p className="italic">You haven't saved any templates yet.</p>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            <Footer />
        </div>
    );
}
