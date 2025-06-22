import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import SelectableButton from './SelectableButton';

interface Position {
    id: string;
    symbol: string;
    type: 'LONG' | 'SHORT';
    size: number;
    pnl: number;
    entry: number;
    fees: number;
    tp?: number;
    sl?: number;
    roi: number;
    openTime: string;
}

interface ClosePositionBottomSheetProps {
    position: Position | null;
    onClose: () => void;
    onClosePosition: (percentage: number, customAmount?: string) => void;
}

const ClosePositionBottomSheet = forwardRef<BottomSheet, ClosePositionBottomSheetProps>(
    ({ position, onClose, onClosePosition }, ref) => {
        const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
        const [customAmount, setCustomAmount] = useState('0.00');

        // Bottom sheet snap points
        // const snapPoints = useMemo(() => ['35%', '50%'], []);
        const snapPoints = useMemo(() => ['15%'], []);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                onClose();
            }
        }, [onClose]);

        const resetForm = useCallback(() => {
            setSelectedPercentage(null);
            setCustomAmount('0.00');
        }, []);

        const handleClose = useCallback(() => {
            resetForm();
            onClose();
        }, [onClose, resetForm]);

        const handlePercentageSelect = useCallback((percentage: number) => {
            setSelectedPercentage(percentage);
            // Calculate the amount based on position size
            if (position) {
                const amount = (position.size * percentage / 100).toFixed(2);
                setCustomAmount(amount);
            }
        }, [position]);

        const incrementValue = () => {
            const numValue = parseFloat(customAmount) || 0;
            const maxValue = position?.size || 0;
            const newValue = Math.min(maxValue, numValue + 0.01);
            setCustomAmount(newValue.toFixed(2));
            setSelectedPercentage(null); // Clear percentage selection when manually editing
        };

        const decrementValue = () => {
            const numValue = parseFloat(customAmount) || 0;
            const newValue = Math.max(0, numValue - 0.01);
            setCustomAmount(newValue.toFixed(2));
            setSelectedPercentage(null); // Clear percentage selection when manually editing
        };

        const handleClosePosition = useCallback(() => {
            const percentage = selectedPercentage || 0;
            onClosePosition(percentage, customAmount);
            resetForm();
        }, [selectedPercentage, customAmount, onClosePosition, resetForm]);

        const percentageOptions = [10, 25, 50, 75, 100];

        return (
            <BottomSheet
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1E1E2D', borderWidth: 1 }}
                handleIndicatorStyle={{ backgroundColor: '#666' }}
            >
                <BottomSheetView className="flex-1 px-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between py-3 mb-4">
                        <Text className="text-white text-lg font-semibold">Close Position</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text className="text-gray-400 text-xl">✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Close Trade Label */}
                    <Text className="text-white font-medium mb-4">Close Trade</Text>

                    {/* Percentage Buttons */}
                    <View className="flex-row justify-between mb-6">
                        {percentageOptions.map((percentage) => (
                            <TouchableOpacity
                                key={percentage}
                                className={`flex-1 mx-1 py-3 rounded-lg ${selectedPercentage === percentage
                                    ? 'bg-propfirmone-200 border border-gray-800'
                                    : 'bg-propfirmone-200'
                                    }`}
                                onPress={() => handlePercentageSelect(percentage)}
                            >
                                <Text className="text-white text-center font-medium">
                                    {percentage}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount Input */}
                    <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1">
                        <TouchableOpacity
                            className="w-8 h-8 items-center justify-center"
                            onPress={decrementValue}
                        >
                            <Text className="text-gray-400 text-lg">−</Text>
                        </TouchableOpacity>
                        <TextInput
                            className="flex-1 text-center text-white text-lg"
                            value={customAmount}
                            onChangeText={(text) => {
                                setCustomAmount(text);
                                setSelectedPercentage(null); // Clear percentage selection
                            }}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                            className="w-8 h-8 items-center justify-center"
                            onPress={incrementValue}
                        >
                            <Text className="text-gray-400 text-lg">+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity
                        className="bg-green-500 rounded-lg py-3 mb-4 mt-4"
                        onPress={handleClosePosition}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Close {position?.type || 'Position'}
                        </Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheet>
        );
    }
);

ClosePositionBottomSheet.displayName = 'ClosePositionBottomSheet';

export default ClosePositionBottomSheet;