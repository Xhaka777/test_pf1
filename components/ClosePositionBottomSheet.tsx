import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import BottomSheet, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';

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

const ClosePositionBottomSheet = forwardRef<BottomSheetModal, ClosePositionBottomSheetProps>(
    ({ position, onClose, onClosePosition }, ref) => {
        const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
        const [customAmount, setCustomAmount] = useState('0.00');

        const snapPoints = useMemo(() => ['35%'], []);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                resetForm();
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
            if (position) {
                const amount = (position.size * percentage / 100).toFixed(2);
                setCustomAmount(amount);
            }
        }, [position]);

        const validateAndUpdateCustomAmount = useCallback((text: string) => {
            // Remove non-numeric characters except decimal point
            const numericText = text.replace(/[^0-9.]/g, '');
            
            // Ensure only one decimal point
            const parts = numericText.split('.');
            if (parts.length > 2) {
                return;
            }
            
            // Limit decimal places to 2
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].substring(0, 2);
            }
            
            const finalText = parts.join('.');
            setCustomAmount(finalText);
            setSelectedPercentage(null); // Clear percentage selection
        }, []);

        const incrementValue = useCallback(() => {
            const numValue = parseFloat(customAmount) || 0;
            const maxValue = position?.size || 0;
            const newValue = Math.min(maxValue, numValue + 0.01);
            setCustomAmount(newValue.toFixed(2));
            setSelectedPercentage(null);
        }, [customAmount, position]);

        const decrementValue = useCallback(() => {
            const numValue = parseFloat(customAmount) || 0;
            const newValue = Math.max(0, numValue - 0.01);
            setCustomAmount(newValue.toFixed(2));
            setSelectedPercentage(null);
        }, [customAmount]);

        const handleClosePosition = useCallback(() => {
            if (!position) {
                Alert.alert('Error', 'No position selected');
                return;
            }

            const amount = parseFloat(customAmount);
            if (amount <= 0) {
                Alert.alert('Error', 'Amount must be greater than 0');
                return;
            }

            if (amount > position.size) {
                Alert.alert('Error', `Amount cannot exceed position size of ${position.size}`);
                return;
            }

            const percentage = selectedPercentage || ((amount / position.size) * 100);
            
            Alert.alert(
                'Close Position',
                `Are you sure you want to close ${amount} (${percentage.toFixed(1)}%) of your ${position.type} position in ${position.symbol}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Close', 
                        style: 'destructive',
                        onPress: () => {
                            onClosePosition(percentage, customAmount);
                            resetForm();
                        }
                    },
                ]
            );
        }, [position, selectedPercentage, customAmount, onClosePosition, resetForm]);

        const percentageOptions = [10, 25, 50, 75, 100];

        if (!position) return null;

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={{ 
                    backgroundColor: '#100E0F', 
                    borderColor: '#1E1E2D', 
                    borderWidth: 1 
                }}
                handleIndicatorStyle={{ backgroundColor: '#666' }}
                onChange={handleSheetChanges}
            >
                <BottomSheetView className="flex-1 px-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between py-3 mb-4">
                        <Text className="text-white text-lg font-semibold">
                            Close Position - {position.symbol}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text className="text-gray-400 text-xl">✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Position Info */}
                    <View className="mb-4 p-3 bg-gray-800 rounded-lg">
                        <Text className="text-gray-400 text-sm">Position Size: {position.size}</Text>
                        <Text className="text-gray-400 text-sm">Current P/L: ${position.pnl.toFixed(2)}</Text>
                    </View>

                    {/* Close Trade Label */}
                    <Text className="text-white font-medium mb-4">Close Trade</Text>

                    {/* Percentage Buttons */}
                    <View className="flex-row justify-between mb-6">
                        {percentageOptions.map((percentage) => (
                            <TouchableOpacity
                                key={percentage}
                                className={`flex-1 mx-1 py-3 rounded-lg ${
                                    selectedPercentage === percentage
                                        ? 'bg-primary-100 border border-primary-200'
                                        : 'bg-propfirmone-200 border border-gray-800'
                                }`}
                                onPress={() => handlePercentageSelect(percentage)}
                            >
                                <Text className={`text-center font-medium ${
                                    selectedPercentage === percentage ? 'text-white' : 'text-gray-300'
                                }`}>
                                    {percentage}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount Input */}
                    <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1 mb-4">
                        <TouchableOpacity
                            className="w-8 h-8 items-center justify-center"
                            onPress={decrementValue}
                        >
                            <Text className="text-gray-400 text-lg">−</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                            className="flex-1 text-center text-white text-lg py-3"
                            value={customAmount}
                            onChangeText={validateAndUpdateCustomAmount}
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
                        className="bg-red-600 rounded-lg py-3 mb-4"
                        onPress={handleClosePosition}
                    >
                        <Text className="text-white text-center font-semibold text-lg">
                            Close {position.type} Position
                        </Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

ClosePositionBottomSheet.displayName = 'ClosePositionBottomSheet';

export default ClosePositionBottomSheet;