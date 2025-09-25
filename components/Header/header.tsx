import { Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "./logo";

interface HeaderProps {
    onSignOut: () => void;
}

function Header({ onSignOut }: HeaderProps) {

    return (
        <View className="w-full bg-propfirmone-main shadow-sm z-10 mt-10">
            <View className="flex-row items-center justify-between px-4 h-16">
                <Logo />
            </View>
        </View>
    )
}

export default Header;