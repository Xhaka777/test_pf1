import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MenuLogo from "./menuLogo";
import SignOutButton from "../SignOutButton";
import { X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { router } from "expo-router";

interface HeaderProps {
    onSignOut: () => void;
}

function MenuHeader({ onSignOut }: HeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View className="w-full bg-propfirmone-main shadow-sm z-10"
            style={{ paddingTop: insets.top }}
        >
            <View className="flex-row items-center justify-between px-4 h-14">
                <MenuLogo />
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/overview')}
                    className="p-2"
                    activeOpacity={0.7}
                >
                    <X size={24} color='#898587' />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default MenuHeader;