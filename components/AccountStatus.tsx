import { Text, View } from "react-native";


interface AccountStatusProps {
    isActive: boolean;
}

export function AccountStatus({ isActive }: AccountStatusProps) {
    return (
        <View className="flex-row items-center space-x-1">
            <View
                className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-theme' : 'bg-red-theme'
                    }`}
            />
            <Text className={`text-xs font-normal ${isActive ? 'text-green-theme' : 'text-red-theme'}`}>
                {isActive ? 'Active' : 'Not active'}
            </Text>
        </View>
    );
}