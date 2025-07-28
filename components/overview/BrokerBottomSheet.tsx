import icons from "@/constants/icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { BrokerAccount } from "@/types";
import { WinLossStats } from "./WinLossStats";
import AdditionalStats from "./AdditionalStats";
import { PracticeIcon } from "../icons/PracticeIcon";
import AccountIcon from "../icons/AccountIcon";

interface BrokerAccountData {
    id: number;
    name: string;
    balance: string;
    dailyPL: string;
    changePercentage: string;
    type: 'Live' | 'Demo';
    // Broker specific data
    originalData?: BrokerAccount;
    currency?: string;
    firm?: string | null;
    exchange?: string;
    server?: string;
    status?: string;
    totalPL?: number;
    startingBalance?: number;
}

interface BrokerBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal>;
    accountData?: BrokerAccountData;
}

const BrokerBottomSheet = ({ bottomSheetRef, accountData }: BrokerBottomSheetProps) => {

    const snapPoints = useMemo(() => ['70%'], []);

    // Configuration for broker account types
    const accountTypeConfig = {
        Live: {
            bgColor: '', // Not used directly here
            textColor: '#F98080', // white
            icon: AccountIcon,
            labelColor: '#771D1D', // Tailwind's red-700/900-ish
        },
        Demo: {
            bgColor: '', 
            textColor: '#FACA15', 
            icon: PracticeIcon,
            labelColor: '#633112',
        },
    };
    const currentConfig = accountData?.type ? accountTypeConfig[accountData.type] : accountTypeConfig.Demo;

    // Extract numeric values from string formats
    const getNumericValue = (stringValue: string): number => {
        if (!stringValue) return 0;
        const cleaned = stringValue.replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
    };

    // Calculate performance percentage
    const getPerformancePercentage = (): number => {
        if (accountData?.originalData) {
            const { balance, starting_balance } = accountData.originalData;
            if (starting_balance > 0) {
                return ((balance - starting_balance) / starting_balance) * 100;
            }
        }
        return getNumericValue(accountData?.changePercentage || '0');
    };

    // Mock data for stats - replace with real data based on accountData
    const getAccountStats = () => {
        // This would come from your API or calculated from account data
        return {
            winPercentage: 64.68,
            lossPercentage: 33.32,
            avgWinAmount: '$129',
            avgLossAmount: '-$29.85',
            winRate: '13.79%',
            profitFactor: '0.04'
        };
    };

    const currentAccountData = getAccountStats();

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1E1E2D', borderWidth: 1 }}
            handleIndicatorStyle={{ backgroundColor: '#666' }}
        >
            <BottomSheetView className="px-2 py-4">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4 mx-2">
                    <Text className="text-white text-lg font-Inter">Account Details</Text>
                    <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                        <X size={24} color='#898587' />
                    </TouchableOpacity>
                </View>

                {/* Account Info Header */}
                <View className="flex-row items-center justify-between mb-6 mx-2">
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
                                {accountData?.type || 'Demo'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Win/Loss Statistics */}
                <WinLossStats
                    winPercentage={currentAccountData.winPercentage}
                    lossPercentage={currentAccountData.lossPercentage}
                    avgWinAmount={currentAccountData.avgWinAmount}
                    avgLossAmount={currentAccountData.avgLossAmount}
                />

                {/* Additional Statistics */}
                <AdditionalStats
                    winRate={currentAccountData.winRate}
                    profitFactor={currentAccountData.profitFactor}
                />

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => {
                        console.log('Trade pressed for broker account:', accountData?.id);
                        // Navigate to trading screen with broker account data
                    }}
                    className="border border-primary-100 px-4 py-3 rounded-lg flex-row items-center justify-center space-x-2 mt-4 mx-2"
                >
                    <Text className="text-primary-100 font-InterSemiBold text-lg">
                        Trade
                    </Text>
                </TouchableOpacity>

            </BottomSheetView>
        </BottomSheetModal>
    );
};

export default BrokerBottomSheet;