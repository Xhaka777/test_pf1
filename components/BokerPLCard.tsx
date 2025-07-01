import React from "react";
import { View, Text, Image, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";

type BrokerPLCardProps = {
    account: {
        id: number;
        name: string;
        balance: number; // Now number for proper calculations
        dailyPL: number; // Now number for proper calculations
        changePercentage: number; // Now number for proper calculations
        currency?: string;
        firm?: string | null;
        startingBalance?: number;
        totalPL?: number;
    },
    activeTab: string;
    tabImage: any;
    accountName: string;
    accountBalance: string; // This remains string for display
    dailyPL: number; // This is now number
}

const BrokerPLCard = ({
    account,
    activeTab,
    tabImage,
    accountName,
    accountBalance,
    dailyPL,
}: BrokerPLCardProps) => {
    
    console.log('[BrokerPLCard] Rendering account:', account.id, account.name);

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
            className="p-4 bg-propfirmone-300 rounded-xl mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    {/* Account Icon */}
                    <View className={`w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3 ${
                        activeTab === 'Demo' ? 'bg-[#014737]' : 'bg-[#771D1D]'
                    }`}>
                        <Image
                            source={tabImage}
                            resizeMode='contain'
                            className="w-8 h-7"
                        />
                    </View>
                    
                    {/* Account Info */}
                    <View className="flex-shrink">
                        <Text className="text-lg font-InterSemiBold text-white">
                            {account.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-sm font-Inter text-white mr-2">
                                {accountBalance}
                            </Text>
                            <Text className={`text-xs font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                ({formatPercentage(account.changePercentage)})
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Daily P/L Section */}
                <View className="ml-4">
                    <Text className="text-sm font-Inter text-gray-500 text-right">
                        Daily P/L
                    </Text>
                    <Text className={`text-sm font-InterSemiBold text-right ${
                        isDailyProfit ? 'text-green-500' : 'text-red-500'
                    }`}>
                        {formatDailyPL(account.dailyPL)}
                    </Text>
                </View>
            </View>
            
            {/* Progress Indicator */}
            <ProfitLossIndicator
                companyName={account.name}
                totalValue={account.balance}
                percentageChange={account.changePercentage}
                dailyPL={account.dailyPL}
                startingBalance={account.startingBalance}
                currency={account.currency}
                showLabels={false}
            />
        </TouchableOpacity>
    )
}

export default BrokerPLCard;