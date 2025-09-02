import images from "@/constants/images";
import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import { Dropdown } from "./Header/dropdown";

interface LogoDropdownProps {
    className?: string;
    logoSize?: number;
    chevronSize?: number;
    chevronColor?: string;
}

export function LogoDropdown({
    className = "",
    logoSize = 28,
    chevronSize = 20,
    chevronColor = "#898587"
}: LogoDropdownProps) {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const closeDropdown = () => {
        setIsDropdownVisible(false);
    };

    return (
        <View className={`relative ${className}`}>
            <TouchableOpacity
                className="flex-row items-center py-2 rounded-lg"
                onPress={toggleDropdown}
                activeOpacity={0.8}
            >
                <Image
                    source={images.logo}
                    style={{ width: logoSize, height: logoSize }}
                    className="mr-2"
                    resizeMode="contain"
                />
                <ChevronDown
                    size={chevronSize}
                    color={chevronColor}
                    style={[
                        Platform.OS === 'web' ? { transition: 'transform 0.2s ease-in-out' } : {},
                        { transform: [{ rotate: isDropdownVisible ? '180deg' : '0deg' }] }
                    ]}
                />
            </TouchableOpacity>

            <Dropdown
                visible={isDropdownVisible}
                onClose={closeDropdown}
            />
        </View>
    );
}