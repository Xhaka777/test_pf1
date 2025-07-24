import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

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

const EditPositionBottomSheet = forwardRef<BottomSheetModal, EditPositionBottomSheetProps>(
    ({ position, onSave, onClose }, ref) => {
        const [formData, setFormData] = useState({
            closeTrade: false,
            closeTradeValue: '0.00',
            takeProfitEnabled: false,
            takeProfitValue: '0.00',
        });

        // CRITICAL: Fixed snap points for BottomSheetModal
        const snapPoints = useMemo(() => ['65%', '85%'], []);

        const handleSave = useCallback(() => {
            if (!position) {
                Alert.alert('Error', 'No position selected');
                return;
            }
            onSave(formData);
        }, [formData, position, onSave]);

        const updateFormData = useCallback((field: string, value: any) => {
            setFormData(prev => ({ ...prev, [field]: value }));
        }, []);

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
                onDismiss={onClose}
            >
                <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-white text-lg font-InterSemiBold">
                        Edit Position {position?.symbol && `- ${position.symbol}`}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-gray-400 text-xl">✕</Text>
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView 
                    className="flex-1 px-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {/* Close Trade Section */}
                    <View className="mb-6 mt-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-white font-medium">Close Trade</Text>
                            <Switch
                                value={formData.closeTrade}
                                onValueChange={(value) => updateFormData('closeTrade', value)}
                                trackColor={{ false: '#374151', true: '#EC4899' }}
                                thumbColor={formData.closeTrade ? '#FFFFFF' : '#9CA3AF'}
                            />
                        </View>

                        {formData.closeTrade && (
                            <TextInput
                                className="bg-propfirmone-200 rounded-lg px-4 py-3 text-white text-center"
                                value={formData.closeTradeValue}
                                onChangeText={(value) => updateFormData('closeTradeValue', value)}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                            />
                        )}
                    </View>

                    {/* Take Profit Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-white font-medium">Take Profit (TP)</Text>
                            <Switch
                                value={formData.takeProfitEnabled}
                                onValueChange={(value) => updateFormData('takeProfitEnabled', value)}
                                trackColor={{ false: '#374151', true: '#EC4899' }}
                                thumbColor={formData.takeProfitEnabled ? '#FFFFFF' : '#9CA3AF'}
                            />
                        </View>

                        {formData.takeProfitEnabled && (
                            <TextInput
                                className="bg-propfirmone-200 rounded-lg px-4 py-3 text-white text-center"
                                value={formData.takeProfitValue}
                                onChangeText={(value) => updateFormData('takeProfitValue', value)}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                            />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row items-center justify-between mb-3 mt-4">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg border border-gray-700 items-center justify-center mr-3"
                            onPress={onClose}
                        >
                            <Text className="text-white font-InterBold">Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-lg bg-primary-100 items-center justify-center"
                            onPress={handleSave}
                        >
                            <Text className="text-white font-InterBold">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>
        );
    }
);

EditPositionBottomSheet.displayName = 'EditPositionBottomSheet';

export default EditPositionBottomSheet;