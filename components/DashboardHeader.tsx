import { AccountDetails } from "@/api/schema";
import { View, Text, Image } from "react-native";
import { AccountTypeEnum } from "@/shared/enums";
import { AccountCard } from "./AccountCard";
import images from "@/constants/images";

type BadgeVariant = 'green' | 'destructiveDark' | 'blue' | 'indigo';

interface DashboardHeaderMobileProps {
    accountDetails: AccountDetails | undefined;
}

export function DashboardHeaderMobile({
    accountDetails,
}: DashboardHeaderMobileProps) {

    const typeLabelMap: Record<AccountTypeEnum, string> = {
        [AccountTypeEnum.DEMO]: 'Demo',
        [AccountTypeEnum.FUNDED]: 'Funded',
        [AccountTypeEnum.LIVE]: 'Live',
        [AccountTypeEnum.EVALUATION]: 'Evaluation',
        [AccountTypeEnum.COMPETITION]: 'Competition',
    };

    const typeColorMap: Record<AccountTypeEnum, { bg: string; text: string }> = {
        [AccountTypeEnum.DEMO]: { bg: 'bg-success-800', text: 'text-success-400' },
        [AccountTypeEnum.LIVE]: { bg: 'bg-red-800', text: 'text-red-400' },
        [AccountTypeEnum.FUNDED]: { bg: 'bg-success-800', text: 'text-success-400' },
        [AccountTypeEnum.EVALUATION]: { bg: 'bg-blue-800', text: 'text-blue-400' },
        [AccountTypeEnum.COMPETITION]: { bg: 'bg-purple-800', text: 'text-purple-400' },
    };

    if (!accountDetails) {
        return (
            <View className="flex-row items-center justify-between py-5 px-2">
                <View className="flex-row items-center">
                    <View className="border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4 bg-gray-800">
                        <Text className="text-gray-400 text-lg">?</Text>
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
    const accountTypeColors = typeColorMap[accountDetails.account_type] || { bg: 'bg-gray-800', text: 'text-gray-400' };

    // Get firm logo or use default
    const getFirmLogo = () => {
        // You can add logic here to map firm names to specific logos
        switch (accountDetails.firm?.toLowerCase()) {
            case 'ftmo':
                return images.alpha_capital; // Replace with actual FTMO logo
            case 'funded trader':
                return images.mini_funding_logo;
            default:
                return images.alpha_capital; // Default logo
        }
    };

    return (
        <View className="flex-row items-center justify-between py-5 px-2">
            <View className="flex-row items-center">
                <View className="border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4 bg-gray-800">
                    <Image
                        source={getFirmLogo()}
                        resizeMode="contain"
                        className="w-7 h-7"
                    />
                </View>
                <View className="flex-shrink">
                    <Text className="text-white text-lg font-InterBold">
                        {accountDetails.firm || accountDetails.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Image 
                            source={images.mini_funding_logo} 
                            className="w-4 h-4 rounded-full mr-1" 
                        />
                        <Text className="text-gray-400 text-sm opacity-90 font-Inter">
                            ID: {accountDetails.id}
                        </Text>
                    </View>
                </View>
            </View>
            <View className={`${accountTypeColors.bg} rounded-md px-3 py-0.5 mr-1`}>
                <Text className={`font-Inter text-base ${accountTypeColors.text}`}>
                    {accountTypeLabel}
                </Text>
            </View>
        </View>
    );
}