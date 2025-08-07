import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    ScrollView,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TrailingSLTypeEnum, UpdatePartialTPInput, UpdateSlInput, UpdateTpInput, UpdateTrailingSLInput } from '@/api/schema/trade-service';
import { OpenTradesData } from '@/api/schema';
import { useUpdatePartialTpMutation, useUpdateSlMutation, useUpdateTpMutation, useUpdateTrailingSlMutation } from '@/api/hooks/trade-service';
import { PositionTypeEnum } from '@/shared/enums';
import { StatusEnum } from '@/api/services/api';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash.isequal';

interface PartialTPLevel {
    rr: number;
    quantity: number;
}

interface TrailingSLLevel {
    level: number;
    level_type: TrailingSLTypeEnum;
    sl: number;
}

// Matching web pattern - simplified props
interface EditPositionBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    openTrade: OpenTradesData['open_trades'][number] | null;
}

const EditPositionBottomSheet: React.FC<EditPositionBottomSheetProps> = ({
    isOpen,
    onClose,
    openTrade
}) => {
    const { t } = useTranslation();
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);

    // State management - similar to web version
    const [showSl, setShowSl] = useState<boolean>(false);
    const [showTp, setShowTp] = useState<boolean>(false);
    const [showPartialTP, setShowPartialTP] = useState<boolean>(false);
    const [showTrailingSL, setShowTrailingSL] = useState<boolean>(false);

    // Form values
    const [slValue, setSlValue] = useState<string>('0');
    const [tpValue, setTpValue] = useState<string>('0');
    const [partialTPLevels, setPartialTPLevels] = useState<PartialTPLevel[]>([]);
    const [trailingSLLevels, setTrailingSLLevels] = useState<TrailingSLLevel[]>([]);

    // API mutations
    const { mutateAsync: updateTp } = useUpdateTpMutation();
    const { mutateAsync: updateSl } = useUpdateSlMutation();
    const { mutateAsync: updatePartialTp } = useUpdatePartialTpMutation();
    const { mutateAsync: updateTrailingSl } = useUpdateTrailingSlMutation();

    const snapPoints = useMemo(() => ['75%', '90%'], []);

    // Initialize state when openTrade changes - matching web pattern
    useEffect(() => {
        if (openTrade) {
            setShowSl(!!openTrade.sl && openTrade.sl > 0);
            setShowTp(!!openTrade.tp && openTrade.tp > 0);
            setShowPartialTP(!!openTrade.tp_levels && openTrade.tp_levels.length > 0);
            setShowTrailingSL(!!openTrade.trailing_sl && openTrade.trailing_sl.length > 0);

            setSlValue(openTrade?.sl?.toString() || '0');
            setTpValue(openTrade?.tp?.toString() || '0');
            
            setPartialTPLevels(
                openTrade?.tp_levels?.map(item => ({
                    rr: Number(item.rr),
                    quantity: Number(item.quantity)
                })) || []
            );
            
            setTrailingSLLevels(
                openTrade?.trailing_sl?.map(item => ({
                    level: Number(item.level),
                    level_type: item.level_type,
                    sl: Number(item.sl)
                })) || []
            );
        }
    }, [openTrade]);

    // Handle modal visibility - matching web pattern
    useEffect(() => {
        if (isOpen && openTrade) {
            bottomSheetRef.current?.present();
        } else if (!isOpen) {
            bottomSheetRef.current?.dismiss();
        }
    }, [isOpen, openTrade]);

    // Toast function for React Native
    const showToast = useCallback((title: string, description: string) => {
        Alert.alert(title, description);
    }, []);

    const handleUpdate = useCallback(
        async <
            T extends
            | UpdateTpInput
            | UpdateSlInput
            | UpdatePartialTPInput
            | UpdateTrailingSLInput,
        >(
            updateFn: (data: T) => Promise<{ status: StatusEnum; message: string }>,
            data: T,
        ) => {
            try {
                const response = await updateFn(data);
                if (response.status === StatusEnum.SUCCESS) {
                    showToast(t('Success'), t(response.message));
                    onClose?.();
                } else {
                    showToast(t('Error'), t(response.message));
                }
            } catch (error: unknown) {
                showToast(
                    t('Error'),
                    t('An unexpected error occurred: {{error}}', {
                        error: error instanceof Error ? error.message : String(error),
                    }),
                );
            }
        },
        [onClose, t, showToast],
    );

    const validateTP = useCallback((tpVal: number) => {
        if (!openTrade || !showTp) return true;

        const positionType = openTrade.position_type;

        if (positionType === PositionTypeEnum.LONG && tpVal < openTrade.entry) {
            return false;
        }
        if (positionType === PositionTypeEnum.SHORT && (tpVal < 0 || tpVal > openTrade.entry)) {
            return false;
        }
        return true;
    }, [openTrade, showTp]);

    const handleSave = useCallback(async () => {
        if (!openTrade) {
            Alert.alert('Error', 'No position selected');
            return;
        }

        let isUpdate = false;
        const base_payload = {
            trade_id: openTrade.order_id.toString(),
            account: openTrade.account_id,
            symbol: openTrade.symbol,
            position: openTrade.position_type,
        };

        const slNum = parseFloat(slValue);
        const tpNum = parseFloat(tpValue);

        // Update SL if changed
        if (showSl && slNum !== openTrade.sl) {
            isUpdate = true;
            await handleUpdate(updateSl, {
                ...base_payload,
                sl: slNum.toString(),
            });
        }

        // Update TP if changed
        if (showTp && tpNum !== openTrade.tp) {
            if (!validateTP(tpNum)) {
                Alert.alert('Error', t('Invalid TP value based on the position and entry price'));
                return;
            }
            isUpdate = true;
            await handleUpdate(updateTp, {
                ...base_payload,
                tp: tpNum.toString(),
            });
        }

        // Update Partial TP if changed
        if (showPartialTP && partialTPLevels.length > 0 && !isEqual(partialTPLevels, openTrade.tp_levels)) {
            isUpdate = true;
            await handleUpdate(updatePartialTp, {
                ...base_payload,
                tp_levels: partialTPLevels,
            });
        }

        // Update Trailing SL if changed
        if (showTrailingSL && trailingSLLevels.length > 0 && !isEqual(trailingSLLevels, openTrade.trailing_sl)) {
            isUpdate = true;
            await handleUpdate(updateTrailingSl, {
                ...base_payload,
                trailing_sl: trailingSLLevels,
            });
        }

        if (!isUpdate) {
            onClose?.();
        }
    }, [openTrade, slValue, tpValue, partialTPLevels, trailingSLLevels, showSl, showTp, showPartialTP, showTrailingSL, handleUpdate, updateSl, updateTp, updatePartialTp, updateTrailingSl, onClose, validateTP, t]);

    const addPartialTPLevel = useCallback(() => {
        setPartialTPLevels(prev => [...prev, { rr: 0, quantity: 0 }]);
    }, []);

    const removePartialTPLevel = useCallback((index: number) => {
        setPartialTPLevels(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updatePartialTPLevel = useCallback((index: number, field: keyof PartialTPLevel, value: number) => {
        setPartialTPLevels(prev => 
            prev.map((level, i) => 
                i === index ? { ...level, [field]: value } : level
            )
        );
    }, []);

    const addTrailingSLLevel = useCallback(() => {
        setTrailingSLLevels(prev => [...prev, {
            level: 0,
            level_type: TrailingSLTypeEnum.RR,
            sl: 0
        }]);
    }, []);

    const removeTrailingSLLevel = useCallback((index: number) => {
        setTrailingSLLevels(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateTrailingSLLevel = useCallback((index: number, field: keyof TrailingSLLevel, value: any) => {
        setTrailingSLLevels(prev => 
            prev.map((level, i) => 
                i === index ? { ...level, [field]: value } : level
            )
        );
    }, []);

    const setBreakevenSL = useCallback(() => {
        if (openTrade) {
            setSlValue(openTrade.entry.toString());
        }
    }, [openTrade]);

    // Don't render if no openTrade - matching web pattern
    if (!openTrade) {
        return null;
    }

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
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
                    {t('Edit Position')} {openTrade?.symbol && `- ${openTrade.symbol}`}
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <Text className="text-gray-400 text-xl">✕</Text>
                </TouchableOpacity>
            </View>

            <BottomSheetScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Stop Loss Section */}
                <View className="mb-6 mt-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-white font-medium">{t('Stop Loss (SL)')}</Text>
                        <Switch
                            value={showSl}
                            onValueChange={(value) => {
                                setShowSl(value);
                                if (!value) {
                                    setSlValue('0');
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showSl ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showSl && (
                        <View>
                            <TextInput
                                className="bg-propfirmone-200 rounded-lg px-4 py-3 text-white text-center mb-2"
                                value={slValue}
                                onChangeText={setSlValue}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                className="py-2 px-4 rounded-lg border border-gray-700 items-center"
                                onPress={setBreakevenSL}
                            >
                                <Text className="text-white text-sm">{t('Stop Loss to Breakeven')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Take Profit Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-white font-medium">{t('Take Profit (TP)')}</Text>
                        <Switch
                            value={showTp}
                            onValueChange={(value) => {
                                setShowTp(value);
                                if (!value) {
                                    setTpValue('0');
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showTp ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showTp && (
                        <TextInput
                            className="bg-propfirmone-200 rounded-lg px-4 py-3 text-white text-center"
                            value={tpValue}
                            onChangeText={setTpValue}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor="#9CA3AF"
                        />
                    )}
                </View>

                {/* Partial TP Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                            <Text className="text-white font-medium">{t('Partial TP Levels')}</Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                {t('RR levels where a % of your trade will be auto closed.')}
                            </Text>
                        </View>
                        <Switch
                            value={showPartialTP}
                            onValueChange={(value) => {
                                setShowPartialTP(value);
                                if (value && partialTPLevels.length === 0) {
                                    addPartialTPLevel();
                                } else if (!value) {
                                    setPartialTPLevels([]);
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showPartialTP ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showPartialTP && (
                        <View>
                            {partialTPLevels.map((level, index) => (
                                <View key={index} className="flex-row items-center mb-2">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-white text-xs mb-1">{t('RR Level')}</Text>
                                        <TextInput
                                            className="bg-propfirmone-200 rounded-lg px-3 py-2 text-white text-center"
                                            value={level.rr.toString()}
                                            onChangeText={(value) => updatePartialTPLevel(index, 'rr', parseFloat(value) || 0)}
                                            keyboardType="numeric"
                                            placeholder="0.0"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                    <View className="flex-1 mr-2">
                                        <Text className="text-white text-xs mb-1">{t('% to Close')}</Text>
                                        <TextInput
                                            className="bg-propfirmone-200 rounded-lg px-3 py-2 text-white text-center"
                                            value={level.quantity.toString()}
                                            onChangeText={(value) => updatePartialTPLevel(index, 'quantity', parseFloat(value) || 0)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        className="p-2"
                                        onPress={() => removePartialTPLevel(index)}
                                    >
                                        <Text className="text-red-500 text-lg">🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                className="py-2 px-4 rounded-lg border border-gray-700 items-center mt-2"
                                onPress={addPartialTPLevel}
                            >
                                <Text className="text-white text-sm">+ {t('Add level')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Trailing SL Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                            <Text className="text-white font-medium">{t('Trailing SL Levels')}</Text>
                            <Text className="text-gray-400 text-xs mt-1">
                                {t('Levels where your SL will be moved too.')}
                            </Text>
                        </View>
                        <Switch
                            value={showTrailingSL}
                            onValueChange={(value) => {
                                setShowTrailingSL(value);
                                if (value && trailingSLLevels.length === 0) {
                                    addTrailingSLLevel();
                                } else if (!value) {
                                    setTrailingSLLevels([]);
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showTrailingSL ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showTrailingSL && (
                        <View>
                            {trailingSLLevels.map((level, index) => (
                                <View key={index} className="mb-3">
                                    <View className="flex-row items-center mb-2">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-white text-xs mb-1">{t('Type')}</Text>
                                            <View className="flex-row">
                                                <TouchableOpacity
                                                    className={`flex-1 py-2 px-3 rounded-l-lg border ${
                                                        level.level_type === TrailingSLTypeEnum.RR
                                                            ? 'bg-primary-100 border-primary-100'
                                                            : 'border-gray-700'
                                                    }`}
                                                    onPress={() => updateTrailingSLLevel(index, 'level_type', TrailingSLTypeEnum.RR)}
                                                >
                                                    <Text className="text-white text-center text-xs">{t('RR')}</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    className={`flex-1 py-2 px-3 rounded-r-lg border ${
                                                        level.level_type === TrailingSLTypeEnum.PRICE
                                                            ? 'bg-primary-100 border-primary-100'
                                                            : 'border-gray-700'
                                                    }`}
                                                    onPress={() => updateTrailingSLLevel(index, 'level_type', TrailingSLTypeEnum.PRICE)}
                                                >
                                                    <Text className="text-white text-center text-xs">{t('Price')}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            className="p-2"
                                            onPress={() => removeTrailingSLLevel(index)}
                                        >
                                            <Text className="text-red-500 text-lg">🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View className="flex-row items-center">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-white text-xs mb-1">{t('Level')}</Text>
                                            <TextInput
                                                className="bg-propfirmone-200 rounded-lg px-3 py-2 text-white text-center"
                                                value={level.level.toString()}
                                                onChangeText={(value) => updateTrailingSLLevel(index, 'level', parseFloat(value) || 0)}
                                                keyboardType="numeric"
                                                placeholder="0.0"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white text-xs mb-1">{t('SL')}</Text>
                                            <TextInput
                                                className="bg-propfirmone-200 rounded-lg px-3 py-2 text-white text-center"
                                                value={level.sl.toString()}
                                                onChangeText={(value) => updateTrailingSLLevel(index, 'sl', parseFloat(value) || 0)}
                                                keyboardType="numeric"
                                                placeholder="0.0"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity
                                className="py-2 px-4 rounded-lg border border-gray-700 items-center mt-2"
                                onPress={addTrailingSLLevel}
                            >
                                <Text className="text-white text-sm">+ {t('Add level')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View className="flex-row items-center justify-between mb-3 mt-4">
                    <TouchableOpacity
                        className="flex-1 py-3 rounded-lg border border-gray-700 items-center justify-center mr-3"
                        onPress={onClose}
                    >
                        <Text className="text-white font-InterBold">{t('Cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 py-3 rounded-lg bg-primary-100 items-center justify-center"
                        onPress={handleSave}
                    >
                        <Text className="text-white font-InterBold">{t('Save Changes')}</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

export default EditPositionBottomSheet;