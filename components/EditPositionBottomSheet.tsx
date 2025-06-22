import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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

interface EditPositionBottomSheetProps {
    position: Position | null;
    onSave: (data: any) => void;
    onClose: () => void;
}

const EditPositionBottomSheet = forwardRef<BottomSheet, EditPositionBottomSheetProps>(
    ({ position, onSave, onClose }, ref) => {
        // Form state
        const [closeTrade, setCloseTrade] = useState(false);
        const [closeTradeValue, setCloseTradeValue] = useState('0.00');
        const [takeProfitEnabled, setTakeProfitEnabled] = useState(false);
        const [takeProfitValue, setTakeProfitValue] = useState('0.00');
        const [partialTPEnabled, setPartialTPEnabled] = useState(false);
        const [rpLevel, setRpLevel] = useState('0.00');
        const [percentToClose, setPercentToClose] = useState('0.00');
        const [trailingSLEnabled, setTrailingSLEnabled] = useState(false);

        // Bottom sheet snap points
        // const snapPoints = useMemo(() => ['25%', '70%', '90%'], []);
        const snapPoints = useMemo(() => ['60%'], []);

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                onClose();
            }
        }, [onClose]);

        const resetForm = useCallback(() => {
            setCloseTrade(false);
            setCloseTradeValue('0.00');
            setTakeProfitEnabled(false);
            setTakeProfitValue('0.00');
            setPartialTPEnabled(false);
            setRpLevel('0.00');
            setPercentToClose('0.00');
            setTrailingSLEnabled(false);
        }, []);

        const handleSave = useCallback(() => {
            const formData = {
                closeTrade,
                closeTradeValue,
                takeProfitEnabled,
                takeProfitValue,
                partialTPEnabled,
                rpLevel,
                percentToClose,
                trailingSLEnabled,
            };
            onSave(formData);
            resetForm();
        }, [
            closeTrade,
            closeTradeValue,
            takeProfitEnabled,
            takeProfitValue,
            partialTPEnabled,
            rpLevel,
            percentToClose,
            trailingSLEnabled,
            onSave,
            resetForm,
        ]);

        const handleClose = useCallback(() => {
            resetForm();
            onClose();
        }, [onClose, resetForm]);

        const incrementValue = (value: string, setter: (val: string) => void) => {
            const numValue = parseFloat(value) || 0;
            setter((numValue + 0.01).toFixed(2));
        };

        const decrementValue = (value: string, setter: (val: string) => void) => {
            const numValue = parseFloat(value) || 0;
            setter(Math.max(0, numValue - 0.01).toFixed(2));
        };

        return (
            <BottomSheet
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={{ backgroundColor: '#100E0F', borderColor: '#1E1E2D', borderWidth: 1 }}
                handleIndicatorStyle={{ backgroundColor: '#666' }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-white text-lg font-InterSemiBold">Edit Position</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Text className="text-gray-400 text-xl">✕</Text>
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView className="flex-1 px-4">
                    {/* Close Trade Section */}
                    <View className="mb-6 mt-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-white font-medium">Close Trade</Text>
                            <Switch
                                value={closeTrade}
                                onValueChange={setCloseTrade}
                                trackColor={{ false: '#374151', true: '#EC4899' }}
                                thumbColor={closeTrade ? '#FFFFFF' : '#9CA3AF'}
                            />
                        </View>

                        {closeTrade && (
                            <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1">
                                <TouchableOpacity
                                    className="w-6 h-6 items-center justify-center"
                                    onPress={() => decrementValue(closeTradeValue, setCloseTradeValue)}
                                >
                                    <Text className="text-gray-400 text-base">−</Text>
                                </TouchableOpacity>

                                <TextInput
                                    className="flex-1 text-center text-white text-base mx-1"
                                    value={closeTradeValue}
                                    onChangeText={setCloseTradeValue}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />

                                <TouchableOpacity
                                    className="w-6 h-6 items-center justify-center"
                                    onPress={() => incrementValue(closeTradeValue, setCloseTradeValue)}
                                >
                                    <Text className="text-gray-400 text-base">+</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Stop Loss to Breakeven Button */}
                    <SelectableButton
                        text='Stop Loss to Breakeven'
                        isSelected={''}
                        selectedBorderColor="border-primary-100"
                        unselectedBorderColor="border-gray-700"
                        onPress={() => {
                            // confirmSignOutSheetRef.current?.close();
                            // bottomSheetRef.current?.close();
                        }}
                        additionalStyles="mr-3 font-InterSemiBold text-base text-white bg-gray-800 rounded-lg mb-6 flex items-center justify-center"
                    />

                    <View className="w-full h-0.5 bg-gray-800" />


                    {/* Take Profit Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-white font-medium">Take Profit (TP)</Text>
                            <Switch
                                value={takeProfitEnabled}
                                onValueChange={setTakeProfitEnabled}
                                trackColor={{ false: '#374151', true: '#EC4899' }}
                                thumbColor={takeProfitEnabled ? '#FFFFFF' : '#9CA3AF'}
                            />
                        </View>

                        {takeProfitEnabled && (
                            <View className="flex-row items-center bg-propfirmone-200 rounded-lg border border-gray-800 px-1">
                                <TouchableOpacity
                                    className="w-6 h-6 items-center justify-center"
                                    onPress={() => decrementValue(takeProfitValue, setTakeProfitValue)}
                                >
                                    <Text className="text-gray-400 text-lg">−</Text>
                                </TouchableOpacity>
                                <TextInput
                                    className="flex-1 text-center text-white text-base mx-1"
                                    value={takeProfitValue}
                                    onChangeText={setTakeProfitValue}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    className="w-8 h-8 items-center justify-center"
                                    onPress={() => incrementValue(takeProfitValue, setTakeProfitValue)}
                                >
                                    <Text className="text-gray-400 text-lg">+</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View className="w-full h-0.5 bg-gray-800" />

                    {/* Partial TP Levels Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <Text className="text-white font-medium mr-2">Partial TP Levels</Text>
                                <View className="w-4 h-4 bg-gray-600 rounded-full items-center justify-center">
                                    <Text className="text-white text-xs">i</Text>
                                </View>
                            </View>
                            <Switch
                                value={partialTPEnabled}
                                onValueChange={setPartialTPEnabled}
                                trackColor={{ false: '#374151', true: '#FFFFFF' }}
                                thumbColor={partialTPEnabled ? '#000000' : '#9CA3AF'}
                            />
                        </View>
                    </View>

                    <View className="w-full h-0.5 bg-gray-800" />


                    {/* Trailing SL Levels */}
                    <View className="mb-4 mt-4">
                        <View className="flex-row items-center mb-3">
                            <TouchableOpacity
                                className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${trailingSLEnabled ? 'border-pink-500 bg-pink-500' : 'border-gray-600'
                                    }`}
                                onPress={() => setTrailingSLEnabled(!trailingSLEnabled)}
                            >
                                {trailingSLEnabled && <Text className="text-white text-xs">✓</Text>}
                            </TouchableOpacity>
                            <Text className="text-white font-medium mr-2">Trailing SL Levels</Text>
                            <View className="w-4 h-4 bg-gray-600 rounded-full items-center justify-center">
                                <Text className="text-white text-xs">i</Text>
                            </View>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                        <SelectableButton
                            text='Cancel'
                            isSelected={''}
                            selectedBorderColor="border-primary-100"
                            unselectedBorderColor="border-gray-700"
                            onPress={() => {
                                // confirmSignOutSheetRef.current?.close();
                                // bottomSheetRef.current?.close();
                            }}
                            additionalStyles="mr-3"
                        />
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg bg-primary-100 border items-center justify-center "
                            onPress={() => {
                                // onSignOutPress()
                            }}
                        >
                            <Text className="text-white font-InterBold">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        );
    }
);

EditPositionBottomSheet.displayName = 'EditPositionBottomSheet';

export default EditPositionBottomSheet;