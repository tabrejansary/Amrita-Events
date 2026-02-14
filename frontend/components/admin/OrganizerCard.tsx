'use client';

import Image from 'next/image';
import { FaCalendarAlt } from 'react-icons/fa';
import { useState } from 'react';

interface OrganizerCardProps {
    organizer: {
        _id: string;
        name: string;
        clubName?: string;
        profileImage?: string;
        clubLogo?: string;
        eventCount: number;
        role?: string;
    };
    onClick: () => void;
}

export default function OrganizerCard({ organizer, onClick }: OrganizerCardProps) {
    const displayName = organizer.clubName || organizer.name || 'Unknown Organizer';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const role = organizer.role || 'club';
    const [imgError, setImgError] = useState(false);
    const logoUrl = organizer.clubLogo || organizer.profileImage || '/default-club-logo.png';

    return (
        <div
            onClick={onClick}
            className="card hover:shadow-lg transition cursor-pointer flex flex-col items-center p-4 text-center group"
        >
            <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden border-4 border-amrita-bgLight group-hover:border-amrita-maroon transition-colors bg-amrita-maroon flex items-center justify-center">
                {!imgError ? (
                    <Image
                        src={logoUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-xl font-bold text-white">{initials}</span>
                )}
            </div>

            <h3 className="text-base font-bold text-amrita-textDark line-clamp-1 break-all">{displayName}</h3>
            <span className="text-[10px] font-semibold text-amrita-maroon uppercase tracking-wider mb-1 truncate max-w-full">{role}</span>

            <div className="mt-1 flex items-center text-amrita-textGray text-sm">
                <FaCalendarAlt className="mr-2 text-amrita-maroon" />
                <span>{organizer.eventCount} {organizer.eventCount === 1 ? 'event' : 'events'}</span>
            </div>

            <button className="mt-4 text-amrita-maroon font-semibold text-sm hover:underline">
                View Events &raquo;
            </button>
        </div>
    );
}
