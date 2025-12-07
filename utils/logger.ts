import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const STORAGE_KEY_PREFIX = 'error-toast-logs';
const MAX_ENTRIES = 500;

export interface ErrorLog {
    id: string;
    timestamp: number;
    title: string;
    description: string;
    type?: 'error' | 'log';
}

function getStorageKey(userId?: string): string {
    if (!userId) {
        return STORAGE_KEY_PREFIX;
    }
    return `${STORAGE_KEY_PREFIX}-${userId}`;
}

export async function addErrorLog(
    this: { userId?: string },
    title: string,
    description: string,
    type: 'error' | 'log' = 'error'
): Promise<void> {
    const userId = this?.userId;
    const logs = await getErrorLogs(userId);

    const newLog: ErrorLog = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        title,
        description,
        type,
    };

    const updatedLogs = [newLog, ...logs].slice(0, MAX_ENTRIES);

    try {
        await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updatedLogs));
        // Emit event 
        DeviceEventEmitter.emit('error-logs-updated');
    } catch (error) {
        console.warn('Failed to save error log to AsyncStorage:', error);
    }
}

export async function getErrorLogs(userId?: string): Promise<ErrorLog[]> {
    try {
        const stored = await AsyncStorage.getItem(getStorageKey(userId));
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];

        return parsed;
    } catch (error) {
        console.warn('Failed to get error logs from AsyncStorage:', error);
        return [];
    }
}

export async function clearErrorLogs(userId?: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(getStorageKey(userId));
        DeviceEventEmitter.emit('error-logs-updated');
    } catch (error) {
        console.warn('Failed to clear error logs from AsyncStorage:', error);
    }
}