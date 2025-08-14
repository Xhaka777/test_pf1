import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";

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
    },
    activeTab: string;
    accountName: string;
    accountBalance: string;
    dailyPL: number;
    icon: React.ComponentType<{ size?: number }>;
}

const BrokeragePracticePLCard = ({
    account,
    activeTab,
    accountName,
    accountBalance,
    dailyPL,
    icon: IconComponent,
}: BrokeragePracticePLCardProps) => {

    console.log('[BrokeragePracticePLCard] Rendering account:', account.id, account.name);

    // Calculate if it's profit or loss
    const isProfit = account.changePercentage >= 0;
    const isDailyProfit = account.dailyPL >= 0;

    // Format the daily P/L with proper sign and currency
    const formatDailyPL = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        const currency = account.currency || 'USD';
        return `${sign}${currency} ${Math.abs(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // Format percentage with proper sign
    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    return (
        <TouchableOpacity
            className={`p-4 bg-propfirmone-300 rounded-xl mb-3`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center flex-1">
                    {/* Account Icon */}
                    <View className="w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3">
                        <IconComponent size={40} />
                    </View>

                    {/* Account Info */}
                    <View className="flex-shrink">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-InterSemiBold text-white mr-2">
                                {account.name}
                            </Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-sm font-Inter text-white mr-2">
                                {accountBalance}
                            </Text>
                            <Text className={`text-xs font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                ({formatPercentage(account.changePercentage)})
                            </Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                            {account.broker && (
                                <Text className="text-xs font-Inter text-gray-400 mr-3">
                                    {account.broker}
                                </Text>
                            )}
                            {account.leverage && (
                                <Text className="text-xs font-Inter text-gray-400">
                                    {account.leverage}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Daily P/L Section */}
                <View className="ml-4">
                    <Text className="text-sm font-Inter text-gray-500 text-right">
                        Daily P/L
                    </Text>
                    <Text className={`text-sm font-InterSemiBold text-right ${isDailyProfit ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {formatDailyPL(account.dailyPL)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default BrokeragePracticePLCard;