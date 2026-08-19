'use client';

import Image from 'next/image';
import { FaCalendarAlt } from 'react-icons/fa';
import { useState } from 'react';

interface OrganizerCardProps {
    organizer: {
        _id: string;
        name: string;
        clubName?: string;
        logo?: string;
        profileImage?: string;
        clubLogo?: string;
        eventCount: number;
        role?: string;
        [key: string]: any;
    };
    onClick: () => void;
}

export default function OrganizerCard({ organizer, onClick }: OrganizerCardProps) {
    const displayName = organizer.name || organizer.clubName || 'Unknown Club';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'C';
    const role = organizer.role || 'club';
    const [imgError, setImgError] = useState(false);
    const logoUrl = organizer.logo || organizer.clubLogo || organizer.profileImage;

    return (
        <div
            onClick={onClick}
            className="card hover:shadow-lg transition cursor-pointer flex flex-col items-center p-4 text-center group"
        >
            <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden border-4 border-amrita-bgLight group-hover:border-amrita-maroon transition-colors bg-amrita-maroon flex items-center justify-center shadow-sm">
                {logoUrl && !imgError ? (
                    <img
                        src={logoUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-xl font-bold text-white tracking-wider">{initials}</span>
                )}
            </div>

            <h3 className="text-base font-bold text-amrita-textDark line-clamp-1 break-words w-full" title={displayName}>
                {displayName}
            </h3>
            <span className="text-[10px] font-semibold text-amrita-maroon uppercase tracking-wider mb-1">
                Club Organization
            </span>

            <div className="mt-1 flex items-center text-amrita-textGray text-sm font-medium">
                <FaCalendarAlt className="mr-1.5 text-amrita-maroon text-xs" />
                <span>{organizer.eventCount} {organizer.eventCount === 1 ? 'event' : 'events'}</span>
            </div>

            <button className="mt-3 text-amrita-maroon font-bold text-xs hover:underline">
                View Events &raquo;
            </button>
        </div>
    );
}
