import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";

interface TPBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheet>;
    onClose: () => void;
    selectedType: string;
    onTypeSelect: (type: string) => void;
    title: string; // "Take Profit (TP)" or "Stop Loss (SL)"
}

const TPBottomSheet = ({ bottomSheetRef, onClose, selectedType, onTypeSelect, title }: TPBottomSheetProps) => {
    const snapPoints = useMemo(() => ['45%'], []);

    const handleTypeSelect = (type: string) => {
        onTypeSelect(type);
        onClose(); // Close the bottom sheet after selection
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
                    <Text className="text-white text-lg font-InterSemiBold">{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color='#898587' />
                    </TouchableOpacity>
                </View>
                
                <View className="flex-row gap-2 mb-4">
                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-md items-center justify-center ${
                            selectedType === 'Price' ? 'bg-[#252223] border border-[#898587]' : 'bg-[#1A1819] border border-gray-600'
                        }`}
                        onPress={() => handleTypeSelect('Price')}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-sm font-InterSemiBold ${
                            selectedType === 'Price' ? 'text-white' : 'text-gray-400'
                        }`}>
                            Price
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-1 py-3 rounded-md items-center justify-center ${
                            selectedType === 'Pips' ? 'bg-[#252223] border border-[#898587]' : 'bg-[#1A1819] border border-gray-600'
                        }`}
                        onPress={() => handleTypeSelect('Pips')}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-sm font-InterSemiBold ${
                            selectedType === 'Pips' ? 'text-white' : 'text-gray-400'
                        }`}>
                            Pips
                        </Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};

export default TPBottomSheet;