import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
    ListRenderItem
} from 'react-native'
import { getCurrencyFlags, CurrencyCodeEnum } from "@/api/utils/currency-trade";
import { useTranslation } from 'react-i18next';
import { useCurrencySymbol } from "@/providers/currency-symbols";
import { useActiveSymbol } from "@/hooks/use-active-symbol";
import { useFavorites } from "@/hooks/use-favorites";
import { ChevronDown, Search, X, Star } from "lucide-react-native";
import { TradingPair } from "@/api/schema/trading-service";
import images from "@/constants/images";
import { categorizeProviderSymbol, getSymbolsForTab } from "@/utils/symbol-categorization";
import { symbol } from "d3";

const ChevronDownIcon = () => (
    <ChevronDown size={16} color='#4F494C' />
)

const SearchIcon = () => (
    <Search size={18} color='#4F494C' />
)

const ClearIcon = () => (
    <X size={16} color='#4F494C' />
)

const StarIcon = ({ filled = false, onPress }: { filled?: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className="p-1"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={filled ? "Remove from favorites" : "Add to favorites"}
    >
        <Star
            size={16}
            color={filled ? '#FFD700' : '#4F494C'}
            fill={filled ? '#FFD700' : 'transparent'}
        />
    </TouchableOpacity>
)

const Skeleton = () => (
    <View className="h-5 bg-gray-200 rounded" />
)

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

// Memoized FlatList item component for better performance
const CurrencyListItem = React.memo(({
    item,
    favoriteSymbols,
    onToggleFavorite,
    onSelectSymbol
}: {
    item: TradingPair;
    favoriteSymbols: string[];
    onToggleFavorite: (symbol: string) => void;
    onSelectSymbol: (symbol: string) => void;
}) => {
    const { from, to } = getCurrencyFlags(item.symbol);
    const fromFlagImage = getCurrencyFlagImage(from);
    const toFlagImage = getCurrencyFlagImage(to);
    const isStarred = favoriteSymbols.includes(item.symbol);

    return (
        <TouchableOpacity
            className="px-4 py-2"
            onPress={() => onSelectSymbol(item.symbol)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.symbol}, current price ${item.marketPrice}, spread ${item.ask && item.bid ? (item.ask - item.bid).toFixed(2) : 'unknown'}`}>
            <View className="flex-row items-center gap-2">
                <View className="w-8 items-center">
                    <StarIcon
                        filled={isStarred}
                        onPress={() => onToggleFavorite(item.symbol)}
                    />
                </View>
                <View className="flex-1 flex-row items-center gap-2 overflow-hidden">
                    <View className="relative w-[24px] h-[24px]">
                        <Image
                            source={fromFlagImage}
                            style={{ width: 24, height: 24 }}
                            className="absolute top-0 left-0"
                        />
                        <Image
                            source={toFlagImage}
                            style={{ width: 12, height: 12 }}
                            className="absolute bottom-0 right-0"
                        />
                    </View>
                    <Text className="font-Inter text-sm text-white" numberOfLines={1}>
                        {item.symbol}
                    </Text>
                </View>
                <View className="flex-row items-center gap-4">
                    <View className="items-end min-w-[80px]">
                        <Text className="font-semibold text-sm text-white">
                            {item.marketPrice.toLocaleString('en-US', {
                                maximumFractionDigits: Math.min(
                                    item.marketPrice.toString().split('.')[1]?.length || 0,
                                    8
                                )
                            })}
                        </Text>
                    </View>
                    <View className="items-end min-w-[60px]">
                        <Text className="font-Inter text-sm text-white">
                            {(() => {
                                if (item.ask && item.bid) {
                                    const spread = item.ask - item.bid;
                                    return spread.toFixed(2) + '%';
                                }
                                return '-';
                            })()}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export function TradingPrices() {
    const { t } = useTranslation();
    const [activeSymbol, setActiveSymbol] = useActiveSymbol();
    const {
        coreSymbols,
        allSymbols,
        findCurrencyPairBySymbol,
        loadAllSymbols,
        isLoadingAll
    } = useCurrencySymbol();

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'forex' | 'stocks' | 'favorites'>('forex');
    const searchInputRef = useRef<TextInput>(null);
    const flatListRef = useRef<FlatList>(null);

    const { favoriteSymbols, toggleFavorite: toggleFavoriteApi } = useFavorites();

    // Load all symbols when modal opens (lazy loading)
    useEffect(() => {
        if (open && allSymbols.length === 0) {
            console.log('Loading all symbols for TradingPrices modal...');
            loadAllSymbols();
        }
    }, [open, allSymbols.length, loadAllSymbols]);

    const handleToggleFavorite = useCallback((symbol: string) => {
        try {
            toggleFavoriteApi(symbol);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, [toggleFavoriteApi]);

    const handleSelectSymbol = useCallback((symbol: string) => {
        setActiveSymbol(symbol);
        setOpen(false);
        setSearchQuery('');
    }, [setActiveSymbol]);

    const handleModalOpen = useCallback(() => {
        setOpen(true);
        // Removed auto-focus - user needs to manually tap search input
    }, []);

    const handleModalClose = useCallback(() => {
        setOpen(false);
        setSearchQuery('');
    }, []);

    // Use appropriate symbol set based on modal state
    const currentSymbols = useMemo(() => {
        return open ? allSymbols : coreSymbols;
    }, [open, allSymbols, coreSymbols]);

    const symbolCounts = useMemo(() => {
        const forexSymbols = getSymbolsForTab(currentSymbols, 'forex');
        const stocksSymbols = getSymbolsForTab(currentSymbols, 'stocks');

        const additionalForextSymbols = currentSymbols.filter(symbol => {
            const category = categorizeProviderSymbol(symbol.symbol);
            return category === 'forex' && !forexSymbols.some(s => s.symbol === symbol.symbol);
        });

        const additionalStocksSymbols = currentSymbols.filter(symbol => {
            const category = categorizeProviderSymbol(symbol.symbol);
            return (category === 'indices' || category === 'metals' || category === 'commodities') &&
                !stocksSymbols.some(s => s.symbol === symbol.symbol);
        });

        return {
            forex: forexSymbols.length + additionalForextSymbols.length,
            stocks: stocksSymbols.length + additionalStocksSymbols.length,
            favorites: favoriteSymbols.length
        };
    }, [currentSymbols, favoriteSymbols.length]);

    const filteredSymbols = useMemo(() => {
        let symbolsToFilter: TradingPair[] = [];

        if (activeTab === 'favorites') {
            symbolsToFilter = currentSymbols.filter(currency =>
                favoriteSymbols.includes(currency.symbol)
            );
        } else if (activeTab === 'forex') {
            // Get predefined forex symbols
            const predefinedForex = getSymbolsForTab(currentSymbols, 'forex');

            // Get additional forex symbols from provider categorization
            const additionalForex = currentSymbols.filter(symbol => {
                const category = categorizeProviderSymbol(symbol.symbol);
                return category === 'forex' && !predefinedForex.some(s => s.symbol === symbol.symbol);
            });

            symbolsToFilter = [...predefinedForex, ...additionalForex];
        } else if (activeTab === 'stocks') {
            // Get predefined stocks symbols (indices, metals, commodities)
            const predefinedStocks = getSymbolsForTab(currentSymbols, 'stocks');

            // Get additional stocks symbols from provider categorization
            const additionalStocks = currentSymbols.filter(symbol => {
                const category = categorizeProviderSymbol(symbol.symbol);
                return (category === 'indices' || category === 'metals' || category === 'commodities') &&
                    !predefinedStocks.some(s => s.symbol === symbol.symbol);
            });

            symbolsToFilter = [...predefinedStocks, ...additionalStocks];
        }

        // Apply search filter
        if (searchQuery) {
            symbolsToFilter = symbolsToFilter.filter(currency =>
                currency.symbol === searchQuery ||
                currency.symbol.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort alphabetically for all tabs
        return symbolsToFilter.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }, [
        currentSymbols,
        activeTab,
        favoriteSymbols,
        searchQuery
    ]);

    const selectedSymbolData = useMemo(() => {
        if (!activeSymbol) {
            return <Skeleton />
        }

        const currency = findCurrencyPairBySymbol(activeSymbol);
        if (!currency) {
            return <Skeleton />
        }

        const { from, to } = getCurrencyFlags(currency.symbol);
        const fromFlagImage = getCurrencyFlagImage(from);
        const toFlagImage = getCurrencyFlagImage(to);

        return (
            <View className="flex-row items-center justify-between min-w-fit">
                <View className="flex-row items-center gap-2 overflow-hidden">
                    <View className="relative w-[24px] h-[24px]">
                        <Image
                            source={fromFlagImage}
                            style={{ width: 24, height: 24 }}
                            className="absolute top-0 left-0"
                        />
                        <Image
                            source={toFlagImage}
                            style={{ width: 12, height: 12 }}
                            className="absolute bottom-0 right-0"
                        />
                    </View>
                    <Text className="font-Inter text-base text-white max-w-[25vw]" numberOfLines={1}>
                        {currency.symbol}
                    </Text>
                </View>
            </View>
        )
    }, [activeSymbol, findCurrencyPairBySymbol])

    const tabs = useMemo(() => [
        {
            id: 'forex',
            label: t('Forex'),
            count: symbolCounts.forex
        },
        {
            id: 'stocks',
            label: t('Stocks'),
            count: symbolCounts.stocks
        },
        {
            id: 'favorites',
            label: t('Favorites'),
            count: symbolCounts.favorites
        }
    ], [t, symbolCounts]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // FlatList render item function
    const renderItem: ListRenderItem<TradingPair> = useCallback(({ item }) => (
        <CurrencyListItem
            item={item}
            favoriteSymbols={favoriteSymbols}
            onToggleFavorite={handleToggleFavorite}
            onSelectSymbol={handleSelectSymbol}
        />
    ), [favoriteSymbols, handleToggleFavorite, handleSelectSymbol]);

    // FlatList key extractor
    const keyExtractor = useCallback((item: TradingPair) => item.symbol, []);

    // Empty component for FlatList
    const renderEmptyComponent = useCallback(() => (
        <View className="py-8 items-center">
            <Text className="text-sm font-Inter text-gray-500 text-center">
                {activeTab === 'favorites'
                    ? t('No favorite assets yet. Star some assets to add them here.')
                    : t('No assets found matching your search.')
                }
            </Text>
        </View>
    ), [activeTab, t]);

    // Loading component for FlatList
    const renderLoadingComponent = useCallback(() => (
        <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 font-Inter mt-2">{t('Loading all symbols...')}</Text>
        </View>
    ), [t]);

    // FlatList header component
    const renderListHeader = useCallback(() => (
        <View className="flex-row items-center px-4 py-2 gap-2">
            <View className="w-8" />
            <Text className="flex-1 text-sm font-Inter text-gray-500">{t('Instruments')}</Text>
            <View className="flex-row items-center gap-4">
                <Text className="text-sm text-gray-500 min-w-[80px] text-right font-Inter">{t('Market Price')}</Text>
                <Text className="text-sm text-gray-500 min-w-[60px] text-right font-Inter">{t('Spread')}</Text>
            </View>
        </View>
    ), [t]);

    const modalContent = (
        <>
            {/* Search Container */}
            <View className="p-4 bg-propfirmone-main">
                <View className="flex-row items-center bg-[#252223] border border-[#2F2C2D] rounded-lg px-3">
                    <SearchIcon />
                    <TextInput
                        ref={searchInputRef}
                        className="flex-1 ml-2 text-lg font-Inter"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('Search')}
                        placeholderTextColor='#898587'
                        accessible={true}
                        accessibilityLabel="Search currency pairs"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={clearSearch}
                            className="p-1"
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search"
                        >
                            <ClearIcon />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Tabs Container */}
            <View className="px-2">
                <View className="flex-row mb-1">
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            className="px-3 py-3"
                            onPress={() => setActiveTab(tab.id as 'forex' | 'stocks' | 'favorites')}
                            accessible={true}
                            accessibilityRole="tab"
                            accessibilityLabel={`${tab.label} tab`}
                            accessibilityState={{ selected: activeTab === tab.id }}
                        >
                            <View className="flex-row items-center gap-1">
                                {tab.id === 'favorites' && (
                                    <Star size={12} color='#FFD700' fill='#FFD700' />
                                )}
                                <Text className={`text-base font-Inter ${activeTab === tab.id ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {tab.label}
                                </Text>
                                <Text className={`text-base font-Inter ${activeTab === tab.id ? 'text-pink-400' : 'text-gray-500'
                                    }`}>
                                    ({tab.count})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="relative mb-4 mx-3">
                    {/* Gray background line */}
                    <View className="h-0.5 bg-[#2F2C2D] w-full" />

                    {/* Pink active indicator line */}
                    <View
                        className="absolute top-0 h-0.5 bg-pink-400 transition-all duration-300 ease-in-out"
                        style={{
                            width: `${70 / tabs.length}%`,
                            // width: `${100 / tabs.length}%`,
                            left: `${(tabs.findIndex(tab => tab.id === activeTab) * 75) / tabs.length}%`
                        }}

                    />
                </View>
            </View>

            {/* FlatList with Header and Loading States */}
            <View className="flex-1">
                {isLoadingAll && allSymbols.length === 0 ? (
                    renderLoadingComponent()
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredSymbols}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        ListHeaderComponent={renderListHeader}
                        ListEmptyComponent={renderEmptyComponent}

                        // Performance optimizations
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={15}
                        windowSize={8}
                        initialNumToRender={12}
                        updateCellsBatchingPeriod={50}
                        getItemLayout={(data, index) => ({
                            length: 48, // Approximate height of each item
                            offset: 48 * index,
                            index,
                        })}

                        // Style and behavior
                        className="flex-1"
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1 }}

                        // Scroll to top when data changes
                        onContentSizeChange={() => {
                            if (searchQuery || activeTab === 'favorites') {
                                flatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
                            }
                        }}

                        // Enhanced performance for live data
                        extraData={`${favoriteSymbols.join(',')}-${Date.now()}`}
                    />
                )}
            </View>
        </>
    )

    return (
        <>
            <TouchableOpacity
                className="flex-row items-center gap-2 p-2"
                onPress={handleModalOpen}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Open currency selector"
            >
                {selectedSymbolData}
                <ChevronDownIcon />
            </TouchableOpacity>

            <Modal
                visible={open}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleModalClose}
            >
                <View className="flex-1 bg-propfirmone-main">
                    {/* Modal Header */}
                    <View className="flex-row justify-between items-center p-5">
                        <Text className="text-lg font-Inter text-white">{t('Assets')}</Text>
                        <TouchableOpacity
                            className="p-2"
                            onPress={handleModalClose}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Close modal"
                        >
                            <ClearIcon />
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content */}
                    <View className="flex-1">
                        {modalContent}
                    </View>
                </View>
            </Modal>
        </>
    )
}