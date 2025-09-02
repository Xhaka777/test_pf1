// components/Header/logo.tsx - CLEAN VERSION
import images from "@/constants/images";
import { ChevronDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, Platform, TouchableOpacity, View, Text } from "react-native";
import { Dropdown } from "./dropdown";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAccounts } from "@/providers/accounts";
import { useGetAccountDetails } from "@/api/hooks/account-details";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { PlatformImage } from "../PlatformImage";

//Define your navigation param list type
type RootStackParamList = {
    '(tabs)': undefined;
    'menu': undefined;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export function Logo() {
    const navigation = useNavigation<NavigationProp>();
    const { selectedAccountId, allAccounts } = useAccounts();
    const { data: accountDetails } = useGetAccountDetails(selectedAccountId);
    const { data: openTrades } = useOpenPositionsWS();

    const selectedAccount = useMemo(() => {
        return [
            ...(allAccounts?.broker_accounts ?? []),
            ...(allAccounts?.prop_firm_accounts ?? []),
            ...(allAccounts?.bt_accounts ?? []),
            ...(allAccounts?.copier_accounts ?? []),
            ...(allAccounts?.competition_accounts ?? []),  
        ]?.find((account) => account.id === selectedAccountId);
    },[
        allAccounts?.broker_accounts,
        allAccounts?.bt_accounts,
        allAccounts?.competition_accounts,
        allAccounts?.copier_accounts,
        allAccounts?.prop_firm_accounts,
        selectedAccountId,
    ]);

    const openProfitLoss = useMemo(() => {
        if (!openTrades?.open_trades) {
            return 0;
        }

        return openTrades.open_trades.reduce((acc, trade) => {
            return acc + (trade.pl || 0);
        }, 0);
    }, [openTrades]);

    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const closeDropdown = () => {
        setIsDropdownVisible(false);
    };

    return (
        <View className="relative w-full flex-row items-center justify-between">
            {/* Left side - Logo with dropdown and separator */}
            <View className="flex-row items-center">
                <TouchableOpacity
                    className="flex-row items-center py-2 rounded-lg min-h-11 min-w-11"
                    onPress={toggleDropdown}
                    activeOpacity={0.8}
                >
                    <Image
                        source={images.logo}
                        className="w-7 h-7 mr-2"
                        resizeMode="contain"
                    />
                    <ChevronDown
                        size={20}
                        color="#898587"
                        style={[
                            Platform.OS === 'web' ? { transition: 'transform 0.2s ease-in-out' } : {},
                            { transform: [{ rotate: isDropdownVisible ? '180deg' : '0deg' }] }
                        ]}
                    />
                </TouchableOpacity>

                {/* Vertical separator */}
                <View className="h-7 w-px bg-gray-600 mx-3" />
                <View>
                    <Text className="text-sm text-gray-500 font-Inter">Balance</Text>
                    <Text className="text-sm text-gray-500 font-Inter">Open P/L</Text>
                </View>
            </View>

            {/* Right side - Values and profile dropdown */}
            <View className="flex-row items-center">
                <View className="mr-3">
                    <Text className="text-sm font-Inter text-white">
                        {accountDetails?.balance ? formatCurrency(accountDetails.balance) : '$0.00'}
                    </Text>
                    <Text className={`text-sm font-Inter text-right ${
                        openProfitLoss > 0 ? 'text-green-400' : 
                        openProfitLoss < 0 ? 'text-red-400' : 'text-white'
                    }`}>
                        {formatCurrency(openProfitLoss)}
                    </Text>
                </View>

                <TouchableOpacity
                    className="flex-row items-center bg-[#2F2C2D] py-3 px-2 rounded-lg"
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('menu')}
                >
                   <PlatformImage 
                    className="mr-1"
                    exchange={selectedAccount?.exchange}
                    size={24}
                   />
                    <ChevronDown
                        size={16}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            <Dropdown
                visible={isDropdownVisible}
                onClose={closeDropdown}
            />
        </View>
    );
}