import { useCallback } from "react";
import { Alert } from "react-native";

interface QuestionOptions {
    title?: string;
    message?: string;
}

export function useConfirmationDialog() {
    const question = useCallback((options: QuestionOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            Alert.alert(
                options.title || 'Confirm',
                options.message || 'Are you sure?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        text: 'Confirm',
                        onPress: () => resolve(true)
                    }
                ]
            )
        })
    }, []);

    return { question };
}