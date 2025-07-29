import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ToastOptions {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive'
}

export function useToast() {
    const toast = useCallback((options: ToastOptions) => {
        Alert.alert(
            options.title,
            options.description,
            [{ text: 'OK' }]
        )
    }, []);

    return { toast };
}