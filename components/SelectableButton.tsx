import React from "react"
import { Text, TouchableOpacity } from "react-native"

const SelectableButton = ({
    text,
    isSelected,
    onPress,
    additionalStyles = '',
    selectedBorderColor = 'border-primary',
    unselectedBorderColor = 'border-gray-700',
    textAdditionalStyles = ''
}) => {
    return (
        <TouchableOpacity
            className={`flex-1 py-3 rounded-lg bg-propfirmone-300 border items-center justify-center bg-transparent 
                ${isSelected ? selectedBorderColor : unselectedBorderColor
                } ${additionalStyles}`}
            onPress={onPress}
        >
            <Text className={`text-white font-Inter ${textAdditionalStyles}`}>
                {text}
            </Text>
        </TouchableOpacity>
    )
}

export default SelectableButton;