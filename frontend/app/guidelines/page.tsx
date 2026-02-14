'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';

import PublicHeader from '@/components/common/PublicHeader';

export default function GuidelinesPage() {
    const [userRole, setUserRole] = useState<'student' | 'club' | 'admin' | null>(null);
    const [loading, setLoading] = useState(true);

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
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-amrita-bgLight flex flex-col">
            {!loading && (userRole ? <Navbar role={userRole} /> : <PublicHeader />)}
            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
                    <h1 className="text-4xl font-bold text-amrita-maroon mb-6 text-center">Event Guidelines</h1>
                    <p className="text-amrita-textGray text-center mb-10 max-w-2xl mx-auto">
                        To ensure a smooth and successful experience for everyone, please adhere to the following guidelines when organizing or participating in events.
                    </p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-amrita-textDark mb-4 border-b pb-2 border-gray-100">For Event Organizers (Clubs)</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">1. Submission Timeline</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">All events must be submitted for approval at least <strong>7 days</strong> prior to the event date. Late submissions may not be reviewed in time.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">2. Accurate Details</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">Ensure all fields in the event creation form (Title, Description, Venue, Date, Time) are accurate. Misleading information may lead to event cancellation.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">3. Code of Conduct</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">Events must align with university values. Any content deemed offensive, discriminatory, or inappropriate is strictly prohibited.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-amrita-textDark mb-4 border-b pb-2 border-gray-100">For Participants (Students)</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">1. Registration Integrity</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">Only register for events you intend to attend. Repeated no-shows may affect your eligibility for future limited-seat events.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">2. Punctuality</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">Arrive at the venue at least 10 minutes before the scheduled start time. Late entry may not be permitted for certain workshops or talks.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-amrita-textDark mb-2">3. Feedback</h3>
                                    <p className="text-amrita-textGray text-sm leading-relaxed">Constructive feedback is encouraged after events to help clubs improve. Please use the feedback forms provided post-event.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-amrita-textDark mb-4 border-b pb-2 border-gray-100">General Policies</h2>
                            <ul className="list-disc pl-6 space-y-2 text-amrita-textGray">
                                <li><strong>Venue Usage:</strong> Respect the campus facilities. Keep the venues clean and report any damages immediately.</li>
                                <li><strong>Safety:</strong> Follow all safety protocols instructions given by the event organizers and security staff.</li>
                                <li><strong>ID Cards:</strong> Always carry your university ID card to all events for verification.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
