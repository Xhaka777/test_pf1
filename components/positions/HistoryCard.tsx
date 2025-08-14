import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Camera, ChevronDown, ChevronUp } from "lucide-react-native";
import images from "@/constants/images";
import { TradeHistoryData } from "@/api/schema/trade-history";
import { getCurrencyFlags, CurrencyCodeEnum } from "@/api/utils/currency-trade";

export type HistoryCardProps = {
    orderHistory: TradeHistoryData['all_trades'];
    page?: number;
    setPage?: (page: number) => void;
    total?: number;
    onScreenShot: (history: TradeHistoryData['all_trades'][number]) => void;
};

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
        [CurrencyCodeEnum.UKNOWN]: images.usa_png,
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
    const colorClass = type === 'LONG' || type === 'BUY' || type.toLowerCase().includes('long') || type.toLowerCase().includes('buy')
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

const TagsList: React.FC<{ tags: string[] }> = ({ tags }) => {
    const getTagBackgroundColor = (tag: string, index: number) => {
        const colors = [
            'bg-[#362F78]',
            'bg-[#4A1D96]',
            'bg-[#252223]',
            'bg-[#45152C]',
            'bg-[#233876]'
        ];
        return colors[index % colors.length];
    };

    return (
        <View className="flex-row flex-wrap">
            {tags.map((tag, index) => (
                <View
                    key={`${tag}-${index}`} // Use tag and index to ensure uniqueness
                    className={`${getTagBackgroundColor(tag, index)} px-2 py-1 rounded mr-1 mb-1`}
                >
                    <Text className="text-white font-InterMedium text-xs">
                        {tag}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const HistoryCard: React.FC<HistoryCardProps> = ({
    orderHistory,
    page,
    setPage,
    total,
    onScreenShot
}) => {
    const [expandedTrades, setExpandedTrades] = useState<Record<string, boolean>>({});
    const [currentPosition, setCurrentPosition] = useState<TradeHistoryData['all_trades'][number] | null>(null);
    const currentPositionRef = useRef<TradeHistoryData['all_trades'][number] | null>(null);

    // Same logic as web version for maintaining current position
    useEffect(() => {
        if (currentPositionRef.current && orderHistory.length) {
            const item = orderHistory.find(
                (row) => row.trade_id === currentPositionRef.current?.trade_id,
            );
            if (item) {
                setCurrentPosition(item);
            }
        }
    }, [orderHistory]);

    useEffect(() => {
        currentPositionRef.current = currentPosition;
    }, [currentPosition]);

    if (!orderHistory.length) {
        return (
            <View className="flex-1 items-center justify-center p-8">
                <Text className="text-gray-400 font-InterRegular text-center">
                    History is empty
                </Text>
            </View>
        );
    }

    // Create a unique key for each trade by combining order_id with array index
    const createUniqueKey = (trade: TradeHistoryData['all_trades'][number], index: number): string => {
        return `${trade.order_id || 'unknown'}-${index}-${trade.symbol || 'nosymbol'}`;
    };

    const handleToggleExpansion = (uniqueKey: string) => {
        setExpandedTrades((prev) => ({
            ...prev,
            [uniqueKey]: !prev[uniqueKey],
        }));
    };

    const handleScreenShot = (trade: TradeHistoryData['all_trades'][number]) => {
        setCurrentPosition(trade);
        setTimeout(() => {
            onScreenShot(trade);
        }, 100);
    };

    return (
        <View className="flex flex-col gap-4 p-4">
            {orderHistory.map((trade, index) => {
                const { from, to } = getCurrencyFlags(trade.symbol);
                const fromFlagImage = getCurrencyFlagImage(from);
                const toFlagImage = getCurrencyFlagImage(to);
                
                // Create unique key for this trade
                const uniqueKey = createUniqueKey(trade, index);
                const isExpanded = expandedTrades[uniqueKey];

                return (
                    <View key={uniqueKey} className="bg-propfirmone-300 rounded-md shadow-lg">
                        {/* Main History Row */}
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
                                        {trade.symbol}
                                    </Text>
                                </View>

                                {/* Bottom row - Position Type and Size */}
                                <View className="flex-row items-center">
                                    <PositionTypeValue type={trade.position_type} />
                                    <Text className="text-gray-400 font-InterRegular mx-1">/</Text>
                                    <Text className="text-white font-InterRegular">{trade.quantity}</Text>
                                    <Text className="text-gray-400 font-InterRegular ml-1">Size</Text>
                                </View>
                            </View>

                            {/* Right side - P/L and Actions */}
                            <View className="items-end">
                                <View className="flex-row items-center mb-2">
                                    <DirectionValue
                                        value={trade.pl}
                                        prefix="$"
                                        colorized
                                        decimals={2}
                                    />
                                    <Text className="text-gray-400 font-InterRegular ml-1 text-xs">P/L</Text>
                                </View>

                                <View className="flex-row items-center space-x-2">
                                    <TouchableOpacity
                                        className="w-8 h-8 border border-gray-800 rounded-lg items-center justify-center mr-1"
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleScreenShot(trade);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Camera size={12} color="white" />
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
                                        <Text className="text-gray-400 font-InterMedium text-sm">Entry:</Text>
                                        <DirectionValue
                                            value={trade.entry}
                                            prefix="$"
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Entry (GMT):</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {formatDateTime(trade.open_time)}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Exit:</Text>
                                        <DirectionValue
                                            value={trade.exit}
                                            prefix="$"
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Exit (GMT):</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {formatDateTime(trade.exit_time)}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Fees:</Text>
                                        <DirectionValue
                                            value={trade.fees}
                                            prefix="$"
                                            colorized
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {trade.tp ? trade.tp.toFixed(2) : (
                                                <Text className="text-gray-400">-</Text>
                                            )}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
                                        <Text className="text-white font-InterMedium text-sm">
                                            {trade.sl ? trade.sl.toFixed(2) : (
                                                <Text className="text-gray-400">-</Text>
                                            )}
                                        </Text>
                                    </View>

                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-gray-400 font-InterMedium text-sm">ROI:</Text>
                                        <DirectionValue
                                            value={trade.roi}
                                            suffix="%"
                                            colorized
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-start">
                                        <Text className="text-gray-400 font-InterMedium text-sm">Tags:</Text>
                                        {trade.tags?.length ? (
                                            <TagsList tags={trade.tags} />
                                        ) : (
                                            <Text className="text-gray-400 font-InterMedium text-sm">-</Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}

            {/* Pagination could be added here if needed */}
            {total && total > 0 && (
                <View className="p-4">
                    <Text className="text-gray-400 text-center">
                        Showing {orderHistory.length} of {total} trades
                    </Text>
                </View>
            )}
        </View>
    );
};

export default HistoryCard;