import icons from "@/constants/icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import ProfitLossIndicator from "./ProfitLossIndicator";
import { BrokerAccount } from "@/types"; // Import your API types

interface AccountData {
    id: number;
    name: string;
    balance: string; // Changed to string to match your display format
    dailyPL: string; // Changed to string to match your display format
    changePercentage: string; // Changed to string to match your display format
    type: 'Challenge' | 'Funded' | 'Live' | 'Demo';
    icon?: any;
    // Additional properties for broker accounts
    originalData?: BrokerAccount; // Keep reference to original API data
    currency?: string;
    firm?: string | null;
    exchange?: string;
    server?: string;
    status?: string;
    totalPL?: number;
    startingBalance?: number;
}

interface AccountBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
    accountData?: AccountData;
}

const AccountBottomSheet = ({ bottomSheetRef, accountData }: AccountBottomSheetProps) => {

    const snapPoints = useMemo(() => ['45%'], []); // Increased slightly for more content

    // Configuration for each account type
    const accountTypeConfig = {
        Challenge: {
            bgColor: '#1E40AF',
            textColor: 'text-white',
            icon: require('@/assets/images/alpha_capital_group.png'),
            labelColor: 'bg-blue-900'
        },
        Funded: {
            bgColor: '#047857',
            textColor: 'text-white',
            icon: require('@/assets/images/alpha_capital_group.png'),
            labelColor: 'bg-emerald-900'
        },
        Live: {
            bgColor: '#771D1D', // Red
            textColor: 'text-[#F8B4B4]',
            icon: require('@/assets/icons/red_wallet.png'),
            labelColor: 'bg-[#771D1D]',
        },
        Demo: {
            bgColor: '#014737', // Green
            textColor: 'text-white',
            icon: require('@/assets/icons/wallet.png'),
            labelColor: 'bg-[#014737]',
        },
    }

    console.log('accountData', accountData?.originalData);

    const currentConfig = accountData?.type ? accountTypeConfig[accountData.type] : accountTypeConfig.Demo;

    // Format numeric values for display
    const formatCurrency = (value: number, currency: string = 'USD') => {
        return `${currency} ${value.toLocaleString()}`;
    };

    // Get profit/loss color
    const getPLColor = (value: number) => {
        return value >= 0 ? '#4CAF50' : '#F44336';
    };

    // Extract numeric values from string formats for calculations
    const getNumericValue = (stringValue: string): number => {
        if (!stringValue) return 0;
        // Remove currency symbols, + signs, and convert to number
        const cleaned = stringValue.replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
    };

    // Calculate profit target (if it's a broker account with original data)
    const calculateProfitTarget = () => {
        if (accountData?.originalData) {
            const original = accountData.originalData;
            // You can customize this logic based on your business rules
            // For example, profit target might be a percentage of starting balance
            return original.starting_balance * 0.1; // 10% profit target example
        }
        return 0;
    };

    console.log('originalData', accountData?.originalData);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1E1E2D', borderWidth: 1 }}
            handleIndicatorStyle={{ backgroundColor: '#666' }}
        >
            <BottomSheetView className="px-4 py-4">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-white text-lg font-Inter">Account Details</Text>
                    <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                        <X size={24} color='#898587' />
                    </TouchableOpacity>
                </View>

                {/* Account Info Header */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View
                            className={`border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4`}
                            style={{ backgroundColor: currentConfig.bgColor }}
                        >
                            <Image
                                source={accountData?.icon || currentConfig.icon}
                                resizeMode='contain'
                                className="w-5 h-6"
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-white text-lg font-Inter">
                                {accountData?.name || 'Unknown Account'}
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1 font-Inter">
                                ID: {accountData?.id || 'N/A'}
                            </Text>
                            {/* Show additional info for broker accounts */}
                            {accountData?.originalData && (
                                <>
                                    {accountData.firm && (
                                        <Text className="text-gray-400 text-xs font-Inter">
                                            Firm: {accountData.firm}
                                        </Text>
                                    )}
                                    <Text className="text-gray-400 text-xs font-Inter">
                                        Status: {accountData.originalData.status}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View className={`rounded-md px-2.5 py-0.5 ${currentConfig.labelColor}`}>
                            <Text className={`font-Inter text-base ${currentConfig.textColor}`}>
                                {accountData?.type || 'Demo'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Account Metrics */}
                <View className="flex-row items-center justify-between rounded-lg mt-4">
                    <View className="bg-propfirmone-300 flex-1 rounded-lg py-3">
                        <Image
                            source={icons.dollar_chart_sign}
                            resizeMode='contain'
                            className='w-8 h-8 ml-3 mb-1'
                        />
                        <Text className="text-gray-400 text-base ml-3 font-Inter">Account Balance</Text>
                        <Text className="text-white text-base font-InterSemiBold ml-3">
                            {accountData?.balance || '$0.00'}
                        </Text>
                    </View>

                    <View className="flex-1 ml-2 py-3 bg-propfirmone-300 rounded-lg">
                        <Image
                            source={icons.dollar_sign}
                            resizeMode='contain'
                            className='w-8 h-8 ml-3 mb-1'
                        />
                        <Text className="text-gray-400 text-base ml-3 font-Inter">Daily P/L</Text>
                        <Text 
                            className="text-base font-InterSemiBold ml-3"
                            style={{ 
                                color: accountData?.originalData 
                                    ? getPLColor(accountData.originalData.daily_pl)
                                    : '#FFFFFF'
                            }}
                        >
                            {accountData?.dailyPL || '$0.00'}
                        </Text>
                    </View>
                </View>

                {/* Progress Indicator (conditionally shown) */}
                {(accountData?.type === 'Challenge' || accountData?.type === 'Funded' || accountData?.originalData) && (
                    <View className="flex-row items-center justify-between rounded-lg mt-2">
                        <View className="flex-1 bg-propfirmone-300 py-3 px-2 rounded-lg justify-center">
                            <Text className="text-gray-400 text-xs ml-1 font-Inter">
                                {accountData?.type === 'Challenge' || accountData?.type === 'Funded' 
                                    ? 'Profit Target' 
                                    : 'Performance'}
                            </Text>
                               <ProfitLossIndicator
                                companyName={accountData?.name}
                                totalValue={accountData?.originalData?.balance || getNumericValue(accountData?.balance || '0')}
                                percentageChange={accountData?.originalData?.total_pl || getNumericValue(accountData?.changePercentage || '0')}
                                dailyPL={accountData?.originalData?.daily_pl || getNumericValue(accountData?.dailyPL || '0')}
                            />
                        </View>
                    </View>
                )}

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => {
                        // Handle trade action - you can pass account data to navigation
                        console.log('Trade pressed for account:', accountData?.id);
                        // Navigate to trading screen with account data
                    }}
                    className="border border-primary-100 px-4 py-3 rounded-lg flex-row items-center justify-center space-x-2 mt-4"
                >
                    <Text className="text-primary-100 font-InterSemiBold text-lg">
                        {accountData?.type === 'Demo' ? 'Demo Trade' : 'Trade'}
                    </Text>
                </TouchableOpacity>

            </BottomSheetView>
        </BottomSheetModal>
    )
}

export default AccountBottomSheet;