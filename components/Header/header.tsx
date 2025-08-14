import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "./logo";

interface HeaderProps {
    onSignOut: () => void;
}

function Header({ onSignOut }: HeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View className="w-full bg-propfirmone-main shadow-sm z-10">
            {/* {Platform.OS === 'ios' && (
                <View style={{ height: insets.top }} />
            )} */}
            <View className="flex-row items-center justify-between px-4 h-14">
                <Logo />
            </View>
            <View className="w-full h-0.5 bg-gray-800" />
        </View>
    )
}

export default Header;