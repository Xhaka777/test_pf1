import images from "@/constants/images";
import React from "react";
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface MenuAccCardProps {
    account: {
        id: number;
        name: string;
        balance: number;
        dailyPL: number;
        changePercentage: number;
    },
    activeTab: string;
    tabImage: React.ReactNode;
    accountName: string;
    accountBalance: string;
}

const MenuAccCard = ({
    account,
    activeTab,
    tabImage,
    accountName,
    accountBalance,
}: MenuAccCardProps) => {
    const isProfit = account.changePercentage >= 0;

    return (
        <TouchableOpacity
            className="p-4 bg-propfirmone-300 rounded-xl mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between">
                {/* Left side - Account info with tab image */}
                <View className="flex-row items-center flex-1">
                    {/* Tab Image */}
                    <Image
                        source={tabImage}
                        resizeMode="contain"
                        className="w-8 h-7 rounded-lg mr-3"
                    />
                    
                    {/* Account name and ID */}
                    <View className="flex-shrink">
                        <Text className="text-lg font-InterSemiBold text-white">
                            {account.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Image
                                source={images.mini_funding_logo}
                                className="w-4 h-4 rounded-full mr-1"
                            />
                            <Text className="text-xs text-gray-600 font-Inter">
                                ID: {account.id}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Right side - Balance and percentage */}
                <View className="flex-row items-center">
                    <Text className="text-base font-Inter text-white mr-2">
                        {account.balance}
                    </Text>
                    <Text className={`text-base font-Inter ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        ({account.changePercentage}%)
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default MenuAccCard;