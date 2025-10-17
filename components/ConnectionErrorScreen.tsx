// components/ConnectionErrorScreen.tsx - FIXED VERSION
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import NoWifi from './icons/nowifi';
// REMOVE this old import: import { useNetwork } from '@/providers/network';

const ConnectionErrorScreen = () => {
        const [isRetrying, setIsRetrying] = useState(false);
    // ✅ NO HOOKS NEEDED! The useNetwork hook in AppContent handles everything
    // When connection is restored, AppContent will automatically switch screens

    const handleTryAgain = () => {
        // This is just for user feedback - the real magic happens in AppContent
        console.log('[ConnectionErrorScreen] Try again pressed (auto-detection active)');
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
                // disabled={isRetrying}
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
                    {'Try Again'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default ConnectionErrorScreen;