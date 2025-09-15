import { useCancelOrderMutation } from "@/api/hooks/trade-service";
import { OpenTradesData } from "@/api/schema";
import { StatusEnum } from "@/api/services/api";
import BottomSheet, { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useMemo, useState, } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Alert } from "react-native";
import SelectableButton from "./SelectableButton";


interface CloseOrderBottomSheetProps {
    order: OpenTradesData['open_orders'][number] | null;
    onClose: () => void;
    accountId: number | string;
    onClickTradingEnabled?: boolean;
}

const CloseOrderBottomSheet = forwardRef<BottomSheetModal, CloseOrderBottomSheetProps>(
    ({ order, onClose, accountId }, ref) => {
        const [isLoading, setIsLoading] = useState(false);

        // API mutation
        const { mutateAsync: cancelOrder } = useCancelOrderMutation();

        const snapPoints = useMemo(() => ['20%'], []);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                onClose();
            }
        }, [onClose]);

        const handleClose = useCallback(() => {
            if (isLoading) return; // Prevent closing while loading
            onClose();
        }, [onClose, isLoading]);

        // Toast function
        const showToast = useCallback((title: string, description: string) => {
            Alert.alert(title, description);
        }, []);

        // Main cancel handler
        const handleConfirmCancel = useCallback(async () => {
            if (!order || isLoading) return;

            setIsLoading(true);

            try {
                const result = await cancelOrder({
                    symbol: order.symbol,
                    account: typeof accountId === 'string' ? parseInt(accountId) : accountId,
                    order_id: order.order_id,
                });

                if (result.status === StatusEnum.SUCCESS) {
                    showToast(
                        'Order Cancelled',
                        'Your order has been successfully cancelled.'
                    );
                    onClose();
                } else {
                    showToast(
                        `Failed to cancel order "${order.order_id}"`,
                        result.message || 'Unable to cancel your order at this time. Please try again later.'
                    );
                }
            } catch (error) {
                console.error('Error cancelling order:', error);
                showToast(
                    'Error',
                    'Unable to cancel your order at this time. Please try again later.'
                );
            } finally {
                setIsLoading(false);
            }
        }, [order, isLoading, cancelOrder, accountId, showToast, onClose]);

        const handleCancel = useCallback(() => {
            if (ref && 'current' in ref && ref.current) {
                ref.current.dismiss();
            }
        }, [ref]);

        if (!order) return null;

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
                <BottomSheetView
                    style={{ flex: 1, height: '10%', padding: 4 }}
                >
                    {/* Header */}
                    <View className="space-y-3 ml-2">
                        <Text className="text-lg text-white font-InterBold mb-2">Close Order</Text>
                        <Text className="text-base text-gray-500 mb-3 font-Inter">
                            Are you sure you want to cancel the order?
                        </Text>
                        {/* <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                            <Text className={`text-xl ${isLoading ? 'text-gray-600' : 'text-gray-400'}`}>✕</Text>
                        </TouchableOpacity> */}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row items-center justify-between mb-10">
                        <SelectableButton
                            text='Cancel'
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={() => { handleCancel }}
                            additionalStyles="mr-3"
                        />

                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg bg-primary-100 border items-center justify-center`}
                            onPress={handleConfirmCancel}
                            disabled={isLoading}
                        >
                            <Text className='text-white font-InterBold'>
                                Confirm
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>

            </BottomSheetModal>
        )
    }
)

CloseOrderBottomSheet.displayName = 'CloseOrderBottomSheet';

export default CloseOrderBottomSheet;