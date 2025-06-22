import { useAuthenticatedApi } from "@/api/services/api";
import { useState, useEffect, useCallback } from "react";

export function useApiData<T>(endpoint: string, deps: any[] = []) {
    const { fetchFromApi, isLoaded, isSignedIn } = useAuthenticatedApi<T>();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!isLoaded || !isSignedIn) return;

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFromApi(endpoint);
            console.log('result', result)
            setData(result);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load data');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [endpoint, isLoaded, isSignedIn, ...deps]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, error, refetch: loadData, isAuthenticated: isLoaded && isSignedIn };
}