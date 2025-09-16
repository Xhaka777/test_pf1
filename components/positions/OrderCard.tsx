import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";
import { OpenTradesData } from "@/api/schema/trade-service";
import { getCurrencyFlags, CurrencyCodeEnum } from "@/api/utils/currency-trade";

export type OpenOrdersListProps = {
    openOrders: OpenTradesData['open_orders'];
    oneClickTradingEnabled?: boolean;
    onEditOrder?: (order: OpenTradesData['open_orders'][number]) => void;
    onClose: (order: OpenTradesData['open_orders'][number]) => void; // Made required since we always want to use bottom sheet
}

const getCurrencyFlagImage = (currency: CurrencyCodeEnum) => {
    const flagMap = {
        [CurrencyCodeEnum.USD]: images.usa_png,
        [CurrencyCodeEnum.EUR]: images.eur_png,
        [CurrencyCodeEnum.GBP]: images.gbp_png,
        [CurrencyCodeEnum.JPY]: images.jpy_png,
        [CurrencyCodeEnum.AUD]: images.aud_png,
        [CurrencyCodeEnum.CAD]: images.cad_png,
        [CurrencyCodeEnum.CHF]: images.chf_png,
        [CurrencyCodeEnum.NZD]: images.nzd_png,
        [CurrencyCodeEnum.BTC]: images.btc_png,
        [CurrencyCodeEnum.USDT]: images.usdt_png,
        [CurrencyCodeEnum.UNKNOWN]: images.usa_png,
    };
    return flagMap[currency] || images.usa_png;
};

const DirectionValue: React.FC<{
    value: number;
    prefix?: string;
    suffix?: string;
    colorized?: boolean;
    decimals?: number;
}> = ({ value, prefix = '', suffix = '', colorized = false, decimals = 2 }) => {
    const isPositive = value >= 0;
    const colorClass = colorized
        ? (isPositive ? 'text-success-main' : 'text-red-500')
        : 'text-white';

    return (
        <Text className={`font-InterRegular ${colorClass}`}>
            {prefix}{value.toFixed(decimals)} {suffix}
        </Text>
    );
};

const PositionTypeValue: React.FC<{ type: string }> = ({ type }) => {
    const colorClass = type === 'BUY' || type === 'LONG' || type.toLowerCase().includes('buy') || type.toLowerCase().includes('long')
        ? 'text-success-main'
        : 'text-red-500';
    return (
        <Text className={`font-InterRegular ${colorClass}`}>
            {type}
        </Text>
    );
};

const formatDateTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch (error) {
        return dateString;
    }
};

function OrderCard(props: OpenOrdersListProps) {
    const { openOrders, oneClickTradingEnabled = false, onEditOrder, onClose } = props;

    // ✅ FIXED: Always call useState, regardless of data length
    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

    // ✅ FIXED: Always call useCallback hooks, regardless of data length
    const handleToggleExpansion = useCallback((uniqueKey: string) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [uniqueKey]: !prev[uniqueKey],
        }));
    }, []);

    const handleEdit = useCallback((order: OpenTradesData['open_orders'][number]) => {
        if (onEditOrder) {
            setTimeout(() => {
                onEditOrder(order);
            }, 100);
        }
    }, [onEditOrder]);

    const handleClose = useCallback((order: OpenTradesData['open_orders'][number]) => {
        setTimeout(() => {
            onClose(order);
        }, 100);
    }, [onClose]);

    // ✅ FIXED: Early return after all hooks have been called
    if (!openOrders.length) {
        return (
            <View className="flex-1 items-center justify-center p-8">
                <Text className="text-gray-400 font-InterRegular text-center">
                    No open orders
                </Text>
            </View>
        );
    }

    // Create unique key for orders (similar to HistoryCard fix)
    const createUniqueKey = (order: OpenTradesData['open_orders'][number], index: number): string => {
        return `${order.order_id || 'unknown'}-${index}-${order.symbol || 'nosymbol'}`;
    };

    return (
        <View className="flex flex-col gap-4 p-4">
            {openOrders.map((order, index) => {
                const { from, to } = getCurrencyFlags(order.symbol);
                const fromFlagImage = getCurrencyFlagImage(from);
                const toFlagImage = getCurrencyFlagImage(to);
                
                // Create unique key for this order
                const uniqueKey = createUniqueKey(order, index);
                const isExpanded = expandedOrders[uniqueKey];

                return (
                    <View key={uniqueKey} className="bg-propfirmone-300 rounded-md shadow-lg">
                        {/* Main Order Row */}
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-4"
                            onPress={() => handleToggleExpansion(uniqueKey)}
                            activeOpacity={0.7}
                        >
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    {/* Dynamic flag display using actual currency flags */}
                                    <View style={{ flexDirection: 'row' }}>
                                        <Image
                                            source={fromFlagImage}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <Image
                                            source={toFlagImage}
                                            style={{ width: 18, height: 18, marginLeft: -6 }}
                                        />
                                    </View>
                                    <Text className="text-white font-InterSemiBold text-base ml-2">
                                        {order.symbol}
                                    </Text>
                                </View>

                                {/* Bottom row - Order Type and Size */}
                                <View className="flex-row items-center">
                                    <PositionTypeValue type={order.position_type} />
                                    <Text className="text-gray-400 font-InterRegular mx-1">/</Text>
                                    <Text className="text-white font-InterRegular">{order.quantity}</Text>
                                    <Text className="text-gray-400 font-InterRegular ml-1">Size</Text>
                                </View>
                            </View>

                            {/* Right side - Price and Actions */}
                            <View className="items-end">
                                <View className="flex-row items-center mb-2">
                                    <DirectionValue
                                        value={order.price}
                                        prefix="$"
                                        decimals={2}
                                    />
                                    <Text className="text-gray-400 font-InterRegular ml-1 text-xs">Price</Text>
                                </View>

                                <View className="flex-row items-center space-x-2">
                                    {onEditOrder && (
                                        <TouchableOpacity
                                            className="w-8 h-8 border border-gray-800 rounded-lg items-center justify-center mr-1"
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleEdit(order);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Pencil size={12} color="white" />
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center mr-1"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleClose(order);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <X size={12} color="white" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="w-8 h-8 rounded items-center justify-center"
                                        onPress={() => handleToggleExpansion(uniqueKey)}
                                        activeOpacity={0.7}
                                    >
                                        {isExpanded ?
                                            <ChevronUp size={16} color="white" /> :
                                            <ChevronDown size={16} color="white" />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Enhanced Expanded Details */}
                        {isExpanded && (
                            <View className="px-4 pb-4 bg-gray-850 border-t border-gray-700">
                                <View className="mt-3 space-y-3">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">ID:</Text>
                                        <Text className="text-white font-InterMedium text-sm">{order.order_id}</Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {order.tp ? order.tp.toFixed(2) : (
                                                <Text className="text-gray-400">-</Text>
                                            )}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {order.sl ? order.sl.toFixed(2) : (
                                                <Text className="text-gray-400">-</Text>
                                            )}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Placed (GMT):</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {formatDateTime(order.placed_time)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

export default OrderCard;