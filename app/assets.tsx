
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StatusBar, SafeAreaView } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from '@react-navigation/stack';
import images from '@/constants/images';
import SearchInput from '@/components/SearchInput';

// Define your navigation param list type
type RootStackParamList = {
    '(tabs)': undefined;
    'assets': undefined;
    'menu': undefined;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Mock data matching the image
const mockAssetData = [
    {
        id: '1',
        symbol: 'AUDUSD',
        baseCurrencyFlag: images.usa_png, // Australia flag
        quoteCurrencyFlag: images.usa_png, // US flag
        marketPrice: '0.6727',
        spread: '-0.67%',
    },
    {
        id: '2',
        symbol: 'EURUSD',
        baseCurrencyFlag: images.usa_png, // EU flag
        quoteCurrencyFlag: images.usa_png, // US flag
        marketPrice: '1.0812',
        spread: '1.08%',
        isSelected: true, // This row is highlighted in the image
    },
    {
        id: '3',
        symbol: 'GBPUSD',
        baseCurrencyFlag: images.usa_png, // UK flag
        quoteCurrencyFlag: images.usa_png, // US flag
        marketPrice: '1.2760',
        spread: '1.27%',
    },
    {
        id: '4',
        symbol: 'NZDUSD',
        baseCurrencyFlag: images.usa_png, // New Zealand flag
        quoteCurrencyFlag: images.usa_png, // US flag
        marketPrice: '0.6117',
        spread: '-0.61%',
    },
    {
        id: '5',
        symbol: 'USDCAD',
        baseCurrencyFlag: images.usa_png, // US flag
        quoteCurrencyFlag: images.usa_png, // Canada flag
        marketPrice: '1.3611',
        spread: '1.36%',
    },
    {
        id: '6',
        symbol: 'EURCHF',
        baseCurrencyFlag: images.usa_png, // EU flag
        quoteCurrencyFlag: images.usa_png, // Switzerland flag
        marketPrice: '0.9731',
        spread: '0.97%',
    },
    {
        id: '7',
        symbol: 'EURJPY',
        baseCurrencyFlag: images.usa_png, // EU flag
        quoteCurrencyFlag: images.usa_png, // Japan flag
        marketPrice: '1.3521',
        spread: '14.35%',
    },
];

const AssetsScreen = ({ route }) => {
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAssets, setFilteredAssets] = useState(mockAssetData);

    // Handle search functionality
    const handleSearch = (query: any) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredAssets(mockAssetData);
        } else {
            const filtered = mockAssetData.filter(asset =>
                asset.symbol.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredAssets(filtered);
        }
    };

    // Handle asset selection
    const handleAssetSelect = (asset: any) => {
        // Navigate back to tabs and pass the selected asset
        navigation.navigate('(tabs)', { selectedAsset: asset });
    };

    // Handle close button
    const handleClose = () => {
        navigation.navigate('(tabs)');
    };

    // Get color for spread value
    const getSpreadColor = (spreadValue) => {
        if (spreadValue.startsWith('-')) {
            return 'text-red-400';
        } else if (spreadValue.startsWith('+')) {
            return 'text-teal-400';
        }
        return 'text-teal-400'; // Default to teal for positive values
    };

    // Get color for market price (from the image, positive spreads seem to have teal prices)
    const getMarketPriceColor = (spread: any) => {
        if (spread.startsWith('-')) {
            return 'text-red-400';
        }
        return 'text-teal-400';
    };

    const renderAssetItem = ({ item }) => (
        <TouchableOpacity
            className={`flex-row items-center justify-between px-4 py-4 ${item.isSelected ? 'bg-gray-700' : 'bg-transparent'
                }`}
            onPress={() => handleAssetSelect(item)}
            activeOpacity={0.7}
        >
            {/* Left Section - Flags and Symbol */}
            <View className="flex-row items-center flex-1">
                <View className="flex-row items-center mr-4">
                    {item.baseCurrencyFlag && (
                        <Image
                            source={item.baseCurrencyFlag}
                            className="w-6 h-6 rounded-full"
                        />
                    )}
                    {item.quoteCurrencyFlag && (
                        <Image
                            source={item.quoteCurrencyFlag}
                            className="w-6 h-6 rounded-full -ml-2"
                        />
                    )}
                </View>
                <Text className="text-white text-base font-InterSemiBold">
                    {item.symbol}
                </Text>
            </View>

            {/* Market Price */}
            <View className="flex-1 items-center">
                <Text className={`text-base font-Inter ${getMarketPriceColor(item.spread)}`}>
                    {item.marketPrice}
                </Text>
            </View>

            {/* Spreads */}
            <View className="flex-1 items-end">
                <Text className={`text-base font-Inter ${getSpreadColor(item.spread)}`}>
                    {item.spread}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-propfirmone-main">

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 mt-10 py-4 ">
                <Text className="text-white text-xl font-InterSemiBold">Assets</Text>
                <TouchableOpacity onPress={handleClose} className="p-1">
                    <X width={24} height={24} color="white" />
                </TouchableOpacity>
            </View>

            <SearchInput onSearch={handleSearch} />

            {/* Column Headers */}
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-700">
                <View className="flex-1">
                    <Text className="text-gray-400 text-sm font-Inter">Instruments</Text>
                </View>
                <View className="flex-1 items-center">
                    <Text className="text-gray-400 text-sm font-Inter">Market Price</Text>
                </View>
                <View className="flex-1 items-end">
                    <Text className="text-gray-400 text-sm font-Inter">Spreads</Text>
                </View>
            </View>             

            {/* Assets List */}
            <FlatList
                data={filteredAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />      
        </SafeAreaView>
    );
};


export default AssetsScreen;