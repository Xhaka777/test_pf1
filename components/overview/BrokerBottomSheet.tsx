import icons from "@/constants/icons";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { BrokerAccount } from "@/types";
import { WinLossStats } from "./WinLossStats";
import AdditionalStats from "./AdditionalStats";
import { PracticeIcon } from "../icons/PracticeIcon";
import AccountIcon from "../icons/AccountIcon";
import { useAccounts } from "@/providers/accounts";
import { StatusEnum } from "@/api/services/api";
import { useToast } from "@/hooks/use-toast";
import { useConfirmationDialog } from "@/hooks/use-confitmation-dialog";
import { useActivateAccountMutation } from "@/api";
import { useNavigation, useRouter } from "expo-router";
import { router } from "expo-router";


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
    context?: 'menu' | 'overview';
}

const BrokerBottomSheet = ({ bottomSheetRef, accountData, context = 'menu' }: BrokerBottomSheetProps) => {

    const navigation = useNavigation();
    const { selectedAccountId, setSelectedAccountId } = useAccounts();
    const { mutate: activateAccount } = useActivateAccountMutation();
    const { toast } = useToast();
    const { question } = useConfirmationDialog();
    const router = useRouter();

    const [openAccountInfo, setOpenAccountInfo] = useState(false);

    const snapPoints = useMemo(() => ['70%'], []);

    const account = accountData;
    const isSelected = account?.id === selectedAccountId;

    const onSwitchAccount = useCallback(async () => {
        if (isSelected) {
            return;
        }
        setOpenAccountInfo(false);
        setSelectedAccountId(account.id);
    }, [account?.id, isSelected, setSelectedAccountId]);

    const onActivateAccount = useCallback(async () => {
        if (!account?.id) {
            console.error('[BrokerBottomSheet] No account available');
            return;
        }

        console.log('[BrokerBottomSheet] Starting activation for account:', account.id);

        const answer = await question({});
        if (!answer) return;

        if (isSelected) {
            console.log('[BrokerBottomSheet] Account already selected');
            return;
        }

        setOpenAccountInfo(false);

        // Ensure we're passing a number, not a string
        const accountId = typeof account.id === 'string' ? parseInt(account.id, 10) : account.id;

        console.log('[BrokerBottomSheet] Calling activateAccount with:', { account: accountId });

        void activateAccount(
            { account: accountId }, // Make sure this is a number
            {
                onSuccess: (response) => {
                    console.log('[BrokerBottomSheet] Activation response:', response);

                    if (response.status === StatusEnum.SUCCESS) {
                        toast({
                            title: 'Success',
                            description: response.message
                        });
                        setSelectedAccountId(accountId);
                        bottomSheetRef.current?.close();
                    } else {
                        toast({
                            title: 'Error',
                            description: response.message || 'Failed to activate account',
                            variant: 'destructive',
                        });
                    }
                },
                onError: (err) => {
                    console.error('[BrokerBottomSheet] Activation error:', err);
                    toast({
                        title: 'Error',
                        description: err instanceof Error
                            ? err.message
                            : 'An error occurred while trying activate account. Please try again.',
                        variant: 'destructive',
                    });
                },
            },
        );
    }, [
        question,
        isSelected,
        setSelectedAccountId,
        account?.id,
        activateAccount,
        toast,
        bottomSheetRef
    ]);

    const handleActionButtonPress = () => {
        if (!account?.id) {
            console.error('[BrokerBottomSheet] No account ID available');
            return;
        }

        if (context === 'overview') {
            // For overview: Select account and navigate to trade
            console.log('[BrokerBottomSheet] Overview context: Selecting account and navigating to trade');
            setSelectedAccountId(account.id);
            bottomSheetRef.current?.close();
            // Navigate to trade screen
            router.push('/trade');
        } else {
            // For menu: Activate account behavior (existing logic)
            console.log('[BrokerBottomSheet] Menu context: Activating account');
            onActivateAccount();
        }
    };

    const getButtonConfig = () => {
        if (context === 'overview') {
            return {
                text: 'Trade',
                style: 'border border-primary-100',
                textStyle: 'text-primary-100'
            };
        } else {
            // Menu context - show activate/current based on selection
            if (isSelected) {
                return {
                    text: 'Current Account',
                    style: 'bg-green-600 border border-green-500',
                    textStyle: 'text-white'
                };
            } else {
                return {
                    text: 'Activate Account',
                    style: 'border border-primary-100',
                    textStyle: 'text-primary-100'
                };
            }
        }
    };

    const buttonConfig = getButtonConfig();


    const onTrade = useCallback(() => {
        if (!account?.id) {
            console.error('[DemoAccBottomSheet] No account available');
            return;
        }

        console.log('[DemoAccBottomSheet] Trading with account:', account.id);

        //Set the selected account
        setSelectedAccountId(account.id);

        bottomSheetRef.current?.close();

        router.push('/(tabs)/trade');

        toast({
            title: 'Success',
            description: `Switched to ${account.name} for trading`
        })
    }, [account?.id, account?.name, setSelectedAccountId, bottomSheetRef, router, toast]);

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

    const getPerformancePercentage = (): number => {
        if (accountData?.originalData) {
            const { balance, starting_balance } = accountData.originalData;
            if (starting_balance > 0) {
                return ((balance - starting_balance) / starting_balance) * 100;
            }
        }
        return getNumericValue(accountData?.changePercentage || '0');
    };

    const getAccountStats = () => {
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
                    onPress={handleActionButtonPress}
                    className={`mx-2 px-4 py-3 rounded-lg ${buttonConfig.style}`}
                >
                    <Text className={`font-InterSemiBold text-center ${buttonConfig.textStyle}`}>
                        {buttonConfig.text}
                    </Text>
                </TouchableOpacity>
            </BottomSheetView>
        </BottomSheetModal>
    );
};

export default BrokerBottomSheet;