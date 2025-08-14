import { View, Image, Text } from 'react-native';
import React from 'react';

const exchangeIconsMap: Record<string, any> = {
    ctrader: require('@/assets/images/ctrader.png'),
    mt5: require('@/assets/images/mt5.png'),
    binance: require('@/assets/images/binance.png'),
};

export type PlatformAvatarProps = {
    exchange?: string | null;
    className?: string;
};

export function PlatformAvatar({ exchange, className }: PlatformAvatarProps) {
    const exchangeKey = exchange?.toLowerCase();
    const imageSource = exchangeKey && exchangeIconsMap[exchangeKey];

    return (
        <View className={`w-5 h-5 rounded-full overflow-hidden bg-muted justify-center items-center ${className}`}>
            {imageSource ? (
                <Image source={imageSource} className="w-full h-full" resizeMode="contain" />
            ) : (
                <Text className="text-xs text-white">
                    {exchange ? exchange.toUpperCase().slice(0, 2) : null}
                </Text>
            )}
        </ View>
    );
}
