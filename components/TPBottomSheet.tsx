import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { TakeProfitSlTypeEnum } from "@/shared/enums";

interface TPBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet>;
    onClose: () => void;
    selectedType: string;
    onTypeSelect: (type: TakeProfitSlTypeEnum) => void;
    title?: string;
    isStopLoss?: boolean;
}

const TPBottomSheet = ({
    bottomSheetRef,
    onClose,
    selectedType,
    onTypeSelect,
    title,
    isStopLoss = false
}: TPBottomSheetProps) => {
    const snapPoints = useMemo(() => ['45%'], []);

    const dynamicTitle = useMemo(() => {
        if (title) return title;
        return isStopLoss ? 'Stop Loss (SL)' : 'Take Profit (TP)';
    }, [title, isStopLoss])

    const typeOptions = useMemo(() => [
        {
            value: TakeProfitSlTypeEnum.PRICE,
            label: 'Price',
            description: 'Set level by price value'
        },
        {
            value: TakeProfitSlTypeEnum.PIPS,
            label: 'Pips',
            description: 'Set level by pips distance'
        }
    ], []);

    const handleTypeSelect = (type: TakeProfitSlTypeEnum) => {
        onTypeSelect(type);
        onClose();
    };

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{ backgroundColor: '#1A1819' }}
            handleIndicatorStyle={{ backgroundColor: '#898587' }}
        >
            <BottomSheetView className="flex-1 px-4">
                <View className="flex-row items-center justify-between py-3 mb-4">
                    <Text className="text-white text-lg font-InterSemiBold">
                        {dynamicTitle}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">
                        Select unit type
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-2"
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <X size={24} color='#898587' />
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 mb-4">
                    {typeOptions.map((option) => {
                        const isSelected = selectedType === option.value;

                        return (
                            <TouchableOpacity
                                key={option.value}
                                className={`flex-1 py-4 px-3 rounded-lg items-center justify-center border ${isSelected
                                    ? 'bg-[#252223] border-[#898587]'
                                    : 'bg-[#1A1819] border-gray-600'
                                    }`}
                                onPress={() => handleTypeSelect(option.value)}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`${'Select'} ${option.label}`}
                                accessibilityState={{ selected: isSelected }}
                            >
                                <Text className={`text-base font-InterSemiBold mb-1 ${isSelected ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {option.label}
                                </Text>
                                <Text className={`text-xs text-center ${isSelected ? 'text-gray-300' : 'text-gray-500'
                                    }`}>
                                    {option.description}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </BottomSheetView>
        </BottomSheet>
    );
};

export default TPBottomSheet;