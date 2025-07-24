import BottomSheet from "@gorhom/bottom-sheet";
import { Check, Minus, Plus, X, ChevronDown } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TPBottomSheet from "./TPBottomSheet";

const TradingButtons = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'buy' | 'sell' | null>(null);
    const [orderType, setOrderType] = useState('Market');
    const [quantity, setQuantity] = useState(0.00);
    const [tpSlEnabled, setTpSlEnabled] = useState(false);
    const [takeProfitValue, setTakeProfitValue] = useState(0.00);
    const [stopLossValue, setStopLossValue] = useState(0.00);
    const [constracts] = useState(1);
    const [animatedHeight] = useState(new Animated.Value(40));
    const [takeProfitType, setTakeProfitType] = useState('Price');
    const [stopLossType, setStopLossType] = useState('Price');
    const [limitPrice, setLimitPrice] = useState(999);
    const [stopPrice, setStopPrice] = useState(999);
   

    const takeProfitBottomSheetRef = useRef<BottomSheet>(null);
    const stopLossBottomSheetRef = useRef<BottomSheet>(null);

    const handleActionSelect = (action: any) => {
        setSelectedAction(action);
        setIsExpanded(true);

        //Animate expansion - adjust height based on TP/SL state
        const expandedHeight = tpSlEnabled ? 320 : 240; // Taller if TP/SL is enabled
        Animated.timing(animatedHeight, {
            toValue: expandedHeight,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false
        }).start();
    }

    const handleClose = () => {
        //Animate collapse
        Animated.timing(animatedHeight, {
            toValue: 40, // Match the initial collapsed height
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start(() => {
            setIsExpanded(false);
            setSelectedAction(null);
        })
    }

    const handleQuantityChange = (increment: any) => {
        setQuantity(prev => Math.max(0, prev + increment));
    }

    const handleTpSlToggle = () => {
        const newTpSlState = !tpSlEnabled;
        setTpSlEnabled(newTpSlState);

        // Animate height change when TP/SL is toggled during expanded state
        if (isExpanded) {
            const newHeight = newTpSlState ? 320 : 240;
            Animated.timing(animatedHeight, {
                toValue: newHeight,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false
            }).start();
        }
    }
    const openTakeProfitBottomSheet = () => {
        takeProfitBottomSheetRef.current?.snapToIndex(0);
    }

    const openStopLossBottomSheet = () => {
        stopLossBottomSheetRef.current?.snapToIndex(0);
    }

    const closeTakeProfitBottomSheet = () => {
        takeProfitBottomSheetRef.current?.close();
    }

    const closeStopLossBottomSheet = () => {
        stopLossBottomSheetRef.current?.close();
    }

    const handleTakeProfitTypeSelect = (type: 'Price' | 'Pips') => {
        setTakeProfitType(type);
        closeTakeProfitBottomSheet();
    }

    const handleStopLossTypeSelect = (type: 'Price' | 'Pips') => {
        setStopLossType(type);
        closeStopLossBottomSheet();
    }

    const handleLimitPriceChange = (increment: number) => {
        setLimitPrice(prev => Math.max(0, prev + increment));
    }

    const handleStopPriceChange = (increment: number) => {
        setStopPrice(prev => Math.max(0, prev + increment));
    }

    const currentPrice = 0.8893;

    type CheckBoxProps = {
        checked: boolean;
        onPress: () => void;
    };

    const CheckBox: React.FC<CheckBoxProps> = ({ checked, onPress }) => (
        <TouchableOpacity onPress={onPress} className="flex-row items-center gap-1.5">
            <View className={`w-5 h-5 border border-[#4F494C] rounded-md items-center justify-center ${checked ? 'bg-primary-100' : 'bg-[#1A1819]'}`}>
                {checked &&
                    <Check size={12} color='#fff' />
                }
            </View>
            <Text className="text-white text-base font-Inter">TP/SL</Text>
        </TouchableOpacity>
    );

    if (!isExpanded) {
        // Initial collapsed view - just Buy/Sell buttons with proper spacing
        return (
            <Animated.View
                style={{ height: animatedHeight }}
                className="bg-propfirmone-main rounded-lg px-2 m-2 overflow-hidden"
            >
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        className="flex-1 py-3 px-6 rounded-md items-center justify-center bg-green-900/30 border border-[#31C48D]"
                        onPress={() => handleActionSelect('buy')}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-InterSemiBold">
                            Buy
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 py-3 px-6 rounded-md items-center justify-center bg-red-900/30 border border-[#F05252]"
                        onPress={() => handleActionSelect('sell')}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white text-base font-InterSemiBold">
                            Sell
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={{ height: animatedHeight }}
            className="bg-propfirmone-main rounded-lg p-4 overflow-hidden mt-2"
        >
            {/* Top row: Buy/Sell + TP/SL checkbox + Close button */}
            <View className="flex-row justify-between items-center">
                <View className="flex-row gap-2 flex-1">
                    <TouchableOpacity
                        className={`flex-1 py-2 px-1 rounded-md items-center justify-center ${selectedAction === 'buy' ? 'bg-green-900/30 border border-[#31C48D]' : 'border border-gray-600'
                            }`}
                        onPress={() => setSelectedAction('buy')}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-sm font-InterSemiBold ${selectedAction === 'buy' ? 'text-white' : 'text-green-300'
                            }`}>
                            Buy
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-1 py-2 px-1 rounded-md items-center justify-center ${selectedAction === 'sell' ? 'bg-red-900/30 border border-[#F05252]' : 'border border-gray-600'
                            }`}
                        onPress={() => setSelectedAction('sell')}
                        activeOpacity={0.8}
                    >
                        <Text className={`text-sm font-InterSemiBold ${selectedAction === 'sell' ? 'text-white' : 'text-red-400'
                            }`}>
                            Sell
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-3 ml-10">
                    <CheckBox
                        checked={tpSlEnabled}
                        onPress={handleTpSlToggle}
                    />

                    <View className="w-px h-5 bg-gray-600" />

                    <TouchableOpacity className="" onPress={handleClose}>
                        <X size={20} color='#898587' />
                    </TouchableOpacity>
                </View>
            </View>

            {isExpanded && (
                <>
                    {/* Order type buttons */}
                    <View className="flex-row gap-2 mt-3">
                        {['Market', 'Limit', 'Stop'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                className={`flex-1 py-2 rounded-md items-center justify-center ${orderType === type ? 'bg-[#252223] border border-[#898587]' : 'bg-[#1A1819]'
                                    }`}
                                onPress={() => setOrderType(type)}
                                activeOpacity={0.8}
                            >
                                <Text className={`text-sm text-InterSemiBold ${orderType === type ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contracts and Quantity info - dynamic based on order type */}
                    <View className="flex-row justify-between items-center mt-3">
                        {orderType === 'Market' ? (
                            // Market: Show both labels for full-width quantity input
                            <>
                                <Text className="text-gray-400 text-sm font-Inter">Contracts: <Text className="text-white font-Inter">{constracts}</Text></Text>
                                <Text className="text-white text-sm font-Inter">Quantity (lots)</Text>
                            </>
                        ) : (
                            // Limit/Stop: Show labels for both inputs
                            <>
                                <Text className="text-gray-400 text-sm font-Inter">
                                    {orderType === 'Limit' ? 'Limit Price' : 'Stop Price'}
                                </Text>
                                <View className="flex-row gap-4">
                                    <Text className="text-gray-400 text-sm font-Inter">Contracts: <Text className="text-white font-Inter">{constracts}</Text></Text>
                                    <Text className="text-white text-sm font-Inter">Quantity (lots)</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Input section - dynamic based on order type */}
                    {orderType === 'Market' ? (
                        // Market: Full-width quantity input only
                        <View className="flex-row items-center rounded-md overflow-hidden mt-3 bg-[#1A1819] border border-gray-500/50">
                            <TouchableOpacity
                                className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                onPress={() => handleQuantityChange(-0.01)}
                                activeOpacity={0.8}
                            >
                                <Minus size={16} strokeWidth={3} color='#898587' />
                            </TouchableOpacity>

                            <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                <Text className="text-[#898587] text-base font-Inter">
                                    {quantity.toFixed(2)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                onPress={() => handleQuantityChange(0.01)}
                                activeOpacity={0.8}
                            >
                                <Plus size={16} strokeWidth={3} color='#898587' />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Limit/Stop: Two inputs side by side
                        <View className="flex-row gap-2 mt-3">
                            {/* Price Input (Limit or Stop) */}
                            <View className="flex-1 flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => orderType === 'Limit' ? handleLimitPriceChange(-1) : handleStopPriceChange(-1)}
                                    activeOpacity={0.8}
                                >
                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>

                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                    <Text className="text-[#898587] text-base font-Inter">
                                        {orderType === 'Limit' ? limitPrice : stopPrice}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => orderType === 'Limit' ? handleLimitPriceChange(1) : handleStopPriceChange(1)}
                                    activeOpacity={0.8}
                                >
                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>
                            </View>

                            {/* Quantity Input */}
                            <View className="flex-1 flex-row items-center rounded-md overflow-hidden bg-[#1A1819] border border-gray-500/50">
                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => handleQuantityChange(-0.01)}
                                    activeOpacity={0.8}
                                >
                                    <Minus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>

                                <View className="bg-[#1A1819] flex-1 items-center justify-center py-3">
                                    <Text className="text-[#898587] text-base font-Inter">
                                        {quantity.toFixed(2)}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    className="bg-[#1A1819] py-3 px-4 items-center justify-center"
                                    onPress={() => handleQuantityChange(0.01)}
                                    activeOpacity={0.8}
                                >
                                    <Plus size={16} strokeWidth={3} color='#898587' />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}


                    {/* TP/SL inputs - only show when checkbox is checked */}
                    {tpSlEnabled && (
                        <View className="flex-row gap-2 mt-3">
                            {/* Take Profit Section */}
                            <View className="flex-1">
                                <Text className="text-white text-sm font-Inter mb-2">Take Profit (TP)</Text>
                                <View className="bg-[#1A1819] border border-gray-500/50 rounded-md">
                                    <View className="flex-row items-center justify-between px-3 py-3">
                                        <Text className="text-[#898587] text-sm font-Inter">{takeProfitValue.toFixed(2)}</Text>
                                        <View className="w-px h-5 bg-gray-600" />
                                        <TouchableOpacity
                                            className="flex-row items-center gap-1"
                                            onPress={openTakeProfitBottomSheet}
                                            activeOpacity={0.8}
                                        >
                                            <Text className="text-[#898587] text-sm font-Inter">Price</Text>
                                            <ChevronDown size={16} color='#898587' />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Stop Loss Section */}
                            <View className="flex-1">
                                <Text className="text-white text-sm font-Inter mb-2">Stop Loss (SL)</Text>
                                <View className="bg-[#1A1819] border border-gray-500/50 rounded-md">
                                    <TouchableOpacity
                                        className="flex-row items-center justify-between px-3 py-3"
                                        onPress={openStopLossBottomSheet}
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-[#898587] text-sm font-Inter">{stopLossValue.toFixed(2)}</Text>
                                        <View className="flex-row items-center gap-1">
                                            <Text className="text-[#898587] text-sm font-Inter">Price</Text>
                                            <ChevronDown size={16} color='#898587' />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Final action button */}
                    <TouchableOpacity
                        className={`py-3 rounded-md items-center justify-center mt-3 ${selectedAction === 'buy' ? 'bg-[#31C48D]' : 'bg-red-500'
                            }`}
                        activeOpacity={0.8}
                    >
                        <Text className="text-[#000] text-base font-InterMedium">
                            {selectedAction === 'buy' ? 'Buy' : 'Sell'} @ {currentPrice}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
            <TPBottomSheet
                bottomSheetRef={takeProfitBottomSheetRef}
                onClose={closeTakeProfitBottomSheet}
                selectedType={takeProfitType}
                onTypeSelect={handleTakeProfitTypeSelect}
                title="Take Profit (TP)"
            />

            {/* Stop Loss BottomSheet */}
            <TPBottomSheet
                bottomSheetRef={stopLossBottomSheetRef}
                onClose={closeStopLossBottomSheet}
                selectedType={stopLossType}
                onTypeSelect={handleStopLossTypeSelect}
                title="Stop Loss (SL)"
            />
        </Animated.View>
    );
};

export default TradingButtons;