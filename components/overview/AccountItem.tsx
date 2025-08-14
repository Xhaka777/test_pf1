import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface Account {
    id: string;
    name: string;
    category: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
}

interface AccountItemProps {
    account: Account;
    onPress: (account: Account) => void;
    isSelected: boolean;
}

const AccountItem = ({ account, onPress, isSelected }: AccountItemProps) => {
    const IconComponent = account.icon;

    // Different icon sizes for different account types
    const getIconSize = (accountId: string) => {
        switch (accountId) {
            case 'evaluation':
            case 'funded':
                return 32; // These SVGs are designed for 32px
            case 'live':
            case 'demo':
            default:
                return 40; // These SVGs are designed for 40px
        }
    };

    return (
        <TouchableOpacity
            className={`flex-row items-center py-4 px-4 my-1 mx-2 rounded-xl ${
                isSelected ? 'bg-[#1E1E2D]' : 'bg-transparent'
            }`}
            onPress={() => onPress(account)}
            activeOpacity={0.7}
        >
            {/* Icon Container */}
            <View className="w-10 h-10 items-center justify-center">
                <IconComponent size={getIconSize(account.id)} />
            </View>

            {/* Account Info */}
            <View className="flex-1 ml-4">
                <Text className={`text-base font-medium ${
                    isSelected ? 'text-white' : 'text-white'
                }`}>
                    {account.name}
                </Text>
            </View>

        </TouchableOpacity>
    );
};

export default AccountItem;