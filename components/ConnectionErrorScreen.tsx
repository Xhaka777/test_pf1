import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import NoWifi from './icons/nowifi';
import { useNetwork } from '@/providers/network';

const ConnectionErrorScreen = () => {
    const { retryConnection, isConnected, isInternetReachable, connectionType } = useNetwork();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleTryAgain = async () => {
        if (isRetrying) return;

        console.log('[ConnectionErrorScreen] Try again pressed');
        setIsRetrying(true);

        try {
            const success = await retryConnection();

            if (success) {
                console.log('[ConnectionErrorScreen] Retry successful');
                // The network provider will automatically hide this screen
            } else {
                console.log('[ConnectionErrorScreen] Retry failed');
                // Keep the error screen visible
            }
        } catch (error) {
            console.error('[ConnectionErrorScreen] Retry error:', error);
        } finally {
            // Add a small delay to prevent rapid button presses
            setTimeout(() => {
                setIsRetrying(false);
            }, 1000);
        }
    };

    const getErrorMessage = () => {
        if (!isConnected) {
            return 'No internet connection detected. Please check your WiFi or mobile data.';
        } else if (isInternetReachable === false) {
            return 'Connected to network but no internet access. Please check your connection.';
        } else {
            return 'Connection error occurred. Please try again.';
        }
    };

    const getConnectionInfo = () => {
        if (connectionType) {
            const typeMap: { [key: string]: string } = {
                'wifi': 'WiFi',
                'cellular': 'Mobile Data',
                'ethernet': 'Ethernet',
                'none': 'No Connection',
                'unknown': 'Unknown'
            };
            return typeMap[connectionType] || connectionType;
        }
        return 'Unknown';
    };

    return (
        <View className="flex-1 bg-[#100E0F] justify-center items-center px-5">
            <StatusBar barStyle="light-content" backgroundColor="#100E0F" />

            {/* SVG Icon */}
            <View className="mb-3">
                <NoWifi width={200} height={200} />
            </View>

            {/* Title */}
            <Text className="text-2xl font-semibold text-white text-center mb-4">
                Connection Error
            </Text>

            {/* Subtitle */}
            <Text className="text-lg text-gray-400 text-center mb-5 leading-6">
                Please wait, or refresh the page...
            </Text>

            {/* Try Again Button */}
            <TouchableOpacity
                className={`border rounded-lg px-8 py-3 bg-transparent flex-row items-center ${isRetrying
                    ? 'border-gray-500'
                    : 'border-primary-100'
                    }`}
                onPress={handleTryAgain}
                disabled={isRetrying}
            >
                {isRetrying && (
                    <ActivityIndicator
                        size="small"
                        color="#ec4899"
                        style={{ marginRight: 8 }}
                    />
                )}
                <Text className={`text-base font-medium text-center ${isRetrying ? 'text-gray-500' : 'text-primary-100'
                    }`}>
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default ConnectionErrorScreen;
