import { useCallback } from "react";
import { Alert } from "react-native";

interface ConfirmationOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export function useConfirmationDialog() {
    const question = useCallback((options: ConfirmationOptions = {}): Promise<boolean> => {
        const {
            title = 'Confirm',
            description = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            destructive = false
        } = options;

        return new Promise((resolve) => {
            Alert.alert(
                title,
                description,
                [
                    {
                        text: cancelText,
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: confirmText,
                        style: destructive ? 'destructive' : 'default',
                        onPress: () => resolve(true)
                    }
                ]
            );
        });
    }, []);

    return { question };
}