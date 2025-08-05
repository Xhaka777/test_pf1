import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";
import { OpenTradesData } from "@/api/schema/trade-service";
import { useCancelOrderMutation } from "@/api/hooks/trade-service";
import { useAccounts } from "@/providers/accounts";
import { number } from "zod";
import { getCurrencyFlags } from "@/api/utils/currency-trade";


export type OpenOrdersListProps = {
    openOrders: OpenTradesData['open_orders'];
    oneClickTradingEnabled?: boolean;
    onEditOrder?: (order: OpenTradesData['open_orders'][number]) => void;
    onCancelOrder?: (order: OpenTradesData['open_orders'][number]) => void;
}

function OrderCard(props: OpenOrdersListProps) {

    const { openOrders, oneClickTradingEnabled = false, onEditOrder, onCancelOrder } = props;
    const { mutateAsync: cancelOrder } = useCancelOrderMutation();
    const { selectedAccountId } = useAccounts();

    const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
    const [currentOrder, setCurrentOrder] = useState<OpenTradesData['open_orders'][number] | null>(null);
    const [editOrderDialogVisible, setEditOrderDialogVisible] = useState(false);

    if (!openOrders.length) {
        return (
            <View className="flex-1 items-center justify-center p-8">
                <Text className="text-gray-400 text-center text-base">No open orders</Text>
            </View>
        )
    }

    const handleToggleExpansion = useCallback((orderId: string) => {
        setExpandedOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }))
    }, []);

    const handleEdit = useCallback((order: OpenTradesData['open_orders'][number]) => {
        if (onEditOrder) {
            onEditOrder(order);
        }
    }, [onEditOrder]);

    const handleCancelOrder = useCallback(async (order: OpenTradesData['open_orders'][number]) => {
        if (onCancelOrder) {
            onCancelOrder(order);
            return;
        }

        try {
            //
            if (!oneClickTradingEnabled) {

            }

            await cancelOrder({
                symbol: order.symbol,
                account: selectedAccountId,
                order_id: order.order_id,
            })
            //
            console.log(`Order "${order.order_id}" canceled successfully`);
        } catch (error) {
            console.error(`Failed to cancel order:`, error);
        }
    }, [onCancelOrder, cancelOrder, selectedAccountId, oneClickTradingEnabled]);

    const getCurrencyImages = (symbol: string) => {
        const { from, to } = getCurrencyFlags(symbol);

        // Map currency codes to your local images from constants
        const getLocalImage = (currencyCode: string) => {
            switch (currencyCode) {
                case 'AUD':
                    return images.aud_png; // Add this to your images constants
                case 'BTC':
                    return images.btc_png; // Add this to your images constants
                case 'EUR':
                    return images.eur_png; // Add this to your images constants
                case 'CHF':
                    return images.chf_png; // Add this to your images constants
                case 'JPY':
                    return images.jpy_png; // Add this to your images constants
                case 'GBP':
                    return images.gbp_png; // Add this to your images constants
                case 'NZD':
                    return images.nzd_png; // Add this to your images constants
                case 'CAD':
                    return images.cad_png; // Add this to your images constants
                case 'USD':
                case 'USDT':
                    return images.usa_png; // Your existing USA flag
                case 'UNKNOWN':
                default:
                    return images.usa_png; // Fallback to USA flag
            }
        };

        return {
            fromImage: getLocalImage(from),
            toImage: getLocalImage(to),
        };
    };


    return (
        <View className="flex-1 p-4">
            {openOrders.map((order) => {
                const isExpanded = expandedOrders[order.order_id];
                const { fromImage, toImage } = getCurrencyImages(order.symbol);

                return (
                    <View key={order.order_id} className="bg-propfirmone-300 rounded-md mb-4 shadow-lg">
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-4"
                            onPress={() => handleToggleExpansion(order.order_id)}
                        >
                            <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                    <View style={{ flexDirection: 'row' }}>

                                        <Image
                                            source={fromImage}
                                            style={{ width: 18, height: 18 }}
                                        />
                                        <Image source={toImage}
                                            style={{ width: 18, height: 18, marginLeft: -6 }}
                                        />
                                    </View>
                                    <Text className="text-white text-base font-InterSemiBold ml-2">
                                        {order.symbol}
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <Text className={`font-InterRegular text-base mr-2 ${order.position_type === 'BUY' || order.position_type === 'LONG'
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                        }`}>
                                        {order.position_type}
                                    </Text>
                                    <Text className="font-InterRegular text-base text-gray-400">
                                        / {order.quantity} Size
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row space-x-2">
                                <TouchableOpacity
                                    className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center"
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleEdit(order);
                                    }}
                                >
                                    <Pencil size={18} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center"
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleCancelOrder(order);
                                    }}
                                >
                                    <X size={18} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center"
                                    onPress={() => handleToggleExpansion(order.order_id)}
                                >
                                    {isExpanded ? (
                                        <ChevronUp size={18} color="white" />
                                    ) : (
                                        <ChevronDown size={18} color="white" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>

                        {isExpanded && (
                            <View className="px-4 pb-4 bg-gray-850">
                                <View className="space-y-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400 font-InterMedium text-sm">ID:</Text>
                                        <Text className="text-white font-InterMedium text-sm">{order.order_id}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {order.tp ? order.tp.toFixed(2) : '-'}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
                                        <Text className="text-white font-InterMedium text-sm">{order.sl ? order.sl.toFixed(2) : '-'}</Text>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Placed (GMT):</Text>
                                        <Text className="text-gray-400 font-InterMedium text-sm">{order.placed_time}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )
            })}
        </View>
    )
}

export default OrderCard;