import React from "react";
import { View, Text, Image, TouchableOpacity } from 'react-native';
import ProfitLossIndicator from "./ProfitLossIndicator";
import { LinearGradient } from "expo-linear-gradient";

type BrokerPLCardProps = {
    account: {
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
    },
    activeTab: string;
    // tabImage: any,
    tabImage: React.ReactNode;
    accountName: string;
    accountBalance: string;
    dailyPL: number;
    // onAccountPress: () => void;
}

const BrokerPLCard = ({
    account,
    activeTab,
    tabImage,
    accountName,
    accountBalance,
    dailyPL,
}: BrokerPLCardProps) => {
    // const isNegativePL = account.dailyPL.startsWith('-');
    // const isNegativeChange = account.changePercentage.startsWith('-');
    console.log('tabImage', tabImage)

    const indicatorPosition = Math.min(Math.max(((account.changePercentage + 10) / 20) * 100, 0), 100);
    const isProfit = account.changePercentage >= 0;

    return (
        <TouchableOpacity
            className="p-4 bg-propfirmone-300 rounded-xl mb-3"
            // onPress={onAccountPress}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    {/* <View className={`w-10 h-10 border border-gray-800 rounded-lg items-center justify-center justify-center mr-3 ${activeTab === 'Demo' ? 'bg-[#014737]' : 'bg-[#771D1D]'}`}> */}
                    <View className={`w-12 h-12 border border-gray-800 rounded-lg items-center mt-1 mr-3`}>
                        <Image
                            source={tabImage}
                            // style={{ width: 20, height: 20 }}
                            resizeMode='contain'
                            className="w-8 h-7 rounded-lg items-center justify-center"
                        />
                    </View>
                    <View className="flex-shrink">
                        <Text className="text-lg font-InterSemiBold text-white">
                            {account.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-sm font-Inter text-white mr-2">
                                {account.balance}
                            </Text>
                            <Text className={`text-xs font-Inter ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                                {account.changePercentage}%
                            </Text>
                        </View>
                    </View>
                </View>
                <View className="ml-4">
                    <Text className="text-sm font-Inter text-gray-500 text-right">
                        Daily P/L
                    </Text>
                    <Text className={`text-sm font-Inter text-white text-right ${dailyPL >= 0 ? 'text-red-500' : 'text-white'}`}>
                        {account.dailyPL >= 0 ? '+' : ''} {account.dailyPL.toLocaleString('en-US', {
                            currency: 'USD',
                            maximumFractionDigits: 2
                        })}
                    </Text>
                </View>
            </View>
            <ProfitLossIndicator
                companyName="Tech Ventures"
                totalValue={account.balance}
                percentageChange={account.changePercentage}
                dailyPL={account.dailyPL}
            />
        </TouchableOpacity>
    )
}

export default BrokerPLCard;