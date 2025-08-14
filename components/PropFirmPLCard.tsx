import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";

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
        // Prop firm specific fields
        phase?: string; // e.g., "Phase 1", "Phase 2", "Funded"
        target?: number; // Profit target
        drawdown?: number; // Max drawdown
        daysRemaining?: number; // Days left in challenge
    },
    activeTab: string;
    accountName: string;
    accountBalance: string;
    dailyPL: number;
    // Prop firm specific props
    icon: React.ComponentType<{ size?: number }>;
}

const PropFirmPLCard = ({
    account,
    activeTab,
    accountName,
    accountBalance,
    dailyPL,
    icon: IconComponent,
}: PropFirmPLCardProps) => {
    
    console.log('[PropFirmPLCard] Rendering account:', account.id, account.name);

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

    // Get progress toward target (for prop firms)
    const getTargetProgress = () => {
        if (account.target && account.startingBalance) {
            const currentProfit = account.balance - account.startingBalance;
            const progressPercentage = (currentProfit / account.target) * 100;
            return Math.min(Math.max(progressPercentage, 0), 100);
        }
        return 0;
    };

    return (
        <TouchableOpacity
            className="p-4 bg-propfirmone-300 rounded-xl mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                    {/* Account Icon */}
                    <View className="w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3">
                        <IconComponent size={32} />
                    </View>
                    
                    {/* Account Info */}
                    <View className="flex-shrink">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-InterSemiBold text-white mr-2">
                                {account.name}
                            </Text>
                            {account.phase && (
                                <View className="bg-purple-600 px-2 py-1 rounded-md">
                                    <Text className="text-xs font-Inter text-white">
                                        {account.phase}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-sm font-Inter text-white mr-2">
                                {accountBalance}
                            </Text>
                            <Text className={`text-xs font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                ({formatPercentage(account.changePercentage)})
                            </Text>
                        </View>
                        {account.firm && (
                            <Text className="text-xs font-Inter text-gray-400 mt-1">
                                {account.firm}
                            </Text>
                        )}
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

            {/* Prop Firm Specific Info */}
            {(account.target || account.daysRemaining) && (
                <View className="flex-row justify-between mb-3">
                    {account.target && (
                        <View className="flex-1 mr-4">
                            <Text className="text-xs font-Inter text-gray-400">
                                Target Progress
                            </Text>
                            <View className="flex-row items-center">
                                <Text className="text-sm font-InterSemiBold text-white">
                                    {getTargetProgress().toFixed(1)}%
                                </Text>
                                <View className="flex-1 bg-gray-700 h-2 rounded-full ml-2">
                                    <View 
                                        className="bg-purple-500 h-2 rounded-full"
                                        style={{ width: `${getTargetProgress()}%` }}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                    {account.daysRemaining && (
                        <View>
                            <Text className="text-xs font-Inter text-gray-400">
                                Days Left
                            </Text>
                            <Text className="text-sm font-InterSemiBold text-white">
                                {account.daysRemaining}
                            </Text>
                        </View>
                    )}
                </View>
            )}
            
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

export default PropFirmPLCard;