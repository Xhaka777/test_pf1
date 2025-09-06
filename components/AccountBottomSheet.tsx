import icons from "@/constants/icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import ProfitLossIndicator from "./ProfitLossIndicator";
import { BrokerAccount } from "@/types";
import { EvaluatedAccountIcon } from "./icons/EvaluatedAccountIcon";
import { FundedAccountIcon } from "./icons/FundedAccountIcon";
import { useRouter } from "expo-router";

interface PropFirmAccountData {
    id: number;
    name: string;
    balance: string;
    dailyPL: string;
    changePercentage: string;
    type: 'Challenge' | 'Funded';
    currency?: string;
    firm?: string;
    program?: string;
    totalPL?: number;
    netPL?: number;
    startingBalance?: number;
    maxTotalDD?: number;
    profitTarget?: number;
    originalData?: any;
}

interface AccountBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
    accountData?: PropFirmAccountData;
    context?: 'menu' | 'overview';
    onAccountSelect?: (accountId: number) => void;
}

const AccountBottomSheet = ({ bottomSheetRef, accountData, context = "menu", onAccountSelect }: AccountBottomSheetProps) => {

    const router = useRouter();
    const snapPoints = useMemo(() => ['70%'], []); // Increased for more content

    // ✅ FIXED: Configuration for prop firm account types
    const accountTypeConfig = {
        Challenge: {
            bgColor: '', // Purple for Challenge
            textColor: '#CABFFD',
            icon: EvaluatedAccountIcon,
            labelColor: '#4A1D96'
        },
        Funded: {
            bgColor: '#31C48D', // Green for Funded
            textColor: '#31C48D',
            icon: FundedAccountIcon,
            labelColor: '#014737'
        },
    };

    console.log('[AccountBottomSheet] accountData:', accountData);

    const currentConfig = accountData?.type ? accountTypeConfig[accountData.type] : accountTypeConfig.Challenge;

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

    const calculateProgressPercentage = (): number => {
        if (!accountData?.profitTarget || !accountData?.startingBalance) return 0;

        const currentBalance = getNumericValue(accountData.balance);
        const currentProfit = currentBalance - accountData.startingBalance;
        const progressPercentage = (currentProfit / accountData.profitTarget) * 100;

        return Math.min(Math.max(progressPercentage, 0), 100);
    };

    const getCurrentProfit = (): number => {
        if (!accountData?.startingBalance) return 0;
        const currentBalance = getNumericValue(accountData.balance);
        return currentBalance - accountData.startingBalance;
    };

    const handleActionButtonPress = () => {
        if (!accountData?.id) {
            console.error('[AccountBottomSheet] No account ID available');
            return;
        }

        if (context === 'overview') {
            onAccountSelect?.(accountData.id);
            bottomSheetRef.current?.close();
            router.push('/(tabs)/trade')
        } else {
            onAccountSelect?.(accountData.id);
            bottomSheetRef.current?.close();
        }
    }

    const getButtonConfig = () => {
        if (context === 'overview') {
            return {
                text: 'Trade',
                style: 'border border-primary-100',
                textStyle: 'text-primary-100'
            };
        } else {
            return {
                text: accountData?.type === 'Challenge' ? 'Start Challenge' : 'Activate Account',
                style: 'border border-primary-100',
                textStyle: 'text-primary-100'
            };
        }
    };

    const buttonConfig = getButtonConfig();

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
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center flex-1">
                        <View
                            className="border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4"
                            style={{ backgroundColor: currentConfig.bgColor }}
                        >
                            <currentConfig.icon size={40} />

                        </View>

                        <View className="flex-1">
                            <Text className="text-white text-lg font-Inter">
                                {accountData?.name || 'Unknown Account'}
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1 font-Inter">
                                ID: {accountData?.id || 'N/A'}
                            </Text>
                            {/* ✅ FIXED: Show firm and program for prop firm accounts */}
                            {accountData?.firm && (
                                <Text className="text-gray-400 text-xs font-Inter">
                                    Firm: {accountData.firm}
                                </Text>
                            )}
                            {accountData?.program && (
                                <Text className="text-gray-400 text-xs font-Inter">
                                    Program: {accountData.program}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View className="flex-row items-center">
                        <View
                            className="rounded-md px-2.5 py-0.5"
                            style={{ backgroundColor: currentConfig.labelColor }}
                        >
                            <Text
                                className="font-Inter text-base"
                                style={{ color: currentConfig.textColor }}
                            >
                                {accountData?.type || 'Challenge'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Account Metrics */}
                <View className="flex-row items-center justify-between rounded-lg mb-4">
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
                                color: accountData?.dailyPL
                                    ? getPLColor(getNumericValue(accountData.dailyPL))
                                    : '#FFFFFF'
                            }}
                        >
                            {accountData?.dailyPL || '$0.00'}
                        </Text>
                    </View>
                </View>

                {accountData?.type && (accountData.type === 'Challenge' || accountData.type === 'Funded') && (
                    <View className="mb-4">
                        {/* Progress toward profit target */}
                        {accountData.profitTarget && (
                            <View className="bg-propfirmone-300 rounded-lg p-3 mb-2">
                                <Text className="text-gray-400 text-sm font-Inter mb-2">
                                    Profit Target Progress
                                </Text>
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white text-sm font-Inter">
                                        Current: ${getCurrentProfit().toLocaleString()}
                                    </Text>
                                    <Text className="text-white text-sm font-Inter">
                                        Target: ${accountData.profitTarget.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="bg-gray-700 h-2 rounded-full">
                                    <View
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${calculateProgressPercentage()}%` }}
                                    />
                                </View>
                                <Text className="text-gray-400 text-xs font-Inter mt-1">
                                    {calculateProgressPercentage().toFixed(1)}% Complete
                                </Text>
                            </View>
                        )}

                        {/* Max Drawdown info */}
                        {accountData.maxTotalDD && (
                            <View className="bg-propfirmone-300 rounded-lg p-3">
                                <Text className="text-gray-400 text-sm font-Inter mb-1">
                                    Max Drawdown Limit
                                </Text>
                                <Text className="text-red-400 text-sm font-InterSemiBold">
                                    ${accountData.maxTotalDD.toLocaleString()}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Progress Indicator */}
                <View className="flex-row items-center justify-between rounded-lg mb-4">
                    <View className="flex-1 bg-propfirmone-300 py-3 px-2 rounded-lg justify-center">
                        <Text className="text-gray-400 text-xs ml-1 font-Inter">
                            Performance
                        </Text>
                        <ProfitLossIndicator
                            companyName={accountData?.name}
                            totalValue={getNumericValue(accountData?.balance || '0')}
                            percentageChange={getNumericValue(accountData?.changePercentage || '0')}
                            dailyPL={getNumericValue(accountData?.dailyPL || '0')}
                            startingBalance={accountData?.startingBalance}
                            currency={accountData?.currency}
                            showLabels={false}
                        />
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={handleActionButtonPress}
                    className={`px-4 py-3 rounded-lg flex-row items-center justify-center space-x-2 mt-4 ${buttonConfig.style}`}
                >
                    <Text className={`font-InterSemiBold text-lg ${buttonConfig.textStyle}`}>
                        {buttonConfig.text}
                    </Text>
                </TouchableOpacity>

            </BottomSheetView>
        </BottomSheetModal>
    );
};

export default AccountBottomSheet;