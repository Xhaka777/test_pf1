import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Camera, ChevronDown, ChevronUp } from "lucide-react-native";
import images from "@/constants/images";
import { TradeHistoryData } from "@/api/schema/trade-history";
import { getCurrencyFlags, CurrencyCodeEnum } from "@/api/utils/currency-trade";
import { useGetJournalTags } from "@/api/hooks/hournal-service";

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

    // Handle negative values properly with prefix
    const displayValue = isPositive 
        ? `${prefix}${value.toFixed(decimals)}${suffix}`
        : `-${prefix}${Math.abs(value).toFixed(decimals)}${suffix}`;

    return (
        <Text className={`font-font-InterMedium text-base ${colorClass}`}>
            {displayValue}
        </Text>
    );
};

const PositionTypeValue: React.FC<{ type: string }> = ({ type }) => {
    const upperCaseType = type.toUpperCase();
    const colorClass = upperCaseType === 'LONG' || upperCaseType === 'BUY' || upperCaseType.includes('LONG') || upperCaseType.includes('BUY')
        ? 'text-success-main'
        : 'text-red-500';
    return (
        <Text className={`font-InterRegular ${colorClass}`}>
            {upperCaseType}
        </Text>
    );
};

const formatDateTime = (dateString: string): { date: string; time: string } => {
    try {
        const dateObj = new Date(dateString);
        const date = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        const time = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        return { date, time };
    } catch (error) {
        return { date: dateString, time: '' };
    }
};

// Component for displaying date and time with different colors
const DateTimeDisplay: React.FC<{ dateString: string }> = ({ dateString }) => {
    const { date, time } = formatDateTime(dateString);
    
    return (
        <View className="flex-row items-center">
            <Text className="text-white font-InterMedium text-sm">
                {date}
            </Text>
            {time && (
                <>
                    <Text className="text-white font-InterMedium text-sm">, </Text>
                    <Text className="text-[#898587] font-InterMedium text-sm">
                        {time}
                    </Text>
                </>
            )}
        </View>
    );
};

// Updated TagsList component to use dynamic colors from API
const TagsList: React.FC<{ 
    tags: string[]; 
    journalTagsData?: { tags: Array<{ tag: string; colour: string }> }; 
}> = ({ tags, journalTagsData }) => {
    // Fallback colors if API data is not available
    const fallbackColors = [
        '#362F78', // Indigo
        '#4A1D96', // Purple  
        '#2F2C2D', // Dark
        '#45152C', // Primary
        '#233876', // Blue
        '#F05252', // Red
        '#E74694', // Primary-theme
        '#63311240' // Yellow (with opacity)
    ];

    const getTagBackgroundColor = (tag: string, index: number) => {
        if (journalTagsData?.tags) {
            // Try to find the tag in the API data
            const apiTag = journalTagsData.tags.find(apiTag => 
                apiTag.tag.toLowerCase() === tag.toLowerCase()
            );
            
            if (apiTag) {
                // Map the exact API color strings to your specified hex colors
                const colorMapping: { [key: string]: { background: string; text: string } } = {
                    'bg-primary-theme text-foreground hover:bg-primary-hover': {
                        background: '#E74694',
                        text: '#FFF'
                    },
                    'bg-primary text-primary-foreground hover:bg-primary/80': {
                        background: '#45152C',
                        text: '#F190BF'
                    },
                    'border-transparent bg-dark text-foreground-secondary hover:bg-dark/80': {
                        background: '#2F2C2D',
                        text: '#C3C1C1'
                    },
                    'bg-blue text-blue-foreground hover:bg-blue/80': {
                        background: '#233876',
                        text: '#76A9FA'
                    },
                    'border-transparent bg-red-theme text-red-foreground hover:bg-red-theme/80': {
                        background: '#F05252',
                        text: '#F8B4B4'
                    },
                    'bg-indigo text-indigo-foreground hover:bg-indigo/80': {
                        background: '#362F78',
                        text: '#B4C6FC'
                    },
                    'bg-purple text-purple-foreground hover:bg-purple/80': {
                        background: '#4A1D96',
                        text: '#CABFFD'
                    },
                    'bg-yellow/30 text-yellow-foreground hover:bg-yellow/80': {
                        background: '#6331124C', // With opacity
                        text: '#FACA15'
                    }
                };
                
                const colorData = colorMapping[apiTag.colour];
                if (colorData) {
                    return {
                        backgroundColor: colorData.background,
                        color: colorData.text
                    };
                }
            }
        }
        
        // Fallback to index-based color selection
        return {
            backgroundColor: fallbackColors[index % fallbackColors.length],
            color: '#FFF' // Default white text
        };
    };

    return (
        <View className="flex-row flex-wrap">
            {tags.map((tag, index) => {
                const { backgroundColor, color } = getTagBackgroundColor(tag, index);
                
                return (
                    <View
                        key={`${tag}-${index}`}
                        className="px-2 py-1 rounded mr-1 mb-1"
                        style={{ backgroundColor }}
                    >
                        <Text 
                            className="font-InterMedium text-xs"
                            style={{ color }}
                        >
                            {tag}
                        </Text>
                    </View>
                );
            })}
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

    // Get journal tags data for dynamic colors
    const { data: journalTagsData, isLoading: isLoadingTags } = useGetJournalTags();

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

                console.log('trade.tags', trade.tags);
                console.log('journalTagsData', journalTagsData);

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
                            <View className="px-4 pb-4 bg-gray-850">
                                <View className="mt-2 space-y-3">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Entry:</Text>
                                        <DirectionValue
                                            value={trade.entry}
                                            prefix=""
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Open (GMT):</Text>
                                        <DateTimeDisplay dateString={trade.open_time} />
                                    </View>

                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Exit:</Text>
                                        <DirectionValue
                                            value={trade.exit}
                                            prefix=""
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Exit (GMT):</Text>
                                        <DateTimeDisplay dateString={trade.exit_time} />
                                    </View>
                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">ROI:</Text>
                                        <DirectionValue
                                            value={trade.roi}
                                            suffix="%"
                                            colorized
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Fees:</Text>
                                        <DirectionValue
                                            value={trade.fees}
                                            prefix="$"
                                            colorized
                                            decimals={2}
                                        />
                                    </View>

                                    <View className="flex-row justify-between items-start mt-1">
                                        <Text className="text-[#898587] font-InterMedium text-sm">Tags:</Text>
                                        {trade.tags?.length ? (
                                            <TagsList 
                                                tags={trade.tags} 
                                                journalTagsData={journalTagsData}
                                            />
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