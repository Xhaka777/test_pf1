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

function MenuLogo() {
    const navigation = useNavigation<NavigationProp>();

    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const closeDropdown = () => {
        setIsDropdownVisible(false);
    };

    return (
        <View className="relative flex-row items-center justify-between">
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
            </View>




            <Dropdown
                visible={isDropdownVisible}
                onClose={closeDropdown}
            />
        </View>
    );
}

export default MenuLogo;