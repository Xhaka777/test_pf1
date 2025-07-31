import { Text, View } from "react-native";


interface AccountStatusProps {
    isActive: boolean;
}

export function AccountStatus({ isActive }: AccountStatusProps) {
    return (
        <View className="flex-row items-center space-x-1">
            <View
                className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#31C48D]' : 'bg-red-theme'
                    }`}
            />
            <Text className={`text-base font-InterRegular ml-1 ${isActive ? 'text-[#31C48D]' : 'text-red'}`}>
                {isActive ? 'Active' : 'Not active'}
            </Text>
        </View>
    );
}