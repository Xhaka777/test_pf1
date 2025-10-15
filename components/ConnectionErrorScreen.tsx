// components/ConnectionErrorScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import NoWifi from './icons/nowifi';
import { useNetwork } from '@/providers/network';

const ConnectionErrorScreen = () => {
    const { retryConnection, isConnected, isInternetReachable, connectionType, hasNetworkError } = useNetwork();
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryAttempts, setRetryAttempts] = useState(0);
    const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isRetryingRef = useRef(false);

    const handleTryAgain = useCallback(async () => {
        if (isRetryingRef.current) {
            console.log('[ConnectionErrorScreen] Already retrying, skipping');
            return;
        }

        console.log('[ConnectionErrorScreen] Try again pressed, attempt:', retryAttempts + 1);
        isRetryingRef.current = true;
        setIsRetrying(true);
        setRetryAttempts(prev => prev + 1);

        try {
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const success = await retryConnection();

            if (success) {
                console.log('[ConnectionErrorScreen] ✅ Retry successful - connection restored');
                setRetryAttempts(0);
                // The screen should automatically disappear because hasNetworkError will be false
            } else {
                console.log('[ConnectionErrorScreen] ❌ Retry failed - still no connection');
            }
        } catch (error) {
            console.error('[ConnectionErrorScreen] Retry error:', error);
        } finally {
            // Add a small delay to prevent rapid button presses
            setTimeout(() => {
                setIsRetrying(false);
                isRetryingRef.current = false;
            }, 1000);
        }
    }, [retryConnection, retryAttempts]);

    // Auto-retry logic
    useEffect(() => {
        // Clear any existing timeout
        if (autoRetryTimeoutRef.current) {
            clearTimeout(autoRetryTimeoutRef.current);
        }

        // Only auto-retry if we have a network error and haven't exceeded max attempts
        if (hasNetworkError && retryAttempts < 5 && !isRetrying) {
            console.log('[ConnectionErrorScreen] Scheduling auto-retry in 5 seconds');
            autoRetryTimeoutRef.current = setTimeout(() => {
                console.log('[ConnectionErrorScreen] Auto-retry triggered');
                handleTryAgain();
            }, 5000);
        }

        return () => {
            if (autoRetryTimeoutRef.current) {
                clearTimeout(autoRetryTimeoutRef.current);
            }
        };
    }, [hasNetworkError, retryAttempts, isRetrying, handleTryAgain]);

    // Reset retry attempts when connection is restored
    useEffect(() => {
        if (!hasNetworkError) {
            console.log('[ConnectionErrorScreen] Connection restored, resetting retry attempts');
            setRetryAttempts(0);
            setIsRetrying(false);
            isRetryingRef.current = false;
        }
    }, [hasNetworkError]);

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
            <View className="mb-6">
                <NoWifi width={200} height={200} />
            </View>

            {/* Title */}
            <Text className="text-2xl font-InterBold text-white text-center mb-4">
                No Internet Connection
            </Text>

            {/* Error Message */}
            <Text className="text-base text-gray-400 text-center mb-2 leading-6 px-4">
                {getErrorMessage()}
            </Text>

            {/* Connection Type */}
            <Text className="text-sm text-gray-500 text-center mb-8">
                Connection Type: {getConnectionInfo()}
            </Text>

            {/* Debug Info - Remove in production */}
            <View className="bg-gray-800 rounded-lg p-3 mb-6 w-full max-w-sm">
                <Text className="text-xs text-gray-400 text-center mb-1">
                    Debug Info:
                </Text>
                <Text className="text-xs text-gray-400 text-center">
                    Connected: {isConnected ? 'Yes' : 'No'} | 
                    Reachable: {isInternetReachable === null ? 'Unknown' : (isInternetReachable ? 'Yes' : 'No')} | 
                    Error: {hasNetworkError ? 'Yes' : 'No'}
                </Text>
            </View>

            {/* Try Again Button */}
            <TouchableOpacity
                className={`border rounded-lg px-8 py-4 bg-transparent flex-row items-center min-w-[180px] justify-center ${
                    isRetrying ? 'border-gray-500' : 'border-primary-100'
                }`}
                onPress={handleTryAgain}
                disabled={isRetrying}
                activeOpacity={0.7}
            >
                {isRetrying && (
                    <ActivityIndicator
                        size="small"
                        color="#ec4899"
                        style={{ marginRight: 8 }}
                    />
                )}
                <Text
                    className={`text-base font-InterSemiBold text-center ${
                        isRetrying ? 'text-gray-500' : 'text-primary-100'
                    }`}
                >
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                </Text>
            </TouchableOpacity>

            {/* Retry counter */}
            {retryAttempts > 0 && (
                <Text className="text-xs text-gray-500 text-center mt-4">
                    Retry attempt {retryAttempts} of 5
                </Text>
            )}

            {/* Auto-retry info */}
            {retryAttempts < 5 && !isRetrying && (
                <Text className="text-xs text-gray-500 text-center mt-2">
                    Auto-retrying in 5 seconds...
                </Text>
            )}
        </View>
    );
};

export default ConnectionErrorScreen;