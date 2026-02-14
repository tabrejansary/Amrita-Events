'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { eventAPI, formAPI } from '@/lib/api';
import { CATEGORIES, DEPARTMENTS } from '@/lib/constants';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { FaSpinner, FaSave, FaArrowLeft, FaWpforms } from 'react-icons/fa';
import FormBuilder, { FormField } from '@/components/forms/FormBuilder';

export default function EditEventPage() {
    const params = useParams();
    const router = useRouter();
    const { settings } = useSystemSettings();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [posterFile, setPosterFile] = useState<File | null>(null);
    const [posterPreview, setPosterPreview] = useState<string>('');
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [existingGallery, setExistingGallery] = useState<any[]>([]);
    const [galleryIdsToDelete, setGalleryIdsToDelete] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [contactList, setContactList] = useState<{ name: string; phone: string }[]>([{ name: '', phone: '' }]);
    const [useInternalRegistration, setUseInternalRegistration] = useState(false);
    const [customFormFields, setCustomFormFields] = useState<FormField[]>([]);
    const [existingFormId, setExistingFormId] = useState<string | null>(null);
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
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchEventData(parsedUser);
        fetchTemplates();
    }, [params.id]);

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

    const fetchEventData = async (currentUser: any) => {
        try {
            const response = await eventAPI.getEvent(params.id as string);
            const event = response.data.data;

            // Security check: 
            // 1. Any Admin can edit "Admin" (Special) events.
            // 2. Clubs can ONLY edit events they personally created.
            const isAdminEditingSpecialEvent = currentUser.role === 'admin' && event.organizerName === 'Admin';

            let organizerId = null;
            if (event.organizer) {
                organizerId = typeof event.organizer === 'object' ? event.organizer._id : event.organizer;
            }

            const isOwner = organizerId === currentUser._id;

            if (!isOwner && !isAdminEditingSpecialEvent) {
                alert('You are not authorized to edit this event.');
                router.push(`/events/${event._id}`);
                return;
            }

            // Format date for input: YYYY-MM-DD
            const formattedDate = new Date(event.eventDate).toISOString().split('T')[0];

            setFormData({
                title: event.title,
                description: event.description,
                category: event.category,
                department: event.department || 'All',
                venue: event.venue,
                eventDate: formattedDate,
                eventTime: event.eventTime,
                registrationLink: event.registrationLink || '',
                isOnline: event.isOnline || false,
            });

            if (event.useInternalRegistration) {
                setUseInternalRegistration(true);
                if (event.customForm) {
                    if (typeof event.customForm === 'object' && event.customForm.fields) {
                        setExistingFormId(event.customForm._id || event.customForm.id);
                        setCustomFormFields(event.customForm.fields);
                    } else {
                        const formId = typeof event.customForm === 'string' ? event.customForm : (event.customForm._id || event.customForm.id);
                        setExistingFormId(formId);
                        try {
                            const formRes = await formAPI.getFormById(formId);
                            if (formRes.data.success) {
                                setCustomFormFields(formRes.data.data.fields);
                            }
                        } catch (err) {
                            console.error('Failed to fetch custom form fields');
                        }
                    }
                }
            }

            if (event.posterImage) {
                setPosterPreview(event.posterImage);
            }

            if (event.gallery && event.gallery.length > 0) {
                setExistingGallery(event.gallery);
            }

            if (event.contacts && event.contacts.length > 0) {
                setContactList(event.contacts.map((c: any) => ({ name: c.name, phone: c.phone })));
            } else {
                setContactList([{ name: '', phone: '' }]);
            }

            setPageLoading(false);
        } catch (err) {
            console.error('Failed to fetch event:', err);
            setError('Failed to load event data');
            setPageLoading(false);
        }
    };

    const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPosterFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setPosterPreview(url);
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
        setGalleryPreviews(prev => [...prev.filter((_, i) => i !== idx)]);
    };

    const removeExistingGalleryItem = (id: string) => {
        setExistingGallery(prev => prev.filter(item => item._id !== id));
        setGalleryIdsToDelete(prev => [...prev, id]);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                form.append(key, value.toString());
            });

            if (posterFile) {
                form.append('poster', posterFile);
            }

            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => {
                    form.append('gallery', file);
                });
            }

            if (galleryIdsToDelete.length > 0) {
                form.append('galleryIdsToDelete', JSON.stringify(galleryIdsToDelete));
            }

            // Filter out empty contacts
            const validContacts = contactList.filter(c => c.name.trim() !== '' && c.phone.trim() !== '');
            form.append('contacts', JSON.stringify(validContacts));

            // Handle Internal Registration Form updates
            if (useInternalRegistration) {
                form.append('useInternalRegistration', 'true');

                if (customFormFields.length > 0) {
                    const formBody = {
                        title: `${formData.title} Registration Form`,
                        fields: customFormFields.map(f => ({
                            label: f.label,
                            type: f.type,
                            required: f.required,
                            options: f.options,
                            placeholder: f.placeholder,
                            helpText: f.helpText
                        }))
                    };

                    let formId = existingFormId;
                    if (formId) {
                        await formAPI.updateForm(formId, formBody);
                    } else {
                        const formResponse = await formAPI.createForm({ ...formBody, isTemplate: false });
                        if (formResponse.data.success) {
                            formId = formResponse.data.data._id;
                        }
                    }

                    if (formId) {
                        form.append('customForm', formId);
                    }
                }
            } else {
                form.append('useInternalRegistration', 'false');
            }

            await eventAPI.updateEvent(params.id as string, form);
            router.push(`/events/${params.id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update event');
        } finally {
            setLoading(false);
        }
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
                alert('Template saved successfully! You can now select it for other events.');
                fetchTemplates(); // Refresh template list
            }
        } catch (err) {
            console.error('Failed to save template:', err);
            alert('Failed to save template. Please try again.');
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
            <Navbar role={user?.role} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-200 transition"
                        >
                            <FaArrowLeft className="text-amrita-maroon" />
                        </button>
                        <h1 className="text-3xl font-bold text-amrita-maroon">Edit Event</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="card space-y-6 shadow-xl border-t-4 border-amrita-maroon">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Event Title *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Description *</label>
                            <textarea
                                required
                                rows={5}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Category *</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
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
                                <label className="block text-sm font-semibold mb-2">Department</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    {settings.departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Event Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Event Time *</label>
                                <input
                                    type="time"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                    value={formData.eventTime}
                                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Venue *</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
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
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-amrita-maroon uppercase tracking-wider">Configure Registration Form</label>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-bold text-gray-400">Template:</span>
                                            <select
                                                className="text-[10px] font-bold p-1 border rounded bg-white outline-none"
                                                value={selectedTemplate}
                                                onChange={(e) => handleTemplateSelect(e.target.value)}
                                            >
                                                <option value="">Custom</option>
                                                {templates.map(t => (
                                                    <option key={t._id} value={t._id}>{t.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <FormBuilder
                                        key={existingFormId || 'new-form'}
                                        initialFields={customFormFields}
                                        onSave={(fields) => {
                                            setCustomFormFields(fields);
                                            alert('Form design staged! It will be saved when you Save Changes.');
                                        }}
                                        onSaveTemplate={handleSaveTemplate}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Event Poster (Upload new to replace)</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                onChange={handlePosterChange}
                            />
                            {posterPreview && (
                                <div className="mt-4 relative w-full aspect-[3/4] max-w-[400px] rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                                    <img src={posterPreview} alt="Poster Preview" className="w-full h-full object-cover" />
                                    {posterFile && (
                                        <button
                                            type="button"
                                            onClick={() => { setPosterFile(null); setPosterPreview(''); }}
                                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-amrita-textGray mt-1">
                                Recommended: 1080x1440px (Portrait, 3:4 ratio), max 5MB
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">Event Gallery (Upload new to replace gallery)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                onChange={handleGalleryChange}
                            />
                            {/* Combine existing and new gallery items in display */}
                            {(existingGallery.length > 0 || galleryFiles.length > 0) && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {/* Existing Gallery Items */}
                                    {existingGallery.map((item) => (
                                        <div key={item._id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                                            {item.resourceType === 'image' ? (
                                                <img src={item.url} alt="existing" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-black/10">
                                                    <div className="bg-amrita-maroon/80 p-2 rounded-full mb-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[10px] px-1 text-amrita-textDark font-semibold">Existing Video</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeExistingGalleryItem(item._id)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md opacity-100 md:opacity-0 group-hover:opacity-100 transition z-10"
                                                title="Remove existing item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    {/* New Gallery Items */}
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
                            <label className="block text-sm font-semibold mb-2">Event Contacts</label>
                            <div className="space-y-3">
                                {contactList.map((contact, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                            value={contact.name}
                                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amrita-maroon"
                                            value={contact.phone}
                                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                        />
                                        {contactList.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeContact(index)}
                                                className="bg-red-100 text-red-600 px-3 rounded-lg hover:bg-red-200"
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
                                className="mt-2 text-sm text-amrita-maroon font-semibold hover:underline flex items-center"
                            >
                                + Add Another Contact
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

                        <div className="flex ml-auto pt-6 gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn-secondary px-8 py-3"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    );
}
