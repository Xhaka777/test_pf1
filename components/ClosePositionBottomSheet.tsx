import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useCloseTradeMutation } from '@/api/hooks/trade-service';
import { OpenTradesData } from '@/api/schema';
import { StatusEnum } from '@/api/services/api';
import { PositionTypeEnum } from '@/shared/enums';
import { z } from 'zod';

// Enhanced schema matching web version
export const ClosePositionFormSchema = z.object({
    percentage: z.enum(['10', '25', '50', '75', '100']),
    amount: z.number().min(0.01, 'Amount must be at least 0.01'),
});

export type ClosePositionFormValues = z.infer<typeof ClosePositionFormSchema>;

// Utility function from web version
const roundQuantity = (value: number): number => {
    return Math.round(value * 100) / 100;
};

// Enhanced helper function for button colors
const getPositionTypeButtonColor = (positionType: string, isLoading: boolean) => {
    const isLongPosition = positionType === PositionTypeEnum.LONG || 
                          positionType === 'BUY' || 
                          positionType.toLowerCase().includes('buy') || 
                          positionType.toLowerCase().includes('long');

    if (isLoading) {
        return isLongPosition ? 'bg-green-400' : 'bg-red-400';
    }

    return isLongPosition ? 'bg-green-500' : 'bg-red-500';
};

interface ClosePositionBottomSheetProps {
    openTrade: OpenTradesData['open_trades'][number] | OpenTradesData['open_orders'][number] | null;
    onClose: () => void;
    onLoadingChange?: (loading: boolean) => void;
}

