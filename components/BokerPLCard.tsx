import React from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";
import { PlatformImage } from "./PlatformImage";

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
    onPress?: ((account: any) => void) | null; // ✅ NEW: Optional onPress prop
}

// {
//     "account_type": "string",
//     "api_key": "string",
//     "average_loss": 0,
//     "average_profit": 0,
//     "balance": 0,
//     "currency": "string",
//     "daily_pl": 0,
//     "exchange": "string",
//     "firm": null,
//     "id": 0,
//     "name": "string",
//     "profit_factor": 0,
//     "secret_key": "string",
//     "server": "string",
//     "starting_balance": 0,
//     "status": "string",
//     "total_pl": 0,
//     "win_rate": 0
//   }

const BrokeragePracticePLCard = ({
    account,
    activeTab,
    accountName,
    accountBalance,
    dailyPL,
    icon: IconComponent,
    onPress = null, // ✅ NEW: Default to null
}: BrokeragePracticePLCardProps) => {

    console.log('[BrokeragePracticePLCard] Rendering account:', account.id, account.name);
    console.log('account ->>>>>', account)

    // ✅ NEW: Format balance with currency symbol and proper formatting
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

    // ✅ NEW: Format percentage with proper rounding and sign
    const formatPercentage = (value: number) => {
        const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
        const sign = roundedValue >= 0 ? '+' : '';
        return `(${sign}${roundedValue.toFixed(2)}%)`;
    };

    // Calculate if it's profit or loss
    const isProfit = account.changePercentage >= 0;
    const isDailyProfit = account.dailyPL >= 0;

    // Format the daily P/L with proper sign and currency
    const formatDailyPL = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        const currency = account.currency || 'USD';
        const symbol = currency === 'USD' ? '$' : currency + ' ';
        return `${sign}${symbol}${Math.abs(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    // ✅ IMPROVED: Enhanced press handler
    const handlePress = () => {
        if (onPress) {
            console.log('[BrokeragePracticePLCard] Internal press handler called for:', account.id);
            onPress(account);
        }
    };

    // ✅ FIXED: Render the card content
    const cardContent = (
        <View className={`p-4 bg-propfirmone-300 rounded-xl mb-3`}>
            <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center flex-1">
                    {/* Account Icon */}
                    <View className="w-12 h-12 border border-gray-800 rounded-lg items-center justify-center mr-3">
                        <IconComponent size={45} />
                    </View>

                    {/* Account Info */}
                    <View className="flex-shrink">
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
                    </View>
                </View>
                {/* Balance and Percentage Row */}
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

    // ✅ FIXED: Conditionally wrap with TouchableOpacity only if onPress is provided
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

    // ✅ FIXED: Return plain View when used as child of external Pressable
    return cardContent;
}

export default BrokeragePracticePLCard;