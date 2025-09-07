import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";
import { PlatformImage } from "./PlatformImage";

type PropFirmPLCardProps = {
    account: {
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
        currency?: string;
        firm?: string | null;
        startingBalance?: number;
        totalPL?: number;
        server?: string;
        exchange?: string;
    },
    activeTab: string;
    accountName: string;
    accountBalance: string;
    dailyPL: number;
    // Prop firm specific props
    icon: React.ComponentType<{ size?: number }>;
    onPress?: ((account: any) => void) | null;
    // New props for Current label and Archive functionality
    isCurrentAccount?: boolean;
    onArchivePress?: (account: any) => void;
    context?: 'menu' | 'overview';
}

const PropFirmPLCard = ({
    account,
    activeTab,
    accountName,
    accountBalance,
    dailyPL,
    icon: IconComponent,
    onPress = null,
    isCurrentAccount = false,
    onArchivePress,
    context = 'menu'
}: PropFirmPLCardProps) => {

    console.log('[PropFirmPLCard] Rendering account:', account.id, account.name);

    // Calculate if it's profit or loss
    const isProfit = account.changePercentage >= 0;

    // Format the balance with proper sign and currency
    const formatBalance = (balance: number, currency: string = 'USD') => {
        const symbol = currency === 'USD' ? '$' : currency + ' ';
        const isNegative = balance < 0;
        const absoluteBalance = Math.abs(balance);

        const formattedNumber = absoluteBalance.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        return isNegative ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
    };

    // Format percentage with proper sign
    const formatPercentage = (value: number) => {
        const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
        const sign = roundedValue >= 0 ? '+' : '';
        return `(${sign}${roundedValue.toFixed(2)}%)`;
    };

    const handlePress = () => {
        if (onPress) {
            console.log('[PropFirmPLCard] Internal press handler called for:', account.id);
            onPress(account);
        }
    };

    const handleArchivePress = (e: any) => {
        e.stopPropagation(); // Prevent triggering the main card press
        if (onArchivePress) {
            onArchivePress(account);
        }
    };

    const cardContent = (
        <View className={`p-4 bg-propfirmone-300 rounded-xl mb-3`}>
            {/* Main row with account info and right-side controls */}
            <View className="flex-row items-start justify-between">
                {/* Left side: Account info */}
                <View className="flex-row items-center flex-1 mr-3">
                    {/* Account Icon */}
                    <View className="w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3">
                        <IconComponent size={45} />
                    </View>

                    {/* Account Info */}
                    <View className="flex-shrink flex-1">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-InterSemiBold text-white mr-2">
                                {account.name}
                            </Text>
                        </View>

                        {/* Platform and ID Row */}
                        <View className="flex-row items-center mt-1">
                            <PlatformImage
                                exchange={account?.exchange}
                                className="w-3 h-3 rounded-full mr-1"
                            />
                            <Text className="text-gray-400 text-sm opacity-90 font-Inter">
                                ID: {account.id}
                            </Text>
                        </View>

                        {/* Balance and Percentage Row - moved under account info */}
                        <View className="flex-row items-center mt-2">
                            <Text className="text-sm font-Inter text-white mr-2">
                                {formatBalance(account.balance, account.currency)}
                            </Text>
                            <Text className={`text-sm font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercentage(account.changePercentage)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Right side: Current label and Archive button */}
                <View className="items-end">
                    {/* Current label - only show for selected account */}
                    {isCurrentAccount && (
                        <View className="bg-green-500 px-2 py-1 rounded-md mb-2">
                            <Text className="text-white text-xs font-InterSemiBold">
                                Current
                            </Text>
                        </View>
                    )}

                    {/* Archive button */}
                    {context === 'menu' && onArchivePress && (
                        <TouchableOpacity
                            onPress={handleArchivePress}
                            className="bg-gray-600 px-3 py-1.5 rounded-md"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white text-xs font-Inter">
                                Archive
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {cardContent}
            </TouchableOpacity>
        )
    }

    return cardContent;
}

export default PropFirmPLCard;