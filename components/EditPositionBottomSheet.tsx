import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TrailingSLTypeEnum, UpdatePartialTPInput, UpdateSlInput, UpdateTpInput, UpdateTrailingSLInput } from '@/api/schema/trade-service';
import { OpenTradesData } from '@/api/schema';
import { useUpdatePartialTpMutation, useUpdateSlMutation, useUpdateTpMutation, useUpdateTrailingSlMutation } from '@/api/hooks/trade-service';
import { PositionTypeEnum } from '@/shared/enums';
import { StatusEnum } from '@/api/services/api';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
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

// Updated props interface
interface EditPositionBottomSheetProps {
    openTrade: OpenTradesData['open_trades'][number] | null;
    onClose: () => void;
}

const EditPositionBottomSheet = forwardRef<BottomSheetModal, EditPositionBottomSheetProps>(({
    openTrade,
    onClose
}, ref) => {
    const { t } = useTranslation();

    // State management - similar to web version
    const [showSl, setShowSl] = useState<boolean>(false);
    const [showTp, setShowTp] = useState<boolean>(false);
    const [showPartialTP, setShowPartialTP] = useState<boolean>(false);
    const [showTrailingSL, setShowTrailingSL] = useState<boolean>(false);

    // Form values
    const [slValue, setSlValue] = useState<number>(0);
    const [tpValue, setTpValue] = useState<number>(0);
    const [partialTPLevels, setPartialTPLevels] = useState<PartialTPLevel[]>([]);
    const [trailingSLLevels, setTrailingSLLevels] = useState<TrailingSLLevel[]>([]);

    // API mutations
    const { mutateAsync: updateTp } = useUpdateTpMutation();
    const { mutateAsync: updateSl } = useUpdateSlMutation();
    const { mutateAsync: updatePartialTp } = useUpdatePartialTpMutation();
    const { mutateAsync: updateTrailingSl } = useUpdateTrailingSlMutation();

    const snapPoints = useMemo(() => ['80%'], []);

    // Initialize state when openTrade changes
    useEffect(() => {
        if (openTrade) {
            setShowSl(!!openTrade.sl && openTrade.sl > 0);
            setShowTp(!!openTrade.tp && openTrade.tp > 0);
            setShowPartialTP(!!openTrade.tp_levels && openTrade.tp_levels.length > 0);
            setShowTrailingSL(false); // Default to unchecked

            setSlValue(openTrade?.sl || 0);
            setTpValue(openTrade?.tp || 0);

            // Initialize with one level showing 0.00 for both values
            setPartialTPLevels([{ rr: 0, quantity: 0 }]);

            setTrailingSLLevels(
                openTrade?.trailing_sl?.map(item => ({
                    level: Number(item.level),
                    level_type: item.level_type,
                    sl: Number(item.sl)
                })) || []
            );
        }
    }, [openTrade]);

    // Handle bottom sheet changes
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

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

        // Update SL if changed
        if (showSl && slValue !== openTrade.sl) {
            isUpdate = true;
            await handleUpdate(updateSl, {
                ...base_payload,
                sl: slValue.toString(),
            });
        }

        // Update TP if changed
        if (showTp && tpValue !== openTrade.tp) {
            if (!validateTP(tpValue)) {
                Alert.alert('Error', t('Invalid TP value based on the position and entry price'));
                return;
            }
            isUpdate = true;
            await handleUpdate(updateTp, {
                ...base_payload,
                tp: tpValue.toString(),
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

    // Helper functions for increment/decrement
    const handleSlChange = useCallback((delta: number) => {
        setSlValue(prev => Math.max(0, prev + delta));
    }, []);

    const handleTpChange = useCallback((delta: number) => {
        setTpValue(prev => Math.max(0, prev + delta));
    }, []);

    const addPartialTPLevel = useCallback(() => {
        setPartialTPLevels(prev => [...prev, { rr: 0, quantity: 0 }]);
    }, []);

    const removePartialTPLevel = useCallback((index: number) => {
        setPartialTPLevels(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updatePartialTPLevel = useCallback((index: number, field: keyof PartialTPLevel, delta: number) => {
        setPartialTPLevels(prev =>
            prev.map((level, i) =>
                i === index ? { ...level, [field]: Math.max(0, level[field] + delta) } : level
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

    const updateTrailingSLLevelValue = useCallback((index: number, field: 'level' | 'sl', delta: number) => {
        setTrailingSLLevels(prev =>
            prev.map((level, i) =>
                i === index ? { ...level, [field]: Math.max(0, level[field] + delta) } : level
            )
        );
    }, []);

    const setBreakevenSL = useCallback(() => {
        if (openTrade) {
            setSlValue(openTrade.entry);
        }
    }, [openTrade]);

    // Don't render if no openTrade
    if (!openTrade) {
        return null;
    }

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
            {/* Main Container with proper flex structure */}
            {/* <View className='flex-1'> */}
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700/30">
                <Text className="text-white text-lg font-InterSemiBold">
                    {t('Edit Position')} {openTrade?.symbol && `- ${openTrade.symbol}`}
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <Text className="text-gray-400 text-xl">✕</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Content - takes remaining space but leaves room for buttons */}
            <BottomSheetScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    // paddingBottom: 16, // Small padding at bottom for spacing
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Close Trade Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-white font-medium">{t('Close Trade')}</Text>
                        <Switch
                            value={showSl}
                            onValueChange={(value) => {
                                setShowSl(value);
                                if (!value) {
                                    setSlValue(0);
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showSl ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showSl && (
                        <View>
                            <View className="flex-row items-center rounded-md overflow-hidden mt-3 bg-[#1A1819] border border-gray-500/50">
                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => handleSlChange(-0.01)}
                                    activeOpacity={0.8}
                                >
                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>

                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                    <Text className="text-[#898587] text-base font-Inter">
                                        {slValue.toFixed(2)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => handleSlChange(0.01)}
                                    activeOpacity={0.8}
                                >
                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                className="py-3 px-4 rounded-lg border border-gray-700 items-center mt-3"
                                onPress={setBreakevenSL}
                            >
                                <Text className="text-white text-sm">{t('Stop Loss to Breakeven')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View className='bg-propfirmone-100 w-[100%] h-1 mb-4 ' />


                {/* Take Profit Section */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-white font-medium">{t('Take Profit (TP)')}</Text>
                        <Switch
                            value={showTp}
                            onValueChange={(value) => {
                                setShowTp(value);
                                if (!value) {
                                    setTpValue(0);
                                }
                            }}
                            trackColor={{ false: '#374151', true: '#EC4899' }}
                            thumbColor={showTp ? '#FFFFFF' : '#9CA3AF'}
                        />
                    </View>

                    {showTp && (
                        <View className="flex-row items-center rounded-md overflow-hidden mt-3 bg-[#1A1819] border border-gray-500/50">
                            <TouchableOpacity
                                className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                onPress={() => handleTpChange(-0.01)}
                                activeOpacity={0.8}
                            >
                                <Minus size={16} strokeWidth={3} color='#898587' />
                            </TouchableOpacity>

                            <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                <Text className="text-[#898587] text-base font-Inter">
                                    {tpValue.toFixed(2)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                onPress={() => handleTpChange(0.01)}
                                activeOpacity={0.8}
                            >
                                <Plus size={16} strokeWidth={3} color='#898587' />
                            </TouchableOpacity>
                        </View>
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
                                <View key={index} className="mb-4">
                                    <View className="flex-row items-center mb-2">
                                        <View className="flex-1 mr-3">
                                            <Text className="text-gray-400 text-xs mb-1">{t('RR Level')}</Text>
                                            <View className="flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updatePartialTPLevel(index, 'rr', -0.1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                                    <Text className="text-[#898587] text-base font-Inter">
                                                        {level.rr.toFixed(2)}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updatePartialTPLevel(index, 'rr', 0.1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className="flex-1 mr-3">
                                            <Text className="text-gray-400 text-xs mb-1">{t('% to Close')}</Text>
                                            <View className="flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updatePartialTPLevel(index, 'quantity', -1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                                    <Text className="text-[#898587] text-base font-Inter">
                                                        {level.quantity.toFixed(2)}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updatePartialTPLevel(index, 'quantity', 1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Delete Button */}
                                        <TouchableOpacity
                                            className="p-3"
                                            onPress={() => removePartialTPLevel(index)}
                                        >
                                            <Trash2 size={16} color="#898587" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <View className="flex-row">
                                <TouchableOpacity
                                    className="py-3 px-4 rounded-lg border border-gray-700 items-center"
                                    onPress={addPartialTPLevel}
                                >
                                    <Text className="text-white text-sm">+ {t('Add level')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <View className='bg-propfirmone-100 w-[100%] h-1 mb-4 ' />

                {/* Trailing SL Section - Compact when unchecked */}
                <View>
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            className="flex-row items-center flex-1"
                            onPress={() => {
                                const newValue = !showTrailingSL;
                                setShowTrailingSL(newValue);
                                if (newValue && trailingSLLevels.length === 0) {
                                    addTrailingSLLevel();
                                } else if (!newValue) {
                                    setTrailingSLLevels([]);
                                }
                            }}
                        >
                            <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${showTrailingSL ? 'bg-primary-100 border-primary-100' : 'border-gray-500'
                                }`}>
                                {showTrailingSL && (
                                    <Text className="text-white text-xs">✓</Text>
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-medium">{t('Trailing SL Levels')}</Text>
                                <Text className="text-gray-400 text-xs mt-1">
                                    {t('Levels where your SL will be moved too.')}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* ONLY render this content when showTrailingSL is true */}
                    {showTrailingSL && (
                        <View className="mt-3 mb-6">
                            {trailingSLLevels.map((level, index) => (
                                <View key={index} className="mb-4">
                                    {/* Type Selection */}
                                    <View className="mb-3">
                                        <Text className="text-gray-400 text-xs mb-1">{t('Type')}</Text>
                                        <View className="flex-row">
                                            <TouchableOpacity
                                                className={`flex-1 py-3 px-3 rounded-l-lg border ${level.level_type === TrailingSLTypeEnum.RR
                                                    ? 'bg-primary-100 border-primary-100'
                                                    : 'border-gray-700 bg-[#1A1819]'
                                                    }`}
                                                onPress={() => updateTrailingSLLevel(index, 'level_type', TrailingSLTypeEnum.RR)}
                                            >
                                                <Text className="text-white text-center text-sm">{t('RR')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                className={`flex-1 py-3 px-3 rounded-r-lg border ${level.level_type === TrailingSLTypeEnum.PRICE
                                                    ? 'bg-primary-100 border-primary-100'
                                                    : 'border-gray-700 bg-[#1A1819]'
                                                    }`}
                                                onPress={() => updateTrailingSLLevel(index, 'level_type', TrailingSLTypeEnum.PRICE)}
                                            >
                                                <Text className="text-white text-center text-sm">{t('Price')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Level and SL Inputs with Trash Icon */}
                                    <View className="flex-row items-end mb-2">
                                        <View className="flex-1 mr-3">
                                            <Text className="text-gray-400 text-xs mb-1">{t('Level')}</Text>
                                            <View className="flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updateTrailingSLLevelValue(index, 'level', -0.1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                                    <Text className="text-[#898587] text-base font-Inter">
                                                        {level.level.toFixed(2)}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updateTrailingSLLevelValue(index, 'level', 0.1)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View className="flex-1 mr-3">
                                            <Text className="text-gray-400 text-xs mb-1">{t('SL')}</Text>
                                            <View className="flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updateTrailingSLLevelValue(index, 'sl', -0.01)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                                    <Text className="text-[#898587] text-base font-Inter">
                                                        {level.sl.toFixed(2)}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                                    onPress={() => updateTrailingSLLevelValue(index, 'sl', 0.01)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Delete Button aligned with inputs */}
                                        <TouchableOpacity
                                            className="p-3 pb-3"
                                            onPress={() => removeTrailingSLLevel(index)}
                                        >
                                            <Trash2 size={16} color="#898587" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <View className="flex-row">
                                <TouchableOpacity
                                    className="py-3 px-4 rounded-lg border border-gray-700 items-center"
                                    onPress={addTrailingSLLevel}
                                >
                                    <Text className="text-white text-sm">+ {t('Add level')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </BottomSheetScrollView>
            {/* Sticky Action Buttons - Always visible at bottom, outside of scroll view */}
            <View className="px-4 py-4 bg-[#100E0F] border-t border-gray-700/30">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        className="flex-1 py-4 rounded-lg border border-gray-700 items-center justify-center mr-3"
                        onPress={onClose}
                    >
                        <Text className="text-white font-InterBold text-base">{t('Cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 py-4 rounded-lg bg-primary-100 items-center justify-center"
                        onPress={handleSave}
                    >

                        <Text className="text-white font-InterBold text-base">{t('Save')}</Text>
                    </TouchableOpacity>
                </View>
            </View>


            {/* </View> */}

        </BottomSheetModal>
    );
});

EditPositionBottomSheet.displayName = 'EditPositionBottomSheet';

export default EditPositionBottomSheet;