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
    // const navigation = useNavigation();
        // const navigation = useNavigation<StackNavigationProp<any>>(); // Explicitly type navigation


    return (
        <View className="w-full bg-propfirmone-main shadow-sm z-10"
            style={{
                paddingTop: Platform.OS === 'web' ? 16 : Math.max(insets.top, 16)
            }}
        >
            <View className="flex-row items-center justify-between px-4 h-14">
                <MenuLogo />
                <TouchableOpacity
                    className="active:bg-gray-100 ml-auto"
                    // onPress={() => navigation.goBack()}
                    // onPress={() => navigation.navigate('index')} // Explicit navigation
                    onPress={() => router.push('/(tabs)/overview')}

                >
                    <X size={24} color='#898587' />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default MenuHeader;