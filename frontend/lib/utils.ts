export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export const formatTime = (time: string): string => {
    return time;
};

export const isEventUpcoming = (eventDate: string): boolean => {
    return new Date(eventDate) > new Date();
};

export const generateGoogleCalendarLink = (event: any): string => {
    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const formatDateForGoogle = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
        details: event.description,
        location: event.venue,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
