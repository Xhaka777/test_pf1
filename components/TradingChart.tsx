import { Calendar, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SelectableButton from './SelectableButton';

const { width } = Dimensions.get('window');

const TradingChart = () => {
    const { width, height } = Dimensions.get('window');
    const verticalLines = 4; // 4 columns
    const horizontalLines = 22; // 22 rows

    const columnSpacing = width / verticalLines;
    const rowSpacing = (height - 60) / horizontalLines; // Subtract toolbar height

    const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showBottomDropdown, setShowBottomDropdown] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('1D');

    const timeframes = [
        { label: '1 minute', value: '1m' },
        { label: '3 minutes', value: '3m' },
        { label: '5 minutes', value: '5m' },
        { label: '15 minutes', value: '15m' },
        { label: '30 minutes', value: '30m' },
        { separator: true },
        { label: '1 hour', value: '1h' },
        { label: '4 hours', value: '4h' },
        { separator: true },
        { label: '1 day', value: '1d' },
        { label: '1 week', value: '1w' },
        { label: '1 month', value: '1M' },
    ];

    const periods = [
        { label: '5 years in 1 week intervals', value: '5Y' },
        { label: '1 year in 1 week intervals', value: '1Y' },
        { label: '3 months in 1 hour intervals', value: '3M' },
        { label: '1 month in 30 minutes intervals', value: '1M' },
        { label: '5 days in 5 minutes intervals', value: '5D' },
        { label: '1 day in 1 minute intervals', value: '1D' },
    ];
    return (
        <View className="flex-1">
            {/* Toolbar */}
            <View className="h-15 flex-row items-center px-4 border-b border-gray-700">
                {/* Time Selection */}
                <View className="flex-row items-center">
                    <TouchableOpacity className="px-3 py-2 rounded">
                        <Text className="text-gray-400 text-sm font-medium">1m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-2  rounded">
                        <Text className="text-gray-400 text-sm font-medium">30m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-2 rounded bg-gray-700">
                        <Text className="text-white text-sm font-medium">1h</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-2 py-2"
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <ChevronDown size={16} color='white' />
                        {/* <Text className="text-gray-400 text-xs">⌄</Text> */}
                    </TouchableOpacity>
                </View>

                {/* Separator */}
                <View className="w-px h-7 bg-gray-700" />

                {/* Chart Tools */}
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity className="px-3 py-2">
                        {/* <Text className="text-gray-400 text-base">📊</Text> */}
                        <MaterialIcons name="candlestick-chart" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-2">
                        <Text className="text-gray-400 text-base">ƒₓ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-2">
                        <Text className="text-gray-400 text-sm">Indicators</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-2 mr-3">
                        <Text className="text-gray-400 text-sm">On Chart Trading</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grid View - Your existing code */}
            <View className="flex-1 relative">
                {/* Vertical Lines */}
                {Array.from({ length: verticalLines + 1 }).map((_, i) => (
                    <View
                        key={`v-${i}`}
                        className="absolute bg-gray-700"
                        style={{
                            height: '100%',
                            width: 0.5,
                            left: i * columnSpacing,
                            top: 0,
                        }}
                    />
                ))}

                {/* Horizontal Lines */}
                {Array.from({ length: horizontalLines + 1 }).map((_, i) => (
                    <View
                        key={`h-${i}`}
                        className="absolute bg-gray-700"
                        style={{
                            width: '100%',
                            height: 0.7,
                            top: i * rowSpacing,
                            left: 0,
                        }}
                    />
                ))}
            </View>
            <View className="h-12 bg-propfirmone-main flex-row items-center px-4 border-t border-gray-700">
                {/* Period Selection */}
                <View className="flex-row items-center mr-4">
                    <TouchableOpacity className="px-3 py-1 bg-gray-700 rounded">
                        <Text className="text-white text-sm font-medium">{selectedPeriod}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-2 py-1"
                        onPress={() => setShowBottomDropdown(!showBottomDropdown)}
                    >
                        {/* <Text className="text-gray-400 text-xs">⌄</Text> */}
                        <ChevronDown size={16} color='white' />
                    </TouchableOpacity>
                </View>

                {/* Separator */}
                <View className="w-px h-6 bg-gray-700 mr-4" />

                {/* Empty flex space */}
                <View className="flex-1" />

                {/* Time and Tools */}
                <View className="flex-row items-center">
                    <TouchableOpacity className="px-2 py-1 mr-3">
                        {/* <Text className="text-gray-400 text-sm">📅</Text> */}
                        <Calendar size={16} color='white' />
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-xs mr-3">09:57:34(UTC)</Text>
                </View>

                {/* Separator */}
                <View className="w-px h-6 bg-gray-700 " />

                {/* Right Side Tools */}
                <View className="flex-row items-center">
                    <TouchableOpacity className="px-2 py-1">
                        <Text className="text-gray-400 text-sm">%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-2 py-1">
                        <Text className="text-gray-400 text-sm">log</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-2 py-1">
                        <Text className="text-blue-600 text-sm">auto</Text>
                    </TouchableOpacity>
                </View>
            </View>


            <View className="bg-propfirmone-main flex-row items-center justify-center px-4 border-t border-gray-700">
                <TouchableOpacity className="flex-1 py-3 rounded-lg bg-propfirmone-300 border items-center justify-center bg-transparent border-green-500  m-4">
                    <Text className="text-white font-InterSemiBold">Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 py-3 rounded-lg bg-propfirmone-300 border items-center justify-center bg-transparent border-red-500  m-4">
                    <Text className="text-white font-InterSemiBold">Sell</Text>
                </TouchableOpacity>
            </View>


            {/* Dropdown Menu */}
            {showDropdown && (
                <View className="absolute top-15 left-4 bg-gray-800 rounded-lg py-2 z-50 min-w-32 border border-gray-600 shadow-lg">
                    {timeframes.map((item, index) => {
                        if (item.separator) {
                            return (
                                <View key={`separator-${index}`} className="h-px bg-gray-600 mx-2 my-1" />
                            );
                        }

                        if (!item.value) return null;
                        return (
                            <TouchableOpacity
                                key={item.value}
                                className="px-4 py-3 hover:bg-gray-700"
                                onPress={() => {
                                    setSelectedTimeframe(item.value);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text className="text-white text-sm">{item.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {showBottomDropdown && (
                <View className="absolute bottom-12 left-4 bg-gray-800 rounded-lg py-2 z-50 min-w-56 border border-gray-600 shadow-lg">
                    {periods.map((period) => (
                        <TouchableOpacity
                            key={period.value}
                            className="px-4 py-3 hover:bg-gray-700"
                            onPress={() => {
                                setSelectedPeriod(period.value);
                                setShowBottomDropdown(false);
                            }}
                        >
                            <Text className="text-white text-sm">{period.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

        </View>
    );
};

export default TradingChart;