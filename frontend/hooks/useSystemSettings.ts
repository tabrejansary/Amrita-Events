'use client';

import { useState, useEffect } from 'react';
import { systemAPI } from '@/lib/api';
import { CATEGORIES, DEPARTMENTS, YEARS } from '@/lib/constants';

export interface SystemSettings {
    categories: string[];
    departments: string[];
    years: number[];
}

export function useSystemSettings() {
    const [settings, setSettings] = useState<SystemSettings>({
        categories: [...CATEGORIES],
        departments: [...DEPARTMENTS],
        years: [...YEARS],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await systemAPI.getSettings();
                if (response.data.success) {
                    setSettings(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch system settings, using fallbacks:', err);
                setError('Failed to fetch latest settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { settings, loading, error };
}
