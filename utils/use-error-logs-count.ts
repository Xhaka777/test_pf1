import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getErrorLogs } from './logger';
import { useUser } from '@clerk/clerk-expo';

export function useErrorLogsCount() {
    const { user } = useUser();
    const [count, setCount] = useState(0);

    // Initialize count
    useEffect(() => {
        const initializeCount = async () => {
            try {
                const logs = await getErrorLogs(user?.id);
                setCount(logs.length);
            } catch (error) {
                console.warn('Failed to initialize error logs count:', error);
                setCount(0);
            }
        };

        initializeCount();
    }, [user?.id]);

    // Listen for updates
    useEffect(() => {
        const handleStorageChange = async () => {
            try {
                const logs = await getErrorLogs(user?.id);
                setCount(logs.length);
            } catch (error) {
                console.warn('Failed to update error logs count:', error);
            }
        };

        const subscription = DeviceEventEmitter.addListener('error-logs-updated', handleStorageChange);

        return () => {
            subscription.remove();
        };
    }, [user?.id]);

    return count;
}