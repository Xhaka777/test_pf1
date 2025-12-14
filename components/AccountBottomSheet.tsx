import icons from "@/constants/icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Archive, X } from "lucide-react-native";
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import ProfitLossIndicator from "./ProfitLossIndicator";
import { BrokerAccount } from "@/types";
import { EvaluatedAccountIcon } from "./icons/EvaluatedAccountIcon";
import { FundedAccountIcon } from "./icons/FundedAccountIcon";
import { useRouter } from "expo-router";
import AdditionalStats from "./overview/AdditionalStats";

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
    metricsData?: any;
    onAccountSelect?: (accountId: string) => void;
    onArchivePress?: (account: any) => void;
}

const AccountBottomSheet = ({
    bottomSheetRef,
    accountData,
    context = "menu",
    metricsData,
    onAccountSelect,
    onArchivePress
}: AccountBottomSheetProps) => {

    const router = useRouter();
    const snapPoints = useMemo(() => ['70%'], []);

    // Configuration for prop firm account types
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

    // console.log('[AccountBottomSheet] accountData:', accountData);

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
    const getNumericValue = (stringValue: string | undefined): number => {
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
            // console.error('[AccountBottomSheet] No account ID available');
            return;
        }

        if (context === 'overview') {
            onAccountSelect?.(accountData.id);
            bottomSheetRef.current?.close();
            router.push('/(tabs)/trade')
        } else {
            // console.log('[AccountBottomSheet] Switching to account:', accountData.id, accountData.type);
            onAccountSelect?.(accountData.id);
            bottomSheetRef.current?.close();
        }
    }

    const handleArchivePress = () => {
        if (!accountData || !onArchivePress) {
            return;
        }

        bottomSheetRef.current?.dismiss();
        onArchivePress(accountData);
    };

    const getButtonConfig = () => {
        if (context === 'overview') {
            return {
                text: 'Trade',
                style: 'border border-primary-100',
                textStyle: 'text-primary-100'
            };
        } else {
            return {
                text: 'Switch Account',
                style: 'border border-primary-100',
                textStyle: 'text-primary-100'
            };
        }
    };

    const buttonConfig = getButtonConfig();

    // Early return if no account data
    if (!accountData) {
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
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-lg font-Inter">Account Details</Text>
                        <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                            <X size={24} color='#898587' />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-white text-center">No account data available</Text>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{
                backgroundColor: '#100E0F',
                borderColor: '#1E1E2D',
                borderWidth: 1,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16
            }}
            handleIndicatorStyle={{ backgroundColor: '#100E0F' }}
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
                                {accountData.name || 'Unknown Account'}
                            </Text>
                            <Text className="text-gray-400 text-sm mt-1 font-Inter">
                                ID: {String(accountData?.id || 'N/A')}
                            </Text>

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
                                {accountData.type || 'Challenge'}
                            </Text>
                        </View>
                    </View>
                </View>

                <AdditionalStats
                    metricsData={metricsData}
                    isLoading={!metricsData}
                />

                {accountData.type && (accountData.type === 'Challenge' || accountData.type === 'Funded') && (
                    <View className="mb-4">
                        {/* Progress toward profit target */}
                        {accountData.profitTarget && (
                            <View className="bg-propfirmone-300 rounded-lg p-3 mb-2">
                                <Text className="text-gray-400 text-sm font-Inter mb-2">
                                    Profit Target Progress
                                </Text>
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-white text-sm font-Inter">
                                        {`Current: $${getCurrentProfit().toLocaleString()}`}
                                    </Text>
                                    <Text className="text-white text-sm font-Inter">
                                        {`Target: $${accountData.profitTarget.toLocaleString()}`}
                                    </Text>
                                </View>
                                <View className="bg-gray-700 h-2 rounded-full">
                                    <View
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${calculateProgressPercentage()}%` }}
                                    />
                                </View>
                                <Text className="text-gray-400 text-xs font-Inter mt-1">
                                    {`${calculateProgressPercentage().toFixed(1)}% Complete`}
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
                                    {`$${accountData.maxTotalDD.toLocaleString()}`}
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
                            companyName={accountData.name}
                            totalValue={getNumericValue(accountData.balance)}
                            percentageChange={getNumericValue(accountData.changePercentage)}
                            dailyPL={getNumericValue(accountData.dailyPL)}
                            startingBalance={accountData.startingBalance}
                            currency={accountData.currency}
                            showLabels={false}
                        />
                    </View>
                </View>

                {/* Action Button - FIXED: Removed space-x-2 and simplified */}
                <TouchableOpacity
                    onPress={handleActionButtonPress}
                    className={`px-4 py-3 rounded-lg mt-4 mb-10 ${buttonConfig.style}`}
                >
                    <Text className={`font-InterSemiBold text-lg text-center ${buttonConfig.textStyle}`}>
                        {buttonConfig.text}
                    </Text>
                </TouchableOpacity>

                {/* Archive Button - Only show in menu context */}
                {context === 'menu' && onArchivePress && (
                    <TouchableOpacity
                        onPress={handleArchivePress}
                        className="px-4 py-3 mt-2 rounded-lg border border-gray-600 flex-row items-center justify-center"
                    >
                        <Archive size={16} color='#fff' />
                        <Text className="text-white font-InterSemiBold ml-2">
                            Archive Account
                        </Text>
                    </TouchableOpacity>
                )}

            </BottomSheetView>
        </BottomSheetModal>
    );
};

export default AccountBottomSheet;