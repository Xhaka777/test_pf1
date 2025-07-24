import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';

// Base hook for direct API calls
export function useDirectApi<T>() {
    const { getToken, isSignedIn, isLoaded } = useAuth();

    const fetchData = useCallback(async (endpoint: string): Promise<T> => {
        if (!isLoaded || !isSignedIn) {
            throw new Error('User not authenticated');
        }

        const token = await getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        const response = await axios.get(`${process.env.PUBLIC_SERVER_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    }, [getToken, isSignedIn, isLoaded]);

    return { fetchData, isAuthenticated: isSignedIn && isLoaded };
}

// Hook for broker accounts overview data
export function useBrokerAccountsOverviewDirect() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchData, isAuthenticated } = useDirectApi();

    const loadData = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await fetchData('/fetch_broker_accounts_overview');
            setData(result);
        } catch (err) {
            console.error('Error fetching broker accounts overview:', err);
            setError(err.message || 'Failed to fetch broker accounts overview');
        } finally {
            setLoading(false);
        }
    }, [fetchData, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, error, refetch: loadData };
}

// Hook for broker accounts data
export function useBrokerAccountsDirect() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchData, isAuthenticated } = useDirectApi();

    const loadData = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await fetchData('/broker_accounts');
            setData(result);
        } catch (err) {
            console.error('Error fetching broker accounts:', err);
            setError(err.message || 'Failed to fetch broker accounts');
        } finally {
            setLoading(false);
        }
    }, [fetchData, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, error, refetch: loadData };
}

// Hook for accounts overview details (chart data)
export function useAccountsOverviewDetailsDirect(params: {
    account_type: string;
    start_date: string;
    end_date: string;
}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchData, isAuthenticated } = useDirectApi();

    const loadData = useCallback(async () => {
        if (!isAuthenticated || !params.account_type || !params.start_date || !params.end_date) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                account_type: params.account_type,
                start_date: params.start_date,
                end_date: params.end_date
            }).toString();

            const result = await fetchData(`/fetch_accounts_overview_details?${queryParams}`);
            setData(result);
        } catch (err) {
            console.error('Error fetching accounts overview details:', err);
            setError(err.message || 'Failed to fetch accounts overview details');
        } finally {
            setLoading(false);
        }
    }, [fetchData, isAuthenticated, params.account_type, params.start_date, params.end_date]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, error, refetch: loadData };
}

// Hook for prop firm accounts overview
export function usePropFirmAccountsOverviewDirect() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchData, isAuthenticated } = useDirectApi();

    const loadData = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await fetchData('/fetch_prop_firm_overview');
            setData(result);
        } catch (err) {
            console.error('Error fetching prop firm accounts overview:', err);
            setError(err.message || 'Failed to fetch prop firm accounts overview');
        } finally {
            setLoading(false);
        }
    }, [fetchData, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, error, refetch: loadData };
}