import { AccountDetails } from "@/api/schema";
import { View, Text, Image } from "react-native";
import { AccountTypeEnum } from "@/shared/enums";
import { AccountCard } from "./AccountCard";
import images from "@/constants/images";
import { useAccounts } from "@/providers/accounts";
import { useMemo } from "react";
import { PlatformImage } from "./PlatformImage";

type BadgeVariant = 'green' | 'destructiveDark' | 'blue' | 'indigo';

interface DashboardHeaderMobileProps {
    accountDetails: AccountDetails | undefined;
}

export function DashboardHeaderMobile({
    accountDetails,
}: DashboardHeaderMobileProps) {

    const { selectedAccountId, allAccounts } = useAccounts();

    const selectedAccount = useMemo(() => {
        return [
            ...(allAccounts?.broker_accounts ?? []),
            ...(allAccounts?.prop_firm_accounts ?? []),
            ...(allAccounts?.bt_accounts ?? []),
            ...(allAccounts?.copier_accounts ?? []),
            ...(allAccounts?.competition_accounts ?? []),
        ]?.find((account) => account.id === selectedAccountId);
    }, [
        allAccounts?.broker_accounts,
        allAccounts?.bt_accounts,
        allAccounts?.competition_accounts,
        allAccounts?.copier_accounts,
        allAccounts?.prop_firm_accounts,
        selectedAccountId
    ]);

    const typeLabelMap: Record<AccountTypeEnum, string> = {
        [AccountTypeEnum.DEMO]: 'Demo',
        [AccountTypeEnum.FUNDED]: 'Funded',
        [AccountTypeEnum.LIVE]: 'Live',
        [AccountTypeEnum.EVALUATION]: 'Evaluation',
        [AccountTypeEnum.COMPETITION]: 'Competition',
    };

    // Updated color mapping to match BrokerBottomSheet and AccountScreenChart patterns
    const typeColorMap: Record<AccountTypeEnum, { bg: string; text: string }> = {
        [AccountTypeEnum.DEMO]: { bg: '#633112', text: '#FACA15' }, // Practice/Demo colors
        [AccountTypeEnum.LIVE]: { bg: '#771D1D', text: '#F98080' }, // Live/Broker colors  
        [AccountTypeEnum.FUNDED]: { bg: '#014737', text: '#31C48D' }, // Funded colors
        [AccountTypeEnum.EVALUATION]: { bg: '#4A1D96', text: '#CABFFD' }, // Challenge/Evaluation colors
        [AccountTypeEnum.COMPETITION]: { bg: '#4A1D96', text: '#CABFFD' }, // Competition uses same as evaluation
    };

    // Helper function to get firm initials
    const getFirmInitials = (firmName: string | undefined): string => {
        if (!firmName) return '?';
        return firmName.toUpperCase().slice(0, 2);
    };

    if (!accountDetails) {
        return (
            <View className="flex-row items-center justify-between py-5 px-2">
                <View className="flex-row items-center">
                    <View className="border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4 bg-gray-800">
                        <Text className="text-gray-400 text-lg font-InterBold">?</Text>
                    </View>
                    <View className="flex-shrink">
                        <Text className="text-white text-lg font-InterBold">Loading...</Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-gray-400 text-sm opacity-90 font-Inter">ID: ---</Text>
                        </View>
                    </View>
                </View>
                <View className="bg-gray-800 rounded-md px-3 py-0.5 mr-1">
                    <Text className="font-Inter text-base text-gray-400">
                        ---
                    </Text>
                </View>
            </View>
        );
    }

    const accountTypeLabel = typeLabelMap[accountDetails.account_type] || 'Unknown';
    const accountTypeColors = typeColorMap[accountDetails.account_type] || { bg: '#4F494C', text: '#898587' };
    const firmName = accountDetails.firm || accountDetails.name;

    return (
        <View className="flex-row items-center justify-between py-5 px-2">
            <View className="flex-row items-center">
                <View className="border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4 bg-[#2F2C2D]">
                    <Text className="text-white text-lg font-InterBold">
                        {getFirmInitials(firmName)}
                    </Text>
                </View>
                <View className="flex-shrink">
                    <Text className="text-white text-lg font-InterBold">
                        {firmName}
                    </Text>
                    <View className="flex-row items-center">
                        <PlatformImage
                            exchange={selectedAccount?.exchange}
                            className="w-3 h-3 rounded-full mr-1"
                        />
                        <Text className="text-gray-400 text-sm opacity-90 font-Inter">
                            ID: {accountDetails.id}
                        </Text>
                    </View>
                </View>
            </View>
            <View 
                className="rounded-md px-3 py-0.5 mr-1"
                style={{ backgroundColor: accountTypeColors.bg }}
            >
                <Text 
                    className="font-Inter text-base"
                    style={{ color: accountTypeColors.text }}
                >
                    {accountTypeLabel}
                </Text>
            </View>
        </View>
    );
}