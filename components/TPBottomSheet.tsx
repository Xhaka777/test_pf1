import React, { forwardRef, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { TakeProfitSlTypeEnum } from "@/shared/enums";

interface TPBottomSheetProps {
    onClose: () => void;
    selectedType: string;
    onTypeSelect: (type: TakeProfitSlTypeEnum) => void;
    title?: string;
    isStopLoss?: boolean;
}

const TPBottomSheet = forwardRef<BottomSheetModal, TPBottomSheetProps>(({
    onClose,
    selectedType,
    onTypeSelect,
    title,
    isStopLoss = false
}, ref) => {
    const snapPoints = useMemo(() => ['20%'], []);

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

    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            onClose();
        }
    };

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backgroundStyle={{
                backgroundColor: '#100E0F',
                borderColor: '#1E1E2D',
                borderWidth: 1,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
            }}
            handleIndicatorStyle={{ backgroundColor: '#100E0F' }}
            onChange={handleSheetChanges}
        >
            <BottomSheetView className="flex-1 px-4">
                <View className="flex-row items-center justify-between py-3 mb-4">
                    <View className="flex-1">
                        <Text className="text-white text-lg font-InterSemiBold">
                            {dynamicTitle}
                        </Text>
                    </View>
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
                                className={`flex-1 py-1 px-3 mb-4 rounded-lg items-center justify-center border ${isSelected
                                    ? 'bg-[#252223] border-[#898587]'
                                    : 'bg-[#1A1819] border-gray-600'
                                    }`}
                                onPress={() => handleTypeSelect(option.value)}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`Select ${option.label}`}
                                accessibilityState={{ selected: isSelected }}
                            >
                                <Text className={`text-base font-InterSemiBold mb-1 ${isSelected ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    );
});

TPBottomSheet.displayName = 'TPBottomSheet';

export default TPBottomSheet;