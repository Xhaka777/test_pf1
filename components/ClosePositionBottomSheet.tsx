import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useCloseTradeMutation } from '@/api/hooks/trade-service';
import { OpenTradesData } from '@/api/schema';
import { StatusEnum } from '@/api/services/api';
import { PositionTypeEnum } from '@/shared/enums';

// Validation schema equivalent to web version
interface ClosePositionFormValues {
    amount: number;
    percentage: string;
}

// Utility function equivalent to web version
const roundQuantity = (value: number): number => {
    return Math.round(value * 100) / 100;
};

interface ClosePositionBottomSheetProps {
    openTrade: OpenTradesData['open_trades'][number];
    onClose: () => void;
    onLoadingChange?: (loading: boolean) => void;
}

const ClosePositionBottomSheet = forwardRef<BottomSheetModal, ClosePositionBottomSheetProps>(
    ({ openTrade, onClose, onLoadingChange }, ref) => {
        const { t } = useTranslation();
        const [isLoading, setIsLoading] = useState(false);
        const [selectedPercentage, setSelectedPercentage] = useState<string>('100');
        const [customAmount, setCustomAmount] = useState<string>(openTrade?.quantity?.toString() || '0.00');

        // API mutation
        const { mutateAsync: closeTrade } = useCloseTradeMutation();

        const snapPoints = useMemo(() => ['40%'], []);

        // Notify parent of loading state changes
        useEffect(() => {
            onLoadingChange?.(isLoading);
        }, [isLoading, onLoadingChange]);

        // Initialize form with trade data
        useEffect(() => {
            if (openTrade) {
                setCustomAmount(openTrade.quantity?.toString() || '0.00');
                setSelectedPercentage('100');
            }
        }, [openTrade]);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                resetForm();
                onClose();
            }
        }, [onClose]);

        const resetForm = useCallback(() => {
            setSelectedPercentage('100');
            setCustomAmount(openTrade?.quantity?.toString() || '0.00');
            setIsLoading(false);
        }, [openTrade]);

        const handleClose = useCallback(() => {
            if (isLoading) return; // Prevent closing while loading
            resetForm();
            onClose();
        }, [onClose, resetForm, isLoading]);

        // Handle percentage selection - matches web logic
        const handlePercentageClick = useCallback((percentage: string) => {
            if (openTrade && typeof openTrade.quantity === 'number' && !isNaN(openTrade.quantity)) {
                const calculatedAmount = roundQuantity((openTrade.quantity * Number(percentage)) / 100);
                setCustomAmount(calculatedAmount.toString());
                setSelectedPercentage(percentage);
            } else {
                setCustomAmount('0.00');
                setSelectedPercentage(percentage);
            }
        }, [openTrade]);

        // Validate and update custom amount
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
            
            // Clear percentage selection when manually editing
            setSelectedPercentage('');
        }, []);

        const incrementValue = useCallback(() => {
            const numValue = parseFloat(customAmount) || 0;
            const maxValue = openTrade?.quantity || 0;
            const newValue = Math.min(maxValue, roundQuantity(numValue + 0.01));
            setCustomAmount(newValue.toString());
            setSelectedPercentage('');
        }, [customAmount, openTrade]);

        const decrementValue = useCallback(() => {
            const numValue = parseFloat(customAmount) || 0;
            const newValue = Math.max(0.01, roundQuantity(numValue - 0.01));
            setCustomAmount(newValue.toString());
            setSelectedPercentage('');
        }, [customAmount]);

        // Toast function equivalent to web version
        const showToast = useCallback((title: string, description: string) => {
            Alert.alert(title, description);
        }, []);

        // Main submit handler - matches web version logic
        const onSubmit = useCallback(async () => {
            if (!openTrade) {
                Alert.alert('Error', 'No position selected');
                return;
            }

            if (isLoading) return;

            const amount = parseFloat(customAmount);
            
            // Validation
            if (amount <= 0) {
                Alert.alert('Error', t('Amount must be greater than 0'));
                return;
            }

            if (amount < 0.01) {
                Alert.alert('Error', t('Minimum amount is 0.01'));
                return;
            }

            if (amount > (openTrade.quantity || 0)) {
                Alert.alert('Error', t('Amount cannot exceed position size of {{size}}', { size: openTrade.quantity }));
                return;
            }

            const percentage = selectedPercentage || ((amount / (openTrade.quantity || 1)) * 100);
            
            Alert.alert(
                t('Close Position'),
                t('Are you sure you want to close {{amount}} ({{percentage}}%) of your {{type}} position in {{symbol}}?', {
                    amount: amount.toFixed(2),
                    percentage: percentage.toFixed(1),
                    type: openTrade.position_type,
                    symbol: openTrade.symbol
                }),
                [
                    { text: t('Cancel'), style: 'cancel' },
                    { 
                        text: t('Close'), 
                        style: 'destructive',
                        onPress: async () => {
                            setIsLoading(true);
                            
                            try {
                                const response = await closeTrade({
                                    symbol: openTrade.symbol,
                                    account: openTrade.account_id,
                                    position: openTrade.position_type,
                                    quantity: amount.toString(),
                                    trade_id: openTrade.order_id.toString(),
                                });

                                if (response.status === StatusEnum.SUCCESS) {
                                    showToast(
                                        'Position closed',
                                        'Your position has been successfully closed.'
                                    );
                                    onClose();
                                } else {
                                    showToast(
                                        'Error closing position',
                                        'Unable to close your position at this time. Please try again later.'
                                    );
                                }
                            } catch (error) {
                                showToast(
                                    'Error closing position',
                                    'Unable to close your position at this time. Please try again later.'
                                );
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    },
                ]
            );
        }, [openTrade, customAmount, selectedPercentage, isLoading, closeTrade, t, showToast, onClose]);

        // Percentage options - matches web version
        const percentageOptions = ['10', '25', '50', '75', '100'];

        if (!openTrade) return null;

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={!isLoading} // Prevent closing while loading
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
                            {t('Close Position')} - {openTrade.symbol}
                        </Text>
                        <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                            <Text className={`text-xl ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Position Info */}
                    <View className="mb-4 p-3 bg-gray-800 rounded-lg">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 text-sm">
                                {t('Position Size')}: {openTrade.quantity}
                            </Text>
                            <Text className="text-gray-400 text-sm">
                                {t('Position Type')}: {openTrade.position_type}
                            </Text>
                        </View>
                        <Text className="text-gray-400 text-sm mt-1">
                            {t('Current P/L')}: ${(openTrade.pnl || 0).toFixed(2)}
                        </Text>
                    </View>

                    {/* Close Trade Label */}
                    <Text className="text-white font-semibold mb-3">{t('Close Trade')}</Text>

                    {/* Percentage Buttons */}
                    <View className="flex-row justify-between mb-4">
                        {percentageOptions.map((percentage) => (
                            <TouchableOpacity
                                key={percentage}
                                className={`flex-1 mx-1 py-3 rounded-lg border ${
                                    selectedPercentage === percentage
                                        ? 'bg-primary-100 border-primary-200'
                                        : 'bg-secondary-focus border-secondary'
                                }`}
                                onPress={() => handlePercentageClick(percentage)}
                                disabled={isLoading}
                            >
                                <Text className={`text-center font-medium text-xs ${
                                    selectedPercentage === percentage ? 'text-white' : 'text-gray-300'
                                }`}>
                                    {percentage}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount Input */}
                    <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1 mb-6">
                        <TouchableOpacity
                            className="w-10 h-10 items-center justify-center"
                            onPress={decrementValue}
                            disabled={isLoading}
                        >
                            <Text className={`text-lg ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>−</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                            className="flex-1 text-center text-white text-lg py-3"
                            value={customAmount}
                            onChangeText={validateAndUpdateCustomAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                            editable={!isLoading}
                        />
                        
                        <TouchableOpacity
                            className="w-10 h-10 items-center justify-center"
                            onPress={incrementValue}
                            disabled={isLoading}
                        >
                            <Text className={`text-lg ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity
                        className={`rounded-lg py-4 mb-4 flex-row items-center justify-center ${
                            isLoading ? 'bg-red-400' : 'bg-red-600'
                        }`}
                        onPress={onSubmit}
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <ActivityIndicator 
                                size="small" 
                                color="white" 
                                className="mr-2" 
                            />
                        )}
                        <Text className={`text-white text-center font-semibold text-lg ${
                            isLoading ? 'opacity-70' : ''
                        }`}>
                            {isLoading 
                                ? t('Closing...') 
                                : openTrade.position_type === PositionTypeEnum.LONG
                                    ? t('Close Long')
                                    : t('Close Short')
                            }
                        </Text>
                    </TouchableOpacity>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

ClosePositionBottomSheet.displayName = 'ClosePositionBottomSheet';

export default ClosePositionBottomSheet;