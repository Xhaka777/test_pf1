import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";
import { PlatformImage } from "./PlatformImage";
import { Archive } from "lucide-react-native";

type BrokeragePracticePLCardProps = {
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
        // Brokerage/Practice specific fields
        broker?: string; // Broker name
        accountType?: 'Live' | 'Demo'; // Account type
        leverage?: string; // e.g., "1:100"
        server?: string; // Trading server
        exchange?: string; // Exchange name
    },
    activeTab: string;
    accountName: string;
    accountBalance: string;
    dailyPL: number;
    icon: React.ComponentType<{ size?: number }>;
    onPress?: ((account: any) => void) | null;
    // New props for Current label and Archive functionality
    isCurrentAccount?: boolean;
    onArchivePress?: (account: any) => void;
    context?: 'menu' | 'overview';
}

const BrokeragePracticePLCard = ({
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
}: BrokeragePracticePLCardProps) => {

    console.log('[BrokeragePracticePLCard] Rendering account:', account.id, account.name, 'context:', context);

    // Format balance with currency symbol and proper formatting
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

    // Format percentage with proper rounding and sign
    const formatPercentage = (value: number) => {
        const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
        const sign = roundedValue >= 0 ? '+' : '';
        return `(${sign}${roundedValue.toFixed(2)}%)`;
    };

    // Calculate if it's profit or loss
    const isProfit = account.changePercentage >= 0;

    // Enhanced press handler
    const handlePress = () => {
        if (onPress) {
            console.log('[BrokeragePracticePLCard] Internal press handler called for:', account.id);
            onPress(account);
        }
    };

    const handleArchivePress = (e: any) => {
        e.stopPropagation();
        if (onArchivePress) {
            onArchivePress(account);
            console.log('archived account press', account);
            console.log('onArchivePress')
        }
    };

    // Balance and Percentage component for reuse
    const BalancePercentageInfo = () => (
        <View className="flex-row items-center mt-2">
            <Text className="text-sm font-Inter text-white mr-2">
                {formatBalance(account.balance, account.currency)}
            </Text>
            <Text className={`text-sm font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(account.changePercentage)}
            </Text>
        </View>
    );

    // Render the card content
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

                        {/* Balance and Percentage Row - only show when context is 'menu' */}
                        {context === 'menu' && <BalancePercentageInfo />}
                    </View>
                </View>

                {/* Right side: Balance/Percentage (overview) OR Current label and Archive button (menu) */}
                <View className="items-end mt-3">
                    {/* Show Balance/Percentage on the right when context is 'overview' */}
                    {context === 'overview' && (
                        <View className="items-end">
                            <Text className="text-sm font-Inter text-white">
                                {formatBalance(account.balance, account.currency)}
                            </Text>
                            <Text className={`text-sm font-Inter mt-1 ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercentage(account.changePercentage)}
                            </Text>
                        </View>
                    )}

                    {/* Show Current label and Archive button when context is 'menu' */}
                    {context === 'menu' && (
                        <>
                            {/* Current label - only show for selected account */}
                            {isCurrentAccount && (
                                <View className="bg-[#0147374C] px-6 py-1.5 rounded-md mb-2">
                                    <Text className="text-[#31c48D] text-xs font-InterBold">
                                        Current
                                    </Text>
                                </View>
                            )}

                            {/* Archive button */}
                            {onArchivePress && (
                                <TouchableOpacity
                                    onPress={handleArchivePress}
                                    className="px-3 py-1.5 rounded-md border border-[#2f2c2d] flex-row items-center"
                                    activeOpacity={0.7}
                                >
                                    <Archive size={14} color='#fff' />
                                    <Text className="text-white text-xs font-Inter ml-1">
                                        Archive
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
    );

    // Conditionally wrap with TouchableOpacity only if onPress is provided
    if (onPress) {
        return (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {cardContent}
            </TouchableOpacity>
        );
    }

    // Return plain View when used as child of external Pressable
    return cardContent;
}

export default BrokeragePracticePLCard;