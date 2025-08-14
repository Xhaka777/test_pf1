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
        <View className="w-full bg-propfirmone-main shadow-sm z-10">
            {/* {Platform.OS === 'ios' && (
                <View style={{ height: insets.top }} />
            )} */}
            <View className="flex-row items-center justify-between px-4 h-14">
                <MenuLogo />
                <TouchableOpacity
                    className="active:bg-gray-100 ml-auto"
                    onPress={() => router.push('/(tabs)/overview')}

                >
                    <X size={24} color='#898587' />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default MenuHeader;