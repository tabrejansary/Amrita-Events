import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Add response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API functions
export const authAPI = {
    register: (data: FormData | any) => api.post('/api/auth/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    login: (credentials: any) => api.post('/api/auth/login', credentials),
    getMe: () => api.get('/api/auth/me'),
    updateInterests: (interests: string[]) => api.put('/api/auth/update-interests', { interests }),
    updateProfile: (data: FormData | any) => api.put('/api/auth/update-profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateNotificationPreferences: (prefs: any) => api.put('/api/auth/notification-preferences', prefs),
    verifyEmail: (token: string) => api.get(`/api/auth/verify-email/${token}`),
    resendVerification: (email: string) => api.post('/api/auth/resend-verification', { email }),
    forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => api.put(`/api/auth/reset-password/${token}`, { password }),
};

export const eventAPI = {
    getEvents: (filters?: any) => api.get('/api/events', { params: filters }),
    getEvent: (id: string) => api.get(`/api/events/${id}`),
    createEvent: (formData: FormData) => api.post('/api/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateEvent: (id: string, formData: FormData) => api.put(`/api/events/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteEvent: (id: string) => api.delete(`/api/events/${id}`),
    registerForEvent: (id: string) => api.post(`/api/events/${id}/register`),
    unregisterFromEvent: (id: string) => api.delete(`/api/events/${id}/unregister`),
    // Dashboard section endpoints
    getTrendingEvents: (params?: any) => api.get('/api/events/trending', { params }),
    getUpcomingEvents: (params?: any) => api.get('/api/events/upcoming', { params }),
    getThisWeekEvents: (params?: any) => api.get('/api/events/this-week', { params }),
    getFeaturedEvents: (params?: any) => api.get('/api/events/featured', { params }),
    getGeneralEvents: (params?: any) => api.get('/api/events/general', { params }),
    getSavedEvents: (params?: any) => api.get('/api/events/saved', { params }),
    getRegisteredEvents: (params?: any) => api.get('/api/events/registered', { params }),
    getPastEvents: (params?: any) => api.get('/api/events/past', { params }),
    toggleBookmark: (id: string) => api.post(`/api/events/${id}/bookmark`),
};

export const systemAPI = {
    getSettings: () => api.get('/api/system'),
    updateSettings: (data: any) => api.put('/api/system', data),
};

export const adminAPI = {
    getPendingEvents: (params?: any) => api.get('/api/admin/events/pending', { params }),
    getAllEvents: (params?: any) => api.get('/api/admin/events', { params }),
    approveEvent: (id: string) => api.put(`/api/admin/events/${id}/approve`),
    rejectEvent: (id: string, reason: string) => api.put(`/api/admin/events/${id}/reject`, { reason }),
    toggleFeature: (id: string) => api.put(`/api/admin/events/${id}/feature`),
    sendAnnouncement: (data: any) => api.post('/api/admin/announcement', data),
    getStats: () => api.get('/api/admin/stats'),
    inviteAdmin: (data: { name: string, email: string }) => api.post('/api/admin/invite', data),
    getAdmins: (params?: any) => api.get('/api/admin/admins', { params }),
    getClubs: (params?: any) => api.get('/api/admin/clubs', { params }),
    // Analytics endpoints
    getKPIs: (range?: string, startDate?: string, endDate?: string) => api.get('/api/admin/analytics/kpis', { params: { range, startDate, endDate } }),
    getTrends: (period?: string, startDate?: string, endDate?: string) => api.get('/api/admin/analytics/trends', { params: { period, startDate, endDate } }),
    getEventPerformance: (params?: any) => api.get('/api/admin/analytics/event-performance', { params }),
    getCategoryInsights: () => api.get('/api/admin/analytics/category-insights'),
    getUserInsights: () => api.get('/api/admin/analytics/user-insights'),
    getTopPerformers: () => api.get('/api/admin/analytics/top-performers'),
    getPlatformInsights: () => api.get('/api/admin/analytics/insights'),
};

export const clubAPI = {
    getMyEvents: (params?: any) => api.get('/api/club/events', { params }),
    getClubStats: (params?: any) => api.get('/api/club/stats', { params }),
    getEventAnalytics: (eventId: string) => api.get(`/api/club/analytics/${eventId}`),
    // Club Management endpoints
    getMyClub: () => api.get('/api/clubs/me'),
    createClub: (formData: FormData) => api.post('/api/clubs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    joinClub: (data: { inviteCode: string }) => api.post('/api/clubs/join', data),
    updateClub: (formData: FormData) => api.put('/api/clubs/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    leaveClub: () => api.post('/api/clubs/me/leave'),
    removeMember: (userId: string) => api.delete(`/api/clubs/me/members/${userId}`),
    regenerateInviteCode: () => api.post('/api/clubs/me/invite/regenerate'),
    sendInviteEmail: (email: string) => api.post('/api/clubs/me/invite/email', { email }),
};

// Form APIs
export const formAPI = {
    createForm: (data: any) => api.post('/api/forms', data),
    getTemplates: () => api.get('/api/forms/templates'),
    getFormById: (id: string) => api.get(`/api/forms/${id}`),
    updateForm: (id: string, data: any) => api.put(`/api/forms/${id}`, data),
    deleteForm: (id: string) => api.delete(`/api/forms/${id}`),
};

// Registration APIs
export const registrationAPI = {
    submitRegistration: (data: any) => api.post('/api/registrations', data),
    getEventRegistrations: (eventId: string, params?: any) => api.get(`/api/registrations/event/${eventId}`, { params }),
    getMyRegistrations: () => api.get('/api/registrations/me'),
};

export const notificationAPI = {
    getNotifications: (params?: any) => api.get('/api/notifications', { params }),
    markAsRead: (id: string) => api.put(`/api/notifications/${id}/read`),
    markAllAsRead: () => api.put('/api/notifications/read-all'),
    deleteAll: () => api.delete('/api/notifications'),
};

export default api;
