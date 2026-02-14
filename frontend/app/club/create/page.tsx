'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { eventAPI } from '@/lib/api';
import { CATEGORIES, DEPARTMENTS } from '@/lib/constants';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import FormBuilder, { FormField } from '@/components/forms/FormBuilder';
import { formAPI } from '@/lib/api';
import { FaWpforms } from 'react-icons/fa';

export default function CreateEventPage() {
    const router = useRouter();
    const { settings } = useSystemSettings();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterPreview, setPosterPreview] = useState<string>('');
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [contactList, setContactList] = useState<{ name: string; phone: string }[]>([{ name: '', phone: '' }]);
    const [userRole, setUserRole] = useState<'club' | 'admin'>('club');
    const [useInternalRegistration, setUseInternalRegistration] = useState(false);
    const [customFormFields, setCustomFormFields] = useState<FormField[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        department: 'All',
        venue: '',
        eventDate: '',
        eventTime: '',
        registrationLink: '',
        isOnline: false,
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.role === 'admin' || user.role === 'club') {
                setUserRole(user.role);
            } else {
                router.push('/');
            }
        } else {
            router.push('/login');
        }
        setPageLoading(false);
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await formAPI.getTemplates();
            setTemplates(res.data.data);
        } catch (err) {
            console.error('Failed to fetch templates');
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        if (templateId) {
            const template = templates.find(t => t._id === templateId);
            if (template) {
                setCustomFormFields(template.fields);
            }
        }
    };

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPosterFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPosterPreview(url);
        } else {
            setPosterPreview('');
        }
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            // 1. Deduplicate within the new selection itself
            const uniqueSelection = selectedFiles.filter((file, index, self) =>
                index === self.findIndex((f) => (
                    f.name === file.name && f.size === file.size
                ))
            );

            // 2. Filter against already staged files
            const newUniqueFiles = uniqueSelection.filter(newFile =>
                !galleryFiles.some(existingFile =>
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                )
            );

            if (newUniqueFiles.length !== selectedFiles.length) {
                alert(`Skipped ${selectedFiles.length - newUniqueFiles.length} duplicate file(s).`);
            }

            if (newUniqueFiles.length > 0) {
                setGalleryFiles(prev => [...prev, ...newUniqueFiles]);
                const newPreviews = newUniqueFiles.map(file => URL.createObjectURL(file));
                setGalleryPreviews(prev => [...prev, ...newPreviews]);
            }

            // Critical: Reset the input value so the same file can be selected again if user deleted it and wants to re-add
            e.target.value = '';
        }
    };

    const removeGalleryFile = (idx: number) => {
        setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
        URL.revokeObjectURL(galleryPreviews[idx]);
        setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleContactChange = (index: number, field: 'name' | 'phone', value: string) => {
        const newContacts = [...contactList];
        newContacts[index][field] = value;
        setContactList(newContacts);
    };

    const addContact = () => {
        setContactList([...contactList, { name: '', phone: '' }]);
    };

    const removeContact = (index: number) => {
        const newContacts = contactList.filter((_, i) => i !== index);
        setContactList(newContacts);
    };

    const handleSaveTemplate = async (fields: FormField[], name: string) => {
        try {
            setLoading(true);
            const res = await formAPI.createForm({
                title: name,
                fields: fields.map(f => ({
                    label: f.label,
                    type: f.type,
                    required: f.required,
                    options: f.options,
                    placeholder: f.placeholder,
                    helpText: f.helpText
                })),
                isTemplate: true
            });
            if (res.data.success) {
                alert('Template saved successfully! You can now select it for future events.');
                fetchTemplates(); // Refresh template list
            }
        } catch (err) {
            console.error('Failed to save template:', err);
            alert('Failed to save template. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value.toString());
            });

            // Filter out empty contacts
            const validContacts = contactList.filter(c => c.name.trim() !== '' && c.phone.trim() !== '');
            if (validContacts.length > 0) {
                form.append('contacts', JSON.stringify(validContacts));
            }

            if (posterFile) {
                form.append('poster', posterFile);
            }

            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => {
                    form.append('gallery', file);
                });
            }

            // Send internal registration flag if enabled
            if (useInternalRegistration) {
                form.append('useInternalRegistration', 'true');

                // If there are custom fields, create the form first
                if (customFormFields.length > 0) {
                    const formResponse = await formAPI.createForm({
                        title: `${formData.title} Registration Form`,
                        fields: customFormFields.map(f => ({
                            label: f.label,
                            type: f.type,
                            required: f.required,
                            options: f.options,
                            placeholder: f.placeholder
                        })),
                        isTemplate: false // This is specific to this event
                    });

                    if (formResponse.data.success) {
                        form.append('customForm', formResponse.data.data._id);
                    }
                }
            } else {
                form.append('useInternalRegistration', 'false');
            }

            await eventAPI.createEvent(form);
            alert(userRole === 'admin' ? 'Special Event created and published successfully!' : 'Event created successfully! It will be visible once approved by admin.');
            router.push(userRole === 'admin' ? '/admin/events' : '/club/events');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl text-amrita-maroon">...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={userRole} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold text-amrita-maroon tracking-tight">{userRole === 'admin' ? 'Create Special Event' : 'Create New Event'}</h1>
                    <p className="text-amrita-textGray text-sm">{userRole === 'admin' ? 'Official event organized by Admin infrastructure' : 'Enter the details of your upcoming event'}</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="card !p-6 space-y-4 mt-6">
                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Event Title *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Annual Hackathon 2026"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Description *</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm leading-relaxed"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Provide detailed information about the event..."
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Category *</label>
                                <select
                                    required
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {settings.categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Department</label>
                                <select
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    {settings.departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Event Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Event Time *</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                    value={formData.eventTime}
                                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Venue *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                placeholder="e.g., Block A, Room 201 or Google Meet Link"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Registration Type</label>
                            <div className="flex space-x-4 mb-4">
                                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${!useInternalRegistration ? 'border-amrita-maroon bg-amrita-maroon/5' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        className="hidden"
                                        checked={!useInternalRegistration}
                                        onChange={() => setUseInternalRegistration(false)}
                                    />
                                    <span className="text-sm font-bold capitalize">External Link</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${useInternalRegistration ? 'border-amrita-maroon bg-amrita-maroon/5' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        className="hidden"
                                        checked={useInternalRegistration}
                                        onChange={() => setUseInternalRegistration(true)}
                                    />
                                    <span className="text-sm font-bold capitalize">Internal Registration Form</span>
                                </label>
                            </div>

                            {!useInternalRegistration ? (
                                <input
                                    type="url"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.registrationLink}
                                    onChange={(e) => setFormData({ ...formData, registrationLink: e.target.value })}
                                    placeholder="https://forms.google.com/..."
                                />
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-amrita-maroon mb-1 uppercase tracking-wider">Start with a Template? (Optional)</label>
                                        <select
                                            className="w-full text-sm p-2 border rounded outline-none focus:ring-1 focus:ring-amrita-maroon"
                                            value={selectedTemplate}
                                            onChange={(e) => handleTemplateSelect(e.target.value)}
                                        >
                                            <option value="">-- Create from Scratch --</option>
                                            {templates.map(t => (
                                                <option key={t._id} value={t._id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <FormBuilder
                                        initialFields={customFormFields}
                                        onSave={(fields) => {
                                            setCustomFormFields(fields);
                                            alert('Form design saved locally for this event!');
                                        }}
                                        onSaveTemplate={handleSaveTemplate}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Event Poster</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-amrita-maroon file:text-white hover:file:bg-amrita-maroon/90"
                                onChange={handlePosterChange}
                            />
                            {posterPreview && (
                                <div className="mt-3 relative w-full aspect-[3/4] max-w-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <img src={posterPreview} alt="Poster Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => { setPosterFile(null); setPosterPreview(''); }}
                                        className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <p className="text-[10px] text-amrita-textGray mt-1 italic">
                                Recommended: 3:4 ratio Portrait (max 5MB)
                            </p>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-1 uppercase tracking-wider">Event Gallery (Past Highlights)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="w-full px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-amrita-textDark hover:file:bg-gray-200"
                                onChange={handleGalleryChange}
                            />
                            <p className="text-[10px] text-amrita-textGray mt-1 italic">
                                Add images/videos from previous iterations of this event.
                            </p>
                            {galleryFiles.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {galleryFiles.map((file, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                            {file.type.startsWith('image/') ? (
                                                <img src={galleryPreviews[idx]} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                                    <div className="bg-amrita-maroon/10 p-2 rounded-full mb-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amrita-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[10px] line-clamp-2 px-1 text-amrita-textDark">{file.name}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeGalleryFile(idx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-amrita-textGray mb-2 uppercase tracking-wider">Event Contacts (Optional)</label>
                            <div className="space-y-2">
                                {contactList.map((contact, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Number"
                                            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amrita-maroon text-sm"
                                            value={contact.phone}
                                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                        />
                                        {contactList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeContact(index)}
                                                className="bg-red-50 text-red-500 px-3 rounded-md hover:bg-red-100 transition"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addContact}
                                className="mt-2 text-[10px] text-amrita-maroon font-bold hover:underline flex items-center uppercase tracking-wider"
                            >
                                + Add Contact
                            </button>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isOnline"
                                checked={formData.isOnline}
                                onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                                className="w-4 h-4 text-amrita-maroon"
                            />
                            <label htmlFor="isOnline" className="ml-2 text-sm font-semibold">
                                This is an online event
                            </label>
                        </div>

                        <div className="flex space-x-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 btn-secondary py-2 text-sm font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-primary py-2 text-sm font-bold shadow-md disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Create Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