const ClosePositionBottomSheet = forwardRef<BottomSheetModal, ClosePositionBottomSheetProps>(
    ({ openTrade, onClose, onLoadingChange }, ref) => {
        const { t } = useTranslation();
        const [isLoading, setIsLoading] = useState(false);
        const [formData, setFormData] = useState<ClosePositionFormValues>({
            percentage: '100',
            amount: 0
        });
        const [errors, setErrors] = useState<Partial<Record<keyof ClosePositionFormValues, string>>>({});

        // API mutation
        const { mutateAsync: closeTrade } = useCloseTradeMutation();

        const snapPoints = useMemo(() => ['35%'], []);

        // Notify parent of loading state changes
        useEffect(() => {
            onLoadingChange?.(isLoading);
        }, [isLoading, onLoadingChange]);

        // Initialize form with trade data - enhanced logic from web
        useEffect(() => {
            if (openTrade && typeof openTrade.quantity === 'number') {
                setFormData({
                    percentage: '100',
                    amount: roundQuantity(openTrade.quantity)
                });
                setErrors({});
            }
        }, [openTrade]);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                resetForm();
                onClose();
            }
        }, [onClose]);

        const resetForm = useCallback(() => {
            if (openTrade && typeof openTrade.quantity === 'number') {
                setFormData({
                    percentage: '100',
                    amount: roundQuantity(openTrade.quantity)
                });
            }
            setErrors({});
            setIsLoading(false);
        }, [openTrade]);

        const handleClose = useCallback(() => {
            if (isLoading) return;
            resetForm();
            onClose();
        }, [onClose, resetForm, isLoading]);

        // Enhanced percentage handling from web version
        const handlePercentageClick = useCallback((percentage: ClosePositionFormValues['percentage']) => {
            if (openTrade && typeof openTrade.quantity === 'number' && !isNaN(openTrade.quantity)) {
                const calculatedAmount = roundQuantity((openTrade.quantity * Number(percentage)) / 100);
                setFormData(prev => ({
                    ...prev,
                    amount: calculatedAmount,
                    percentage
                }));
                // Clear amount errors when selecting percentage
                setErrors(prev => ({ ...prev, amount: undefined }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    amount: 0,
                    percentage
                }));
            }
        }, [openTrade]);

        // Enhanced amount validation and update
        const handleAmountChange = useCallback((text: string) => {
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
            const numValue = parseFloat(finalText) || 0;
            
            setFormData(prev => ({
                ...prev,
                amount: numValue,
                percentage: '' as any // Clear percentage when manually editing
            }));

            // Real-time validation
            validateAmount(numValue);
        }, [openTrade]);

        const validateAmount = useCallback((amount: number) => {
            const maxQuantity = openTrade?.quantity || 0;
            
            if (amount < 0.01) {
                setErrors(prev => ({ ...prev, amount: t('Minimum amount is 0.01') }));
                return false;
            }
            
            if (amount > maxQuantity) {
                setErrors(prev => ({ 
                    ...prev, 
                    amount: t('Amount cannot exceed position size of {{size}}', { size: maxQuantity }) 
                }));
                return false;
            }

            setErrors(prev => ({ ...prev, amount: undefined }));
            return true;
        }, [openTrade, t]);

        const incrementValue = useCallback(() => {
            const maxValue = openTrade?.quantity || 0;
            const newValue = Math.min(maxValue, roundQuantity(formData.amount + 0.01));
            setFormData(prev => ({
                ...prev,
                amount: newValue,
                percentage: '' as any
            }));
            validateAmount(newValue);
        }, [formData.amount, openTrade, validateAmount]);

        const decrementValue = useCallback(() => {
            const newValue = Math.max(0.01, roundQuantity(formData.amount - 0.01));
            setFormData(prev => ({
                ...prev,
                amount: newValue,
                percentage: '' as any
            }));
            validateAmount(newValue);
        }, [formData.amount, validateAmount]);

        // Enhanced validation function
        const validateForm = useCallback((): boolean => {
            const result = ClosePositionFormSchema.safeParse(formData);
            
            if (!result.success) {
                const fieldErrors: Partial<Record<keyof ClosePositionFormValues, string>> = {};
                result.error.errors.forEach(error => {
                    if (error.path.length > 0) {
                        const field = error.path[0] as keyof ClosePositionFormValues;
                        fieldErrors[field] = error.message;
                    }
                });
                setErrors(fieldErrors);
                return false;
            }

            // Additional custom validation
            return validateAmount(formData.amount);
        }, [formData, validateAmount]);

        // Toast function
        const showToast = useCallback((title: string, description: string) => {
            Alert.alert(title, description);
        }, []);

        // Enhanced submit handler matching web logic
        const onSubmit = useCallback(async () => {
            if (!openTrade) {
                Alert.alert('Error', 'No position selected');
                return;
            }

            if (isLoading) return;

            // Validate form
            if (!validateForm()) {
                const errorMessage = Object.values(errors).find(error => error);
                if (errorMessage) {
                    Alert.alert('Validation Error', errorMessage);
                }
                return;
            }

            const { amount } = formData;
            // Calculate percentage properly - if percentage is selected use it, otherwise calculate from amount
            const calculatedPercentage = formData.percentage 
                ? Number(formData.percentage)
                : ((amount / (openTrade.quantity || 1)) * 100);

            // Type guard to check if it's a trade or order
            const isOrder = !('position_type' in openTrade);
            const positionType = isOrder ? 'BUY' : openTrade.position_type;
            const symbol = openTrade.symbol;

            Alert.alert(
                t('Close Position'),
                `Are you sure you want to close ${amount.toFixed(2)} (${calculatedPercentage.toFixed(1)}%) of your ${positionType} position in ${symbol}?`,
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
                                    position: positionType,
                                    quantity: amount.toString(),
                                    trade_id: openTrade.order_id.toString(),
                                });

                                if (response.status === StatusEnum.SUCCESS) {
                                    showToast(
                                        t('Position closed'),
                                        t('Your position has been successfully closed.')
                                    );
                                    onClose();
                                } else {
                                    showToast(
                                        t('Error closing position'),
                                        t('Unable to close your position at this time. Please try again later.')
                                    );
                                }
                            } catch (error) {
                                console.error('Close position error:', error);
                                showToast(
                                    t('Error closing position'),
                                    t('Unable to close your position at this time. Please try again later.')
                                );
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    },
                ]
            );
        }, [openTrade, formData, errors, isLoading, closeTrade, t, showToast, onClose, validateForm]);

        // Percentage options from schema
        const percentageOptions = ClosePositionFormSchema.shape.percentage.options;

        if (!openTrade) return null;

        // Check if it's an order or trade for display
        const isOrder = !('position_type' in openTrade);
        const positionType = isOrder ? 'ORDER' : openTrade.position_type;

        // Get dynamic button color based on position type
        const buttonColor = getPositionTypeButtonColor(positionType, isLoading);

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={!isLoading}
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

                    {/* Close Trade Label */}
                    <Text className="text-white font-semibold mb-3">
                        {isOrder ? t('Close Order') : t('Close Trade')}
                    </Text>

                    {/* Percentage Buttons */}
                    <View className="flex-row justify-between mb-4">
                        {percentageOptions.map((percentage) => (
                            <TouchableOpacity
                                key={percentage}
                                className={`flex-1 mx-1 py-3 rounded-lg border ${
                                    formData.percentage === percentage
                                        ? 'bg-primary-100 border-primary-200'
                                        : 'bg-propfirmone-100 border-gray-600'
                                }`}
                                onPress={() => handlePercentageClick(percentage)}
                                disabled={isLoading}
                            >
                                <Text className={`text-center font-medium text-xs ${
                                    formData.percentage === percentage ? 'text-white' : 'text-gray-300'
                                }`}>
                                    {percentage}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Custom Amount Input */}
                    <View className="mb-2">
                        <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1">
                            <TouchableOpacity
                                className="w-10 h-10 items-center justify-center"
                                onPress={decrementValue}
                                disabled={isLoading}
                            >
                                <Text className={`text-lg ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>−</Text>
                            </TouchableOpacity>

                            <TextInput
                                className="flex-1 text-center text-white text-lg py-3"
                                value={formData.amount.toString()}
                                onChangeText={handleAmountChange}
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
                        
                        {/* Error Message */}
                        {errors.amount && (
                            <Text className="text-red-400 text-xs mt-1 px-2">
                                {errors.amount}
                            </Text>
                        )}
                    </View>

                    {/* Position Info */}
                    <View className="flex-row justify-between mb-4 px-2">
                        <Text className="text-gray-400 text-sm">
                            {t('Max Position')}: {openTrade.quantity?.toFixed(2)}
                        </Text>
                        {formData.amount > 0 && (
                            <Text className="text-gray-400 text-sm">
                                {((formData.amount / (openTrade.quantity || 1)) * 100).toFixed(1)}%
                            </Text>
                        )}
                    </View>

                    {/* Dynamic Close Button */}
                    <TouchableOpacity
                        className={`rounded-lg py-4 mb-4 flex-row items-center justify-center ${buttonColor} ${
                            (isLoading || errors.amount) ? 'opacity-50' : ''
                        }`}
                        onPress={onSubmit}
                        disabled={isLoading || !!errors.amount}
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
                                : isOrder
                                    ? t('Close Order')
                                    : positionType === PositionTypeEnum.LONG
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