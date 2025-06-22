import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Camera, ChevronDown, ChevronUp, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";

interface History {
    id: string;
    symbol: string;
    type: 'LONG' | 'SHORT';
    size: number;
    pnl: number;
    entry: number;
    openTime: string;
    exit?: number;
    exitTime: string;
    roi: number;
    fees: number;
    tags: string[];
}

interface HistoryCardProps {
    history: History;
    isExpanded: boolean;
    onToggleExpansion: (id: string) => void;
    onScreenShot: (history: History) => void;
}

const HistoryCard = ({
    history,
    isExpanded,
    onToggleExpansion,
    onScreenShot
}: HistoryCardProps) => {
    const isProfitable = history.pnl > 0;

    const getTagBackgroundColor = (tag: string, index: number) => {
        const colors = [
            'bg-[#362F78]',
            'bg-[#4A1D96]',
            'bg-[#252223]',
            'bg-[#45152C]',
            'bg-[#233876]'
        ]
        return colors[index % colors.length];
    }

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
                        <Text className="text-white font-InterSemiBold text-base">{history.symbol}</Text>
                    </View>

                    <View className="flex-row items-center">
                        <Text className={`font-InterRegular text-base mr-2 ${history.type === 'LONG' ? 'text-success-main' : 'text-red-500'}`}>
                            {history.type}
                        </Text>
                        <Text className="text-gray-400 font-InterRegular">/ {history.size.toFixed(2)} Size</Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className={`font-InterSemiBold text-base mb-2 ${isProfitable ? 'text-success-main' : 'text-red-500'}`}>
                        ${history.pnl.toFixed(2)} P/L
                    </Text>

                    <View className="flex-row space-x-2">
                        <TouchableOpacity
                            className="w-8 h-8 border-gray-800 rounded-lg items-center justify-center mr-1"
                            onPress={() => onScreenShot(history)}
                        >
                            <Camera size={16} color={'#fff'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-8 h-8 rounded items-center justify-center"
                            onPress={() => onToggleExpansion(history.id)}
                        >
                            {isExpanded ? (
                                <ChevronUp size={16} color={'#fff'} />
                            ) : (
                                <ChevronDown size={16} color={'#fff'} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {isExpanded && (
                <View className="px-4 pb-4 bg-gray-850">
                    <View className="space-y-2">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Entry:</Text>
                            <Text className="text-white font-InterMedium text-sm">{history.entry.toFixed(2)}</Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Entry (GMT)</Text>
                            <Text className="text-white font-InterMedium text-sm">{history.exitTime}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMediumt text-sm">Exit</Text>
                            <Text className="text-white font-InterMediumt text-sm">{history.exit}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Exit (GMT)</Text>
                            <Text className="text-white font-InterMedium text-sm">{history.exitTime}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Fees:</Text>
                            <Text className="text-white font-InterMedium text-sm">${history.fees.toFixed(2)}</Text>
                        </View>

                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
                            <Text className="text-white font-InterMedium text-sm">{history.exit ? history.exit.toFixed(2) : '-'}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
                            <Text className="text-white font-InterMedium text-sm">{history.exit ? history.exit.toFixed(2) : '-'}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">ROI:</Text>
                            <Text className={`font-InterMedium text-sm ${history.roi >= 0 ? 'text-success-main' : 'text-red-500'}`}>
                                {history.roi.toFixed(2)}%
                            </Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 font-InterMedium text-sm">Tags:</Text>
                            <View className="flex-row flex-wrap">
                                {history.tags.map((tag, index) => (
                                    <View
                                        key={index}
                                        className={`${getTagBackgroundColor(tag, index)} px-2 py-1 rounded mr-2 mb-1`}
                                    >
                                        <Text className="text-white font-InterMedium text-xs">
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

export default HistoryCard;