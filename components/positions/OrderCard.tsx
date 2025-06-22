import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";

interface Order {
    id: string;
    symbol: string;
    type: 'LONG' | 'SHORT';
    size: number;
    price: number;
    tp?: number;
    sl?: number;
    openTime: string;
}

interface OrderCardProps {
    order: Order;
    isExpanded: boolean;
    onToggleExpansion: (id: string) => void;
    onEdit: (order: Order) => void;
    onCancel: (order: Order) => void;
}

const OrderCard = ({
    order,
    isExpanded,
    onToggleExpansion,
    onEdit,
    onCancel
}: OrderCardProps) => {
    return (
        <View className="bg-propfirmone-300 rounded-md m-2 shadow-lg">
            <View className="flex-row items-center justify-between p-4">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <View style={{ flexDirection: 'row' }}>
                            <Image
                                source={images.usa_png}
                                style={{ width: 18, height: 18 }}
                            />
                            <Image
                                source={images.usa_png}
                                style={{ width: 18, height: 18, marginLeft: -6 }}
                            />
                        </View>
                        <Text className="text-white font-InterSemiBold text-base">
                            {order.symbol}
                        </Text>
                    </View>

                    <View className="flex-row items-center">
                        <Text className={`font-InterRegular text-base mr-2 ${order.type === 'LONG' ? 'text-success-main' : 'text-red-500'}`}>
                            {order.type}
                        </Text>
                        <Text className="font-InterRegular text-base text-gray-400">
                            / {order.size.toFixed(2)} Size
                        </Text>
                    </View>
                </View>

                {/* Right side - P/L and Actions */}
                <View className="items-end">
                    <Text className={`font-InterSemiBold text-base mb-2 text-white`}>
                        ${order.price} P/L
                    </Text>

                    <View className="flex-row space-x-2">
                        <TouchableOpacity
                            className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center"
                            onPress={() => onCancel(order)}
                        >
                            <X size={18} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-8 h-8 rounded items-center justify-center"
                            onPress={() => onToggleExpansion(order.id)}
                        >
                            {isExpanded ?
                                <ChevronDown size={12} color="white" /> :
                                <ChevronUp size={12} color="white" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {isExpanded && (
                <View className="px-4 pb-4 bg-gray-850">
                    <View className="space-y-2">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
                            <Text className="text-white font-InterMedium text-sm">{order.tp ? order.tp.toFixed(2) : '-'}</Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
                            <Text className="text-white font-InterMedium text-sm">{order.sl ? order.sl.toFixed(2) : '-'}</Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Order ID:</Text>
                            <Text className="text-white font-InterMedium text-sm">{order.id}</Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Open (GMT):</Text>
                            <Text className="text-white font-InterMedium text-sm">{order.openTime}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
}

export default OrderCard;