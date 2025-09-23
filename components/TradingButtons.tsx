import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Check, Minus, Plus, X, ChevronDown, Loader as Loader2 } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Animated, Easing, Alert, TextInput } from "react-native";
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TFunction } from 'i18next';
import TPBottomSheet from "./TPBottomSheet";
import { BuySellButtons, PositionTypeEnum } from "./BuySellButtons";
import { OrderTypeEnum, TakeProfitSlTypeEnum } from "@/shared/enums";
import { useActiveSymbol } from "@/hooks/use-active-symbol";
import { useCurrencySymbol } from "@/providers/currency-symbols";
import { useGetAccountDetails } from "@/api/hooks/account-details";
import { useAccounts } from "@/providers/accounts";
import { useGetSymbolInfo } from "@/api/hooks/metrics";
import { useCreateTradeMutation } from "@/api/hooks/trade-service";
import { OpenTradeInput } from "@/api/schema/trade-service";
import { StatusEnum } from "@/api/services/api";

// Complete web schema logic - exactly as your teammates have
const getTradeFormSchema = (
    orderType: OrderTypeEnum,
    showSlTp: boolean,
    takeProfitType: TakeProfitSlTypeEnum | null,
    stopLossType: TakeProfitSlTypeEnum | null,
    t: TFunction,
) => {
    return z.object({
        showSlTp: z.boolean(),
        showTakeProfit: z.boolean(),
        add_tp_sl: z.boolean(),
        add_take_profit: z.boolean(),
        sl_type: z.enum([TakeProfitSlTypeEnum.PRICE, TakeProfitSlTypeEnum.PIPS]),
        tp_type: z.enum([TakeProfitSlTypeEnum.PRICE, TakeProfitSlTypeEnum.PIPS]),
        order_type: z.enum([
            OrderTypeEnum.LIMIT,
            OrderTypeEnum.MARKET,
            OrderTypeEnum.STOP,
        ]),
        position: z.enum([PositionTypeEnum.LONG, PositionTypeEnum.SHORT]),
        quantity: z
            .number()
            .refine((val) => val > 0, {
                message: t('Quantity must be greater than 0'),
            })
            .optional()
            .refine((val) => val !== undefined, {
                message: t('Quantity Required'),
            }),
        price: z
            .number()
            .refine((val) => orderType === OrderTypeEnum.MARKET || val > 0, {
                message: t('Min price is 0'),
            })
            .optional()
            .refine(
                (val) =>
                    orderType !== OrderTypeEnum.MARKET ? val !== undefined : true,
                {
                    message: t('Price Required'),
                },
            ),
        sl: z
            .number()
            .optional()
            .refine(
                (val) => {
                    if (!showSlTp) return true;
                    if (stopLossType === TakeProfitSlTypeEnum.PIPS)
                        return val === undefined || val >= 1;
                    return val === undefined || val >= 0;
                },
                {
                    message:
                        stopLossType === TakeProfitSlTypeEnum.PIPS
                            ? t('SL must be at least 1 pip')
                            : t('Min SL price is 0'),
                },
            ),
        tp: z
            .number()
            .optional()
            .refine(
                (val) => {
                    if (!showSlTp) return true;
                    if (takeProfitType === TakeProfitSlTypeEnum.PIPS) {
                        return val === undefined || val >= 1;
                    }
                    return val === undefined || val >= 0;
                },
                {
                    message:
                        takeProfitType === TakeProfitSlTypeEnum.PIPS
                            ? t('TP must be at least 1 pip')
                            : t('Min TP price is 0'),
                },
            ),
    });
};

type TradeFormValues = z.infer<ReturnType<typeof getTradeFormSchema>>;

// Round quantity helper from web
const roundQuantity = (value: number) => {
    return Math.round(value * 100) / 100;
};

const TradingButtons = () => {
    const { t } = useTranslation();
    const [selectedPositionType, setSelectedPositionType] = useState<PositionTypeEnum>(PositionTypeEnum.LONG);
    const [showSlTp, setShowSlTp] = useState(false);
    const [takeProfitType] = useState<TakeProfitSlTypeEnum | null>(null);
    const [stopLossType] = useState<TakeProfitSlTypeEnum | null>(null);
    const [clickedPositionType, setClickedPositionType] = useState(false);
    const [selectedOrderType, setSelectedOrderType] = useState<OrderTypeEnum>(OrderTypeEnum.MARKET);

    const [quantityFocused, setQuantityFocused] = useState(false);
    const [priceFocused, setPriceFocused] = useState(false);
    const [tpFocused, setTpFocused] = useState(false);
    const [slFocused, setSlFocused] = useState(false);

    const { selectedAccountId } = useAccounts();
    const { data: accountDetails } = useGetAccountDetails(selectedAccountId);
    const [activeSymbol] = useActiveSymbol();
    const { data: symbolInfo } = useGetSymbolInfo(
        accountDetails?.exchange ?? '',
        accountDetails?.server ?? '',
        activeSymbol!,
    );
    const { findCurrencyPairBySymbol } = useCurrencySymbol();
    const { mutateAsync: createTradeMutation, isPending } = useCreateTradeMutation();

    const takeProfitBottomSheetRef = useRef<BottomSheetModal>(null);
    const stopLossBottomSheetRef = useRef<BottomSheetModal>(null);

    // Symbol data from web logic
    const symbolData = useMemo(() => {
        const symbol = activeSymbol ? findCurrencyPairBySymbol(activeSymbol) : null;
        return {
            marketPrice: symbol?.marketPrice ?? 0,
            ask: symbol?.ask ?? 0,
            bid: symbol?.bid ?? 0,
        };
    }, [activeSymbol, findCurrencyPairBySymbol]);

    // Form setup with web logic - MATCH EXACTLY
    const methods = useForm<TradeFormValues>({
        resolver: zodResolver(
            getTradeFormSchema(
                selectedOrderType,
                showSlTp,
                takeProfitType,
                stopLossType,
                t,
            ),
        ),
        defaultValues: {
            showSlTp: false,
            showTakeProfit: false,
            quantity: accountDetails?.default_lots ?? 0.01,
            add_tp_sl: false,
            add_take_profit: false,
            sl: undefined,
            sl_type: TakeProfitSlTypeEnum.PRICE,
            tp: undefined,
            tp_type: TakeProfitSlTypeEnum.PRICE,
            price: undefined,
            order_type: OrderTypeEnum.MARKET,
            position: PositionTypeEnum.LONG,
        },
    });

    // Sync form values with local state on mount
    useEffect(() => {
        methods.setValue('position', selectedPositionType);
        methods.setValue('order_type', selectedOrderType);
        methods.setValue('showSlTp', showSlTp);
        methods.setValue('add_tp_sl', showSlTp);
    }, [methods, selectedPositionType, selectedOrderType, showSlTp]);

    // Watch price value for buyAtValue calculation
    const priceValue = methods.watch('price');

    // Format to K notation (web logic)
    const formatToK = useCallback((number: number) => {
        if (number >= 1000) {
            return number / 1000 + 'k';
        }
        return number?.toString();
    }, []);

    // Buy at value calculation (web logic) - MATCH EXACTLY
    const buyAtValue = useMemo(() => {
        if (selectedOrderType === OrderTypeEnum.MARKET && symbolData.marketPrice) {
            return ` @ ${symbolData.marketPrice.toLocaleString('en-US', {
                maximumFractionDigits: symbolData.marketPrice.toString().length,
            })}`;
        }

        if (priceValue) {
            return ` @ ${priceValue}`;
        }
        return '';
    }, [priceValue, selectedOrderType, symbolData.marketPrice]);

    // EXACT onSubmit logic from web teammates
    const onSubmit: SubmitHandler<TradeFormValues> = (data: TradeFormValues) => {
        console.log('Form data received:', data); // Debug log

        const tradeData: Partial<
            Omit<
                TradeFormValues,
                | 'quantity'
                | 'price'
                | 'sl'
                | 'tp'
                | 'sl_type'
                | 'tp_type'
                | 'risk_multiplier'
            >
        > &
            OpenTradeInput = {
            account: selectedAccountId,
            symbol: activeSymbol!,
            order_type: selectedOrderType,
            position: selectedPositionType,
            risk_multiplier: null,
            quantity: data.quantity!.toString(),
            price: undefined,
            add_tp_sl: data.add_tp_sl,
            sl: null,
            sl_type: null,
            tp: null,
            tp_type: null,
        };

        if (showSlTp && data.sl) {
            tradeData.sl = data.sl?.toString();
            tradeData.sl_type = data.sl_type ?? TakeProfitSlTypeEnum.PRICE;
        }

        if (showSlTp && data.tp) {
            tradeData.tp = data?.tp?.toString();
            tradeData.tp_type = data.tp_type ?? TakeProfitSlTypeEnum.PRICE;
        }

        if (
            [OrderTypeEnum.LIMIT, OrderTypeEnum.STOP].includes(selectedOrderType) &&
            data.price
        ) {
            tradeData.price = data.price.toString();
        }

        console.log('Creating trade with variables:', tradeData); // Debug log

        void createTradeMutation(tradeData, {
            onSuccess: (response) => {
                if (response.status === StatusEnum.SUCCESS) {
                    console.log('✅ SUCCESS:', t('Position has been successfully opened'), response.message);
                    Alert.alert(
                        t('Success'),
                        t('Position has been successfully opened'),
                        [{ text: 'OK' }]
                    );
                } else {
                    console.log('❌ ERROR:', t('Failed to open a position'), response.message);
                    Alert.alert(
                        t('Error'),
                        t('Failed to open a position') + ': ' + response.message,
                        [{ text: 'OK' }]
                    );
                }
                methods.reset(undefined, {
                    keepValues: true,
                    keepIsSubmitSuccessful: false,
                });
            },
            onError: (error) => {
                console.log('❌ MUTATION ERROR:', error);
                Alert.alert(
                    t('Error'),
                    t('Failed to create trade'),
                    [{ text: 'OK' }]
                );
            }
        });
    };


    // WEB LOGIC: Position select triggers expansion - MATCH EXACTLY
    const handlePositionSelect = (position: PositionTypeEnum) => {
        setClickedPositionType(true); // This is the key state from web
        setSelectedPositionType(position);
        methods.setValue('position', position); // Set form value

        console.log('Position selected:', position); // Debug log
    }

    // WEB LOGIC: Close handler - MATCH EXACTLY
    const handleClose = () => {
        // Reset form first
        methods.reset();
        setSelectedOrderType(OrderTypeEnum.MARKET);
        setClickedPositionType(false); // Reset expansion state
        setShowSlTp(false); // Reset TP/SL state
    }

    const handleQuantityChange = (increment: number) => {
        const currentQuantity = methods.getValues('quantity') || 0.01;
        const newValue = Math.max(0.01, currentQuantity + increment);
        const roundedValue = roundQuantity(newValue);
        methods.setValue('quantity', roundedValue);
        console.log('Quantity updated to:', roundedValue); // Debug log
    }

    const handlePriceChange = (increment: number) => {
        const currentPrice = methods.getValues('price') || 0.01;
        const newValue = Math.max(0.01, currentPrice + increment);
        const roundedValue = roundQuantity(newValue);
        methods.setValue('price', roundedValue);
    }

    const handleTpChange = (increment: number) => {
        const currentTp = methods.getValues('tp') || 0.01;
        const newValue = Math.max(0.01, currentTp + increment);
        const roundedValue = roundQuantity(newValue);
        methods.setValue('tp', roundedValue);
    }

    const handleSlChange = (increment: number) => {
        const currentSl = methods.getValues('sl') || 0.01;
        const newValue = Math.max(0.01, currentSl + increment);
        const roundedValue = roundQuantity(newValue);
        methods.setValue('sl', roundedValue);
    }

    // WEB LOGIC: TP/SL toggle - MATCH EXACTLY
    const handleTpSlToggle = (checked: boolean) => {
        setShowSlTp(checked);
        methods.setValue('showSlTp', checked);
        methods.setValue('add_tp_sl', checked); // This is crucial for the form
    }

    // WEB LOGIC: Order type handler - match exactly
    const handleOrderTypeSelect = (type: OrderTypeEnum) => {
        setSelectedOrderType(type);
        methods.setValue('order_type', type);
        console.log('Order type updated to:', type); // Debug log
    }

    // Bottom sheet handlers
    const openTakeProfitBottomSheet = () => takeProfitBottomSheetRef.current?.present();
    const openStopLossBottomSheet = () => stopLossBottomSheetRef.current?.present();
    const closeTakeProfitBottomSheet = () => takeProfitBottomSheetRef.current?.dismiss();
    const closeStopLossBottomSheet = () => stopLossBottomSheetRef.current?.dismiss();

    const handleTakeProfitTypeSelect = (type: TakeProfitSlTypeEnum) => {
        methods.setValue('tp_type', type);
        closeTakeProfitBottomSheet();
    }

    const handleStopLossTypeSelect = (type: TakeProfitSlTypeEnum) => {
        methods.setValue('sl_type', type);
        closeStopLossBottomSheet();
    }

    // Get current form values for display
    const currentQuantity = methods.watch('quantity') || 0.01;
    const currentPrice = methods.watch('price') || 0.01;
    const currentTp = methods.watch('tp') || 0.01;
    const currentSl = methods.watch('sl') || 0.01;

    const [quantityText, setQuantityText] = useState(currentQuantity.toFixed(2));
    const [priceText, setPriceText] = useState(currentPrice.toFixed(2));
    const [tpText, setTpText] = useState(currentTp.toFixed(2));
    const [slText, setSlText] = useState(currentSl.toFixed(2));

    // Sync text states when form values change (from +/- buttons)
    useEffect(() => {
        setQuantityText(currentQuantity.toFixed(2));
    }, [currentQuantity]);

    useEffect(() => {
        setPriceText(currentPrice.toFixed(2));
    }, [currentPrice]);

    useEffect(() => {
        setTpText(currentTp.toFixed(2));
    }, [currentTp]);

    useEffect(() => {
        setSlText(currentSl.toFixed(2));
    }, [currentSl]);

    type CheckBoxProps = {
        checked: boolean;
        onPress: () => void;
    };

    const CheckBox: React.FC<CheckBoxProps> = ({ checked, onPress }) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center gap-1.5"
            accessible={true}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={t('TP/SL')}
        >
            <View className={`w-5 h-5 border border-[#4F494C] rounded-md items-center justify-center ${checked ? 'bg-primary-100' : 'bg-[#1A1819]'}`}>
                {checked && <Check size={12} color='#fff' />}
            </View>
            <Text className="text-white text-base font-Inter">{t('TP/SL')}</Text>
        </TouchableOpacity>
    );

    return (
        <FormProvider {...methods}>
            {/* FIXED: Remove Animated.View and use dynamic height based on content */}
            <View className="bg-propfirmone-main rounded-lg px-2 m-2">
                <View className="p-2">
                    {/* Top row: Buy/Sell + conditionally show TP/SL checkbox + Close button */}
                    <View className="flex-row items-center">
                        {/* WEB MATCH: Dynamic width based on clickedPositionType state */}
                        <View
                            className={`flex-row gap-2 ${clickedPositionType ? 'flex-1' : 'w-full'}`}
                        >
                            <BuySellButtons
                                buyButtonTitle={t('Buy')}
                                sellButtonTitle={t('Sell')}
                                selectedPositionType={selectedPositionType}
                                onClickBuy={() => handlePositionSelect(PositionTypeEnum.LONG)}
                                onClickSell={() => handlePositionSelect(PositionTypeEnum.SHORT)}
                                isExpanded={clickedPositionType}
                            />
                        </View>

                        {/* WEB MATCH: Show controls only when expanded */}
                        {clickedPositionType && (
                            <View className="flex-row items-center gap-3 ml-4">
                                <CheckBox
                                    checked={showSlTp}
                                    onPress={() => handleTpSlToggle(!showSlTp)}
                                />
                                <View className="w-px h-5 bg-gray-600" />
                                <TouchableOpacity onPress={handleClose}>
                                    <X size={20} color='#898587' />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Expanded content - only show when clickedPositionType is true */}
                    {clickedPositionType && (
                        <>
                            {/* Order type buttons */}
                            <View className="flex-row gap-2 mt-3">
                                {Object.values(OrderTypeEnum).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        className={`flex-1 py-2 rounded-md items-center justify-center ${selectedOrderType === type
                                            ? 'bg-[#252223] border border-[#898587]'
                                            : 'bg-[#1A1819]'
                                            }`}
                                        onPress={() => handleOrderTypeSelect(type)}
                                        activeOpacity={0.8}
                                        disabled={isPending}
                                    >
                                        <Text className={`text-sm font-InterSemiBold ${selectedOrderType === type ? 'text-white' : 'text-gray-400'
                                            }`}>
                                            {t(type.charAt(0).toUpperCase() + type.slice(1))}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Labels row */}
                            <View className="flex-row justify-between items-center mt-3">
                                {selectedOrderType === OrderTypeEnum.MARKET ? (
                                    <>
                                        <Text className="text-gray-400 text-sm font-Inter">
                                            {t('Contracts')}: <Text className="text-white font-Inter">{formatToK(symbolInfo?.contract_size ?? 1)}</Text>
                                        </Text>
                                        <Text className="text-white text-sm font-Inter">{t('Quantity')} ({t('lots')})</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text className="text-gray-400 text-sm font-Inter">
                                            {selectedOrderType === OrderTypeEnum.LIMIT ? t('Limit Price') : t('Stop Price')}
                                        </Text>
                                        <View className="flex-row gap-4">
                                            <Text className="text-gray-400 text-sm font-Inter">
                                                {t('Contracts')}: <Text className="text-white font-Inter">{formatToK(symbolInfo?.contract_size ?? 1)}</Text>
                                            </Text>
                                            <Text className="text-white text-sm font-Inter">{t('Quantity')} ({t('lots')})</Text>
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Input section */}
                            {selectedOrderType === OrderTypeEnum.MARKET ? (
                                // Market: Full-width quantity input only
                                <View className="flex-row items-center rounded-md overflow-hidden mt-3 bg-[#1A1819] border border-gray-600/50">
                                    <TouchableOpacity
                                        className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                        onPress={() => handleQuantityChange(-0.01)}
                                        activeOpacity={0.8}
                                        disabled={isPending}
                                    >
                                        <Minus size={16} strokeWidth={3} color='#898587' />
                                    </TouchableOpacity>

                                    <TextInput
                                        className={`bg-[#1A1819] flex-1 text-center py-3 text-base font-Inter ${parseFloat(quantityText) > 0 ? 'text-white' : 'text-[#898587]'}`}
                                        style={{
                                            borderColor: quantityFocused ? '#E74694' : 'transparent',
                                            borderWidth: quantityFocused ? 1 : 0,
                                        }}
                                        value={quantityText}
                                        onFocus={() => setQuantityFocused(true)}
                                        onBlur={() => {
                                            setQuantityFocused(false);
                                            // Your existing onBlur logic
                                            const numValue = parseFloat(quantityText) || 0.01;
                                            const finalValue = Math.max(0.01, numValue);
                                            methods.setValue('quantity', finalValue);
                                            setQuantityText(finalValue.toFixed(2));
                                        }}
                                        onChangeText={(text) => {
                                            setQuantityText(text);
                                            const numValue = parseFloat(text);
                                            if (!isNaN(numValue) && numValue > 0) {
                                                methods.setValue('quantity', numValue);
                                            }
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0.01"
                                        placeholderTextColor="#898587"
                                        selectTextOnFocus={true}
                                    />

                                    <TouchableOpacity
                                        className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                        onPress={() => handleQuantityChange(0.01)}
                                        activeOpacity={0.8}
                                        disabled={isPending}
                                    >
                                        <Plus size={16} strokeWidth={3} color='#898587' />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                // Limit/Stop: Two inputs side by side
                                <View className="flex-row gap-2 mt-3">
                                    {/* Price Input (Limit or Stop) */}
                                    <View className="flex-1 flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-600/50">
                                        <TouchableOpacity
                                            className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                            onPress={() => handlePriceChange(-0.01)}
                                            activeOpacity={0.8}
                                            disabled={isPending}
                                        >
                                            <Minus size={16} strokeWidth={3} color='#898587' />
                                        </TouchableOpacity>

                                        <TextInput
                                            className={`bg-[#1A1819] flex-1 text-center py-3 text-base font-Inter ${parseFloat(priceText) > 0 ? 'text-white' : 'text-[#898587]'}`}
                                            style={{
                                                borderColor: priceFocused ? '#E74694' : 'transparent',
                                                borderWidth: priceFocused ? 1 : 0,
                                            }}
                                            value={priceText}
                                            onFocus={() => setPriceFocused(true)}
                                            onBlur={() => {
                                                setPriceFocused(false);
                                                const numValue = parseFloat(priceText) || 0;
                                                const finalValue = Math.max(0, numValue);
                                                methods.setValue('price', finalValue);
                                                setPriceText(finalValue.toFixed(2));
                                            }}
                                            onChangeText={(text) => {
                                                setPriceText(text);
                                                const numValue = parseFloat(text);
                                                if (!isNaN(numValue) && numValue >= 0) {
                                                    methods.setValue('price', numValue);
                                                }
                                            }}
                                            keyboardType="numeric"
                                            placeholder="0.01"
                                            placeholderTextColor="#898587"
                                            selectTextOnFocus={true}
                                        />

                                        <TouchableOpacity
                                            className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                            onPress={() => handlePriceChange(0.01)}
                                            activeOpacity={0.8}
                                            disabled={isPending}
                                        >
                                            <Plus size={16} strokeWidth={3} color='#898587' />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Quantity Input */}
                                    <View className="flex-1 flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-600/50">
                                        <TouchableOpacity
                                            className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                            onPress={() => handleQuantityChange(-0.01)}
                                            activeOpacity={0.8}
                                            disabled={isPending}
                                        >
                                            <Minus size={16} strokeWidth={3} color='#898587' />
                                        </TouchableOpacity>


                                        <TextInput
                                            className={`bg-[#1A1819] flex-1 text-center py-3 text-base font-Inter ${parseFloat(quantityText) > 0 ? 'text-white' : 'text-[#898587]'}`}
                                            style={{
                                                borderColor: quantityFocused ? '#E74694' : 'transparent',
                                                borderWidth: quantityFocused ? 1 : 0,
                                            }}
                                            value={quantityText}
                                            onFocus={() => setQuantityFocused(true)}
                                            onBlur={() => {
                                                setQuantityFocused(false);
                                                // Your existing onBlur logic
                                                const numValue = parseFloat(quantityText) || 0.01;
                                                const finalValue = Math.max(0.01, numValue);
                                                methods.setValue('quantity', finalValue);
                                                setQuantityText(finalValue.toFixed(2));
                                            }}
                                            onChangeText={(text) => {
                                                setQuantityText(text);
                                                const numValue = parseFloat(text);
                                                if (!isNaN(numValue) && numValue > 0) {
                                                    methods.setValue('quantity', numValue);
                                                }
                                            }}
                                            keyboardType="numeric"
                                            placeholder="0.01"
                                            placeholderTextColor="#898587"
                                            selectTextOnFocus={true}
                                        />

                                        <TouchableOpacity
                                            className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                            onPress={() => handleQuantityChange(0.01)}
                                            activeOpacity={0.8}
                                            disabled={isPending}
                                        >
                                            <Plus size={16} strokeWidth={3} color='#898587' />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* TP/SL inputs - only show when checkbox is checked */}
                            {showSlTp && (
                                <View className="flex-row gap-2 mt-3">
                                    {/* Take Profit Section */}
                                    <View className="flex-1">
                                        <Text className="text-white text-sm font-Inter mb-2">{t('Take Profit (TP)')}</Text>
                                        <View className="bg-[#1A1819] border border-gray-600/50 rounded-md">
                                            <View className="flex-row items-center">
                                                <TouchableOpacity
                                                    className="py-3 px-3"
                                                    onPress={() => handleTpChange(-0.01)}
                                                    disabled={isPending}
                                                >
                                                    <Minus size={12} color='#898587' />
                                                </TouchableOpacity>

                                                <TextInput
                                                    className={`flex-1 text-center text-sm font-Inter py-3 ${parseFloat(tpText) > 0 ? 'text-white' : 'text-[#898587]'}`}
                                                    style={{
                                                        borderColor: tpFocused ? '#E74694' : 'transparent',
                                                        borderWidth: tpFocused ? 1 : 0,
                                                        borderRadius: 4,
                                                    }}
                                                    value={tpText}
                                                    onFocus={() => setTpFocused(true)}
                                                    onBlur={() => {
                                                        setTpFocused(false);
                                                        const numValue = parseFloat(tpText) || 0;
                                                        const finalValue = Math.max(0, numValue);
                                                        methods.setValue('tp', finalValue);
                                                        setTpText(finalValue.toFixed(2));
                                                    }}
                                                    onChangeText={(text) => {
                                                        setTpText(text);
                                                        const numValue = parseFloat(text);
                                                        if (!isNaN(numValue) && numValue >= 0) {
                                                            methods.setValue('tp', numValue);
                                                        }
                                                    }}
                                                    keyboardType="numeric"
                                                    placeholder="0.01"
                                                    placeholderTextColor="#898587"
                                                    selectTextOnFocus={true}
                                                />

                                                <TouchableOpacity
                                                    className="py-3 px-3"
                                                    onPress={() => handleTpChange(0.01)}
                                                    disabled={isPending}
                                                >
                                                    <Plus size={12} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="w-px h-5 bg-gray-600 mx-2" />

                                                <TouchableOpacity
                                                    className="flex-row items-center gap-1 pr-3"
                                                    onPress={openTakeProfitBottomSheet}
                                                    activeOpacity={0.8}
                                                    disabled={isPending}
                                                >
                                                    <Text className="text-[#898587] text-sm font-Inter">
                                                        {takeProfitType === TakeProfitSlTypeEnum.PIPS ? t('Pips') : t('Price')}
                                                    </Text>
                                                    <ChevronDown size={16} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Stop Loss Section */}
                                    <View className="flex-1">
                                        <Text className="text-white text-sm font-Inter mb-2">{t('Stop Loss (SL)')}</Text>
                                        <View className="bg-[#1A1819] border border-gray-600/50 rounded-md">
                                            <View className="flex-row items-center">
                                                <TouchableOpacity
                                                    className="py-3 px-3"
                                                    onPress={() => handleSlChange(-0.01)}
                                                    disabled={isPending}
                                                >
                                                    <Minus size={12} color='#898587' />
                                                </TouchableOpacity>

                                                <TextInput
                                                    className={`flex-1 text-center text-sm font-Inter py-3 ${parseFloat(slText) > 0 ? 'text-white' : 'text-[#898587]'}`}
                                                    style={{
                                                        borderColor: slFocused ? '#E74694' : 'transparent',
                                                        borderWidth: slFocused ? 1 : 0,
                                                        borderRadius: 4,
                                                    }}
                                                    value={slText}
                                                    onFocus={() => setSlFocused(true)}
                                                    onBlur={() => {
                                                        setSlFocused(false);
                                                        const numValue = parseFloat(slText) || 0;
                                                        const finalValue = Math.max(0, numValue);
                                                        methods.setValue('sl', finalValue);
                                                        setSlText(finalValue.toFixed(2));
                                                    }}
                                                    onChangeText={(text) => {
                                                        setSlText(text);
                                                        const numValue = parseFloat(text);
                                                        if (!isNaN(numValue) && numValue >= 0) {
                                                            methods.setValue('sl', numValue);
                                                        }
                                                    }}
                                                    keyboardType="numeric"
                                                    placeholder="0.01"
                                                    placeholderTextColor="#898587"
                                                    selectTextOnFocus={true}
                                                />

                                                <TouchableOpacity
                                                    className="py-3 px-3"
                                                    onPress={() => handleSlChange(0.01)}
                                                    disabled={isPending}
                                                >
                                                    <Plus size={12} color='#898587' />
                                                </TouchableOpacity>

                                                <View className="w-px h-5 bg-gray-600 mx-2" />

                                                <TouchableOpacity
                                                    className="flex-row items-center gap-1 pr-3"
                                                    onPress={openStopLossBottomSheet}
                                                    activeOpacity={0.8}
                                                    disabled={isPending}
                                                >
                                                    <Text className="text-[#898587] text-sm font-Inter">
                                                        {stopLossType === TakeProfitSlTypeEnum.PIPS ? t('Pips') : t('Price')}
                                                    </Text>
                                                    <ChevronDown size={16} color='#898587' />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Submit Button - Now positioned normally in the flow */}
                            <TouchableOpacity
                                className={`py-3 rounded-md items-center justify-center w-full mt-4 ${selectedPositionType === PositionTypeEnum.LONG ? 'bg-[#31C48D]' : 'bg-red-500'
                                    }`}
                                onPress={() => methods.handleSubmit(onSubmit)()}
                                activeOpacity={0.8}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <View className="flex-row items-center">
                                        <Loader2 size={16} color='#000' className="mr-2" />
                                        <Text className="text-[#000] text-base font-InterMedium ml-2">
                                            {t('Processing...')}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text className="text-[#000] text-base font-InterMedium">
                                        {selectedPositionType === PositionTypeEnum.LONG
                                            ? selectedOrderType === OrderTypeEnum.LIMIT
                                                ? t('Buy Limit')
                                                : selectedOrderType === OrderTypeEnum.STOP
                                                    ? t('Buy Stop')
                                                    : t('Buy')
                                            : selectedOrderType === OrderTypeEnum.LIMIT
                                                ? t('Sell Limit')
                                                : selectedOrderType === OrderTypeEnum.STOP
                                                    ? t('Sell Stop')
                                                    : t('Sell')
                                        }
                                        {buyAtValue}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Bottom Sheets */}
                <TPBottomSheet
                    ref={takeProfitBottomSheetRef}
                    onClose={closeTakeProfitBottomSheet}
                    selectedType={takeProfitType || TakeProfitSlTypeEnum.PRICE}
                    onTypeSelect={handleTakeProfitTypeSelect}
                    isStopLoss={false}
                />

                <TPBottomSheet
                    ref={stopLossBottomSheetRef}
                    onClose={closeStopLossBottomSheet}
                    selectedType={stopLossType || TakeProfitSlTypeEnum.PRICE}
                    onTypeSelect={handleStopLossTypeSelect}
                    isStopLoss={true}
                />

            </View>
        </FormProvider>
    );
};

export default TradingButtons;