import { Image, Text, View } from "react-native";
import React from "react";
import images from "@/constants/images";

export const exchangeIconsMap: Record<string, any> = {
    ctrader: images.ctrader,
    mt5: images.mt5,
    dxtrade: images.dxtrade,
    binance: images.binance,
}

export type PlatformImageProps = {
    exchange?: string | null;
    className?: string;
    size?: number;
    fallbackTextSize?: number;
}

export function PlatformImage({
    exchange,
    className = '',
    size = 20,
    fallbackTextSize = 8
}: PlatformImageProps) {
    const exchangeKey = exchange?.toLowerCase();
    const exchangeImage = exchangeKey ? exchangeIconsMap[exchangeKey] : null;

    if (exchangeImage) {
        return (
            <Image
                source={exchangeImage}
                style={{ width: size, height: size }}
                className={`rounded-full ${className}`}
                resizeMode="contain"
            />
        )
    }

    const fallbackText = exchange ? exchange.toUpperCase().slice(0, 2) : 'EX';

    return (
        <View
            style={{ width: size, height: size }}
            className={`rounded-full bg-gray-600 items-center justify-center ${className}`}
        >
            <Text
                style={{ fontSize: fallbackTextSize }}
                className="text-white font-InterSemiBold"
            >
                {fallbackText}
            </Text>

        </View>
    )
}