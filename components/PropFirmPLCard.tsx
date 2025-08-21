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
}

// "account_type": "string",
// "api_key": "string",
// "average_loss": 0,
// "average_profit": 0,
// "balance": 0,
// "currency": "string",
// "daily_pl": 0,
// "exchange": "string",
// "firm": "string",
// "id": 0,
// "max_total_dd": 0,
// "name": "string",
// "net_pl": 0,
// "profit_factor": 0,
// "profit_target": 0,
// "program": "string",
// "secret_key": "string",
// "server": "string",
// "starting_balance": 0,
// "status": "string",
// "total_pl": 0,
// "win_rate": 0

const PropFirmPLCard = ({
    account,
    activeTab,
    accountName,
    accountBalance,
    dailyPL,
    icon: IconComponent,
    onPress = null,
}: PropFirmPLCardProps) => {

    console.log('[PropFirmPLCard] Rendering account:', account.id, account.name);

    // Calculate if it's profit or loss
    const isProfit = account.changePercentage >= 0;
    const isDailyProfit = account.dailyPL >= 0;

    // Format the daily P/L with proper sign and currency
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
            console.log('[BrokeragePracticePLCard] Internal press handler called for:', account.id);
            onPress(account);
        }
    };

    const cardContent = (
        <View className={`p-4 bg-propfirmone-300 rounded-xl mb-3`}>
            <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3">
                        <IconComponent size={45} />
                    </View>

                    <View className="flex-shrink">
                        <View className="flex-row items-center">
                            <Text className="text-lg font-InterSemiBold text-white mr-2">
                                {account.name}
                            </Text>
                        </View>

                        <View className="flex-row items-center mt-1">
                            <PlatformImage
                                exchange={account?.exchange}
                                className="w-3 h-3 rounded-full mr-1"
                            />
                            <Text className="text-gray-400 text-sm opacity-90 font-Inter">
                                ID: {account.id}
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center mt-1">
                    <Text className="text-sm font-Inter text-white mr-2">
                        {formatBalance(account.balance, account.currency)}
                    </Text>
                    <Text className={`text-sm font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercentage(account.changePercentage)}
                    </Text>
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