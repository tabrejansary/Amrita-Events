// Category options for events and interests
export const CATEGORIES = [
    'Hackathons',
    'Tech Workshops',
    'Seminars & Talks',
    'Cultural Events',
    'Sports',
    'Academic & Research',
    'Placement & Career',
] as const;

// Department options
export const DEPARTMENTS = [
    'CSE',
    'AI',
    'ECE',
    'EEE',
    'ME',
    'CE',
    'BT',
    'All',
    'Other',
] as const;

// Year options
export const YEARS = [1, 2, 3, 4] as const;

// User roles
export const ROLES = {
    STUDENT: 'student',
    CLUB: 'club',
    ADMIN: 'admin',
} as const;

// Event status
export const EVENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type Category = typeof CATEGORIES[number];
export type Department = typeof DEPARTMENTS[number];
export type Year = typeof YEARS[number];
export type Role = typeof ROLES[keyof typeof ROLES];
export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];
