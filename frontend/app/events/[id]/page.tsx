'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { eventAPI } from '@/lib/api';
import { formatDate, generateGoogleCalendarLink } from '@/lib/utils';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaExternalLinkAlt, FaSpinner, FaEdit, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import Image from 'next/image';
import GalleryGrid from '@/components/events/GalleryGrid';
import FormRenderer from '@/components/forms/FormRenderer';
import { formAPI, registrationAPI } from '@/lib/api';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formFields, setFormFields] = useState<any[]>([]);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        setUser(JSON.parse(userData));
        fetchEvent();
    }, [params.id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await eventAPI.getEvent(params.id as string);
            const eventData = response.data.data;
            setEvent(eventData);

            // Fetch form if internal registration is enabled
            if (eventData.useInternalRegistration && eventData.customForm) {
                try {
                    setFormLoading(true);
                    const formId = typeof eventData.customForm === 'string' ? eventData.customForm : eventData.customForm._id;
                    const formRes = await formAPI.getFormById(formId);
                    setFormFields(formRes.data.data.fields);
                } catch (err) {
                    console.error('Failed to fetch form fields:', err);
                } finally {
                    setFormLoading(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch event:', error);
        } finally {
            setLoading(false);
        }
    };

    const isRegistered = user?.registeredEvents?.includes(event?._id);

    const handleVisitLink = async () => {
        if (!event.registrationLink) {
            alert('No registration link available');
            return;
        }

        // Automatically mark as registered if not already
        if (!isRegistered) {
            try {
                await eventAPI.registerForEvent(event._id);
                // Update local state and storage
                const updatedUser = { ...user };
                if (!updatedUser.registeredEvents) updatedUser.registeredEvents = [];
                updatedUser.registeredEvents.push(event._id);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setEvent({ ...event, registrations: (event.registrations || 0) + 1 });
            } catch (err) {
                console.error('Auto-registration failed:', err);
            }
        }

        window.open(event.registrationLink, '_blank');
    };

    const handleFormSubmit = async (answers: any[]) => {
        try {
            setRegistering(true);
            const formId = typeof event.customForm === 'string' ? event.customForm : event.customForm._id;

            await registrationAPI.submitRegistration({
                eventId: event._id,
                formId: formId,
                answers: answers
            });

            // Update local state and storage
            setEvent({ ...event, registrations: (event.registrations || 0) + 1 });
            const updatedUser = { ...user };
            if (!updatedUser.registeredEvents) updatedUser.registeredEvents = [];
            updatedUser.registeredEvents.push(event._id);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            alert('Registration completed successfully!');
        } catch (error: any) {
            console.error('Registration failed:', error);
            alert(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    const handleToggleRegistration = async () => {
        try {
            setRegistering(true);
            if (isRegistered) {
                await eventAPI.unregisterFromEvent(event._id);

                // Update local state
                setEvent({ ...event, registrations: Math.max(0, (event.registrations || 0) - 1) });

                const updatedUser = { ...user };
                if (updatedUser.registeredEvents) {
                    updatedUser.registeredEvents = updatedUser.registeredEvents.filter((id: string) => id !== event._id);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                }
            } else {
                await eventAPI.registerForEvent(event._id);

                // Update local state
                setEvent({ ...event, registrations: (event.registrations || 0) + 1 });

                const updatedUser = { ...user };
                if (!updatedUser.registeredEvents) updatedUser.registeredEvents = [];
                updatedUser.registeredEvents.push(event._id);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            }
        } catch (error: any) {
            console.error('Failed to toggle registration status:', error);
            alert(error.response?.data?.message || 'Action failed');
        } finally {
            setRegistering(false);
        }
    };

    const handleAddToCalendar = () => {
        const calendarLink = generateGoogleCalendarLink(event);
        window.open(calendarLink, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-amrita-maroon" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-xl text-amrita-textGray">Event not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amrita-bgLight">
            <Navbar role={user?.role} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Event Poster */}
                    {event.posterImage && (
                        <div className="flex justify-center mb-6">
                            <div className="relative w-full max-w-[400px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-gray-100">
                                <Image
                                    src={event.posterImage}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                />
                                {event.isFeatured && (
                                    <div className="absolute top-3 right-3 bg-amrita-yellow text-amrita-maroon font-bold text-[10px] px-3 py-1 rounded-md shadow-sm">
                                        FEATURED
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="card space-y-4 !p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-amrita-textDark leading-tight mb-1">{event.title}</h1>
                                <p className="text-amrita-textGray text-sm">Organized by <span className="font-semibold text-amrita-maroon">{event.organizerName}</span></p>
                            </div>
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                                <span className="bg-amrita-maroon/5 text-amrita-maroon text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {event.category}
                                </span>
                                {(event.organizer && (
                                    user?._id === (typeof event.organizer === 'object' ? event.organizer._id : event.organizer) ||
                                    user?.id === (typeof event.organizer === 'object' ? event.organizer.id : event.organizer) ||
                                    (user?.role === 'admin' && event.organizerName?.toLowerCase() === 'admin')
                                )) && (
                                        <button
                                            onClick={() => router.push(`/events/${event._id}/edit`)}
                                            className="flex items-center gap-2 text-amrita-maroon hover:bg-amrita-maroon/5 text-xs px-3 py-1.5 rounded-lg border border-amrita-maroon/30 transition font-bold"
                                        >
                                            <FaEdit size={12} /> <span>Edit</span>
                                        </button>
                                    )}
                            </div>
                        </div>

                        {/* Event Info */}
                        <div className="grid md:grid-cols-2 gap-4 py-6 border-y border-gray-200">
                            <div className="flex items-start space-x-3">
                                <FaCalendarAlt className="text-amrita-maroon text-xl mt-1" />
                                <div>
                                    <p className="font-semibold text-amrita-textDark">Date</p>
                                    <p className="text-amrita-textGray">{formatDate(event.eventDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <FaClock className="text-amrita-maroon text-xl mt-1" />
                                <div>
                                    <p className="font-semibold text-amrita-textDark">Time</p>
                                    <p className="text-amrita-textGray">{event.eventTime}</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <FaMapMarkerAlt className="text-amrita-maroon text-xl mt-1" />
                                <div>
                                    <p className="font-semibold text-amrita-textDark">Venue</p>
                                    <p className="text-amrita-textGray">{event.venue}</p>
                                    {event.isOnline && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 inline-block">
                                            Online Event
                                        </span>
                                    )}
                                </div>
                            </div>

                            {(user?.role === 'admin' || user?.role === 'club') && (
                                <div className="flex items-start space-x-3">
                                    <FaExternalLinkAlt className="text-amrita-maroon text-xl mt-1" />
                                    <div>
                                        <p className="font-semibold text-amrita-textDark">Engagement</p>
                                        <p className="text-amrita-textGray">
                                            {event.views} views • {event.registrations} registrations
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-lg font-bold text-amrita-textDark mb-2 flex items-center">
                                <span className="w-1 h-5 bg-amrita-maroon rounded-full mr-2"></span>
                                About this Event
                            </h2>
                            <p className="text-amrita-textGray text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
                        </div>

                        {/* Contacts Section */}
                        {event.contacts && event.contacts.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-amrita-textDark mb-3 flex items-center">
                                    <span className="w-1 h-5 bg-amrita-maroon rounded-full mr-2"></span>
                                    Contact Information
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {event.contacts.map((contact: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-amrita-bgLight rounded-lg border border-gray-100">
                                            <span className="text-xs font-bold text-amrita-textDark">{contact.name}</span>
                                            <a href={`tel:${contact.phone}`} className="text-xs font-bold text-amrita-maroon hover:underline">
                                                {contact.phone}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Event Gallery */}
                        {event.gallery && event.gallery.length > 0 && (
                            <GalleryGrid items={event.gallery} />
                        )}

                        {/* Action Buttons */}
                        <div className="pt-4 mt-2">
                            {!event.useInternalRegistration ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {event.registrationLink && user?.role === 'student' && (
                                        <button
                                            onClick={handleVisitLink}
                                            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center space-x-2 shadow-md"
                                        >
                                            <FaExternalLinkAlt size={14} />
                                            <span>External Registration</span>
                                        </button>
                                    )}

                                    {user?.role === 'student' && isRegistered && (
                                        <div className="flex-1 bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-sm font-bold">
                                            <FaCheckSquare size={14} />
                                            <span>Already Registered</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAddToCalendar}
                                        className="flex-1 btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
                                    >
                                        <FaCalendarAlt size={14} />
                                        <span>Add to Calendar</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    {user?.role !== 'student' || isRegistered ? (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {isRegistered && (
                                                <div className="flex-1 bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-lg flex items-center justify-center space-x-2 text-sm font-bold">
                                                    <FaCheckSquare size={14} />
                                                    <span>Already Registered</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleAddToCalendar}
                                                className="flex-1 btn-secondary py-2.5 text-sm flex items-center justify-center gap-2"
                                            >
                                                <FaCalendarAlt size={14} />
                                                <span>Add to Calendar</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                            <h3 className="text-base font-bold text-amrita-maroon mb-4 flex items-center">
                                                <FaCheckSquare size={16} className="mr-2" />
                                                Registration Form
                                            </h3>
                                            {formLoading ? (
                                                <div className="flex justify-center p-4">
                                                    <FaSpinner className="animate-spin text-amrita-maroon" />
                                                </div>
                                            ) : (
                                                <FormRenderer
                                                    fields={formFields}
                                                    onSubmit={handleFormSubmit}
                                                    isLoading={registering}
                                                    footer={
                                                        <button
                                                            type="button"
                                                            onClick={handleAddToCalendar}
                                                            className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <FaCalendarAlt size={14} />
                                                            <span>Add to Calendar</span>
                                                        </button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => router.back()}
                            className="text-amrita-maroon hover:underline text-sm"
                        >
                            ← Back to Events
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
