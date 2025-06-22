import images from "@/constants/images";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Image, Platform, TouchableOpacity, View, Text } from "react-native";
import { Dropdown } from "./dropdown";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp} from '@react-navigation/stack';


//Define your navigation param list type
type RootStackParamList = {
    '(tabs)': undefined;
    'menu': undefined;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function Logo() {
    const navigation = useNavigation<NavigationProp>();

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



            {/* Right side - Values and profile dropdown (pushed to end) */}
            <View className="flex-row items-center">
                <View className="mr-3">
                    <Text className="text-sm font-Inter text-white">$1000</Text>
                    <Text className="text-sm font-Inter text-white text-right">$0</Text>
                </View>

                <TouchableOpacity
                    className="flex-row items-center bg-[#2F2C2D] py-3 px-2 rounded-lg"
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('menu')}
                >
                    <Image
                        source={images.mini_funding_logo}
                        className="w-6 h-6 rounded-full mr-1"
                        resizeMode="contain"
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