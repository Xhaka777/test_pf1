import React, { useRef, useState, useCallback, useMemo, RefObject } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Image,
    ActivityIndicator
} from 'react-native'
import { getCurrencyFlags, getFlagUrl } from "@/api/utils/currency-trade";
import { useTranslation } from 'react-i18next';
import { useCurrencySymbol } from "@/providers/currency-symbols";
import { useActiveSymbol } from "@/hooks/use-active-symbol";
import { useFavorites } from "@/hooks/use-favorites";
import { ChevronDown, Search } from "lucide-react-native";

const ChevronDownIcon = () => (
    // <Text style={{ fontSize: 16, color: '#6B7280'}}
    <ChevronDown size={16} color='#6B7280' />
)

const SearchIcon = () => (
    <Search size={16} color='#6B7280' />
)

const StarIcon = ({ filled = false, onPress }: { filled?: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={{ padding: 4 }}>
        <Text style={{ fontSize: 16, color: filled ? '#FFD700' : '#6B7280' }}>
            {filled ? '★' : '☆'}
        </Text>
    </TouchableOpacity>
)

const Skeleton = () => (
    <View style={{ height: 20, backgroundColor: '#E5E7EB', borderRadius: 4 }} />
)


export function TradingPrices() {
    const { t } = useTranslation();
    const [activeSymbol, setActiveSymbol] = useActiveSymbol();
    const { currencySymbols, findCurrencyPairBySymbol } = useCurrencySymbol();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
    const searchInputRef = useRef<TextInput>(null);

    const { favoriteSymbols, toggleFavorite: toggleFavoriteApi } = useFavorites();

    const handleToggleFavorite = useCallback((symbol: string) => {
        toggleFavoriteApi(symbol);
    }, [toggleFavoriteApi])

    const filteredCurrencySymbols = useMemo(() => {
        return currencySymbols
            .filter((currency) => {
                if (activeTab === 'favorites' && !favoriteSymbols.includes(currency.symbol)) {
                    return false;
                }

                if (!searchQuery) {
                    return true;
                }

                return (
                    currency.symbol === searchQuery ||
                    currency.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })
            .map((currency, index) => {
                const { from, to } = getCurrencyFlags(currency.symbol);
                const isStarred = favoriteSymbols.includes(currency.symbol);

                return (
                    <TouchableOpacity
                        key={currency.symbol}
                        style={styles.currencyItem}
                        onPress={() => {
                            setActiveSymbol(currency.symbol)
                            setOpen(false);
                        }}
                    >
                        <View style={styles.currencyContent}>
                            <View style={styles.starContainer}>
                                <StarIcon
                                    filled={isStarred}
                                    onPress={() => handleToggleFavorite(currency.symbol)} />
                            </View>
                            <View style={styles.currencyInfo}>
                                <View style={styles.flagContainer}>
                                    <Image
                                        source={{ uri: getFlagUrl(from) }}
                                        style={[styles.flag, { marginRight: -8 }]}
                                    />
                                    <Image
                                        source={{ uri: getFlagUrl(to) }}
                                        style={styles.flag}
                                    />
                                </View>
                                <Text style={styles.symbolText} numberOfLines={1}>
                                    {currency.symbol}
                                </Text>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceText}>
                                    {currency.marketPrice.toLocaleString('en-US', {
                                        maximumFractionDigits: currency.marketPrice.toString().length
                                    })}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )
            })
    }, [
        currencySymbols,
        activeTab,
        favoriteSymbols,
        searchQuery,
        handleToggleFavorite,
        setActiveSymbol
    ])


    const selectedSymbolData = useMemo(() => {
        if (!activeSymbol) {
            return <Skeleton />
        }

        const currency = findCurrencyPairBySymbol(activeSymbol);
        if (!currency) {
            return <Skeleton />
        }

        const { from, to } = getCurrencyFlags(currency.symbol)
        return (
            <View style={styles.selectedSymbol}>
                <View style={styles.selectedSymbolInfo}>
                    <View style={styles.flagContainer}>
                        <Image source={{ uri: getFlagUrl(from) }} style={[styles.flag, { marginRight: -8 }]} />
                        <Image source={{ uri: getFlagUrl(to) }} style={styles.flag} />
                    </View>
                    <Text style={styles.selectedSymbolText} numberOfLines={1}>
                        {currency.symbol}
                    </Text>
                </View>
            </View>
        )

    }, [activeSymbol, findCurrencyPairBySymbol])

    const tabs = [
        { id: 'all', label: t('All Assets') },
        { id: 'favorites', label: t('Favorites') }
    ]

    const modalContent = (
        <>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <SearchIcon />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('Search')}
                        placeholderTextColor='#6B7280'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            {/*TODO remove text with lucid icon */}
                            <Text style={styles.clearButton}>x</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.tabsContainer}>
                <View style={styles.tabsList}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tabTrigger,
                                activeTab === tab.id && styles.activeTab
                            ]}
                            onPress={() => setActiveTab(tab.id as 'all' | 'favorites')}
                        >
                            <View style={styles.tabContent}>
                                {tab.id === 'favorites' && (
                                    <StarIcon filled />
                                )}
                                <Text style={[
                                    styles.tabText,
                                    activeTab === tab.id && styles.activeTabText
                                ]}>
                                    {tab.label}
                                </Text>
                                <Text style={styles.tabCount}>
                                    ({tab.id === 'favorites' ? favoriteSymbols.length : currencySymbols.length})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.headerRow}>
                <View style={styles.headerStar} />
                <Text style={styles.headerText}>{t('Intruments')}</Text>
                <Text style={[styles.headerText, styles.headerCenter]}>{t('Market Price')}</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {filteredCurrencySymbols.length > 0 ? (
                    filteredCurrencySymbols
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            {activeTab === 'favorites'
                                ? t('No favorite assets yet. Star some assets to add them here.')
                                : t('No assets found matching your search.')
                            }
                        </Text>
                    </View>
                )}
            </ScrollView>
        </>
    )

    return (
        <>
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => {
                    setOpen(true);
                    setTimeout(() => {
                        searchInputRef.current?.focus();
                    }, 100);
                }}
            >
                {selectedSymbolData}
                <ChevronDownIcon />
            </TouchableOpacity>

            <Modal
                visible={open}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setOpen(false);
                    setSearchQuery('')
                }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('Assets')}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setOpen(false)
                                setSearchQuery('')
                            }}
                        >
                            <Text style={styles.closeButtonText}>x</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalContainer}>
                        {modalContent}
                    </View>
                </View>
            </Modal>
        </>
    )

}

const styles = {
    trigger: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        padding: 8,
    },
    selectedSymbol: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        width: '100%',
        minWidth: 'fit-content' as const,
    },
    selectedSymbolInfo: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        overflow: 'hidden' as const,
    },
    selectedSymbolText: {
        fontWeight: '600' as const,
        fontSize: 16,
        color: '#000',
        maxWidth: '25%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: '#000',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#6B7280',
    },
    modalContent: {
        flex: 1,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    searchInputContainer: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#000',
    },
    clearButton: {
        fontSize: 16,
        color: '#6B7280',
        padding: 4,
    },
    tabsContainer: {
        paddingHorizontal: 16,
    },
    tabsList: {
        flexDirection: 'row' as const,
        marginBottom: 16,
        gap: 8,
    },
    tabTrigger: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#F3F4F6',
    },
    activeTab: {
        backgroundColor: '#E5E7EB',
    },
    tabContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
    },
    tabText: {
        fontSize: 14,
        color: '#6B7280',
    },
    activeTabText: {
        color: '#000',
    },
    tabCount: {
        fontSize: 14,
        color: '#3B82F6',
    },
    headerRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    headerStar: {
        width: 30,
    },
    headerText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
    },
    headerCenter: {
        textAlign: 'center' as const,
    },
    scrollView: {
        flex: 1,
    },
    currencyItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    currencyContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
    },
    starContainer: {
        width: 30,
        alignItems: 'center' as const,
    },
    currencyInfo: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        overflow: 'hidden' as const,
    },
    flagContainer: {
        flexDirection: 'row' as const,
        width: 44,
    },
    flag: {
        width: 22,
        height: 16,
    },
    symbolText: {
        fontWeight: '600' as const,
        fontSize: 14,
        color: '#000',
    },
    priceContainer: {
        flex: 1,
        alignItems: 'center' as const,
    },
    priceText: {
        fontWeight: '600' as const,
        fontSize: 14,
        color: '#EF4444', // red color for negative
    },
    emptyState: {
        paddingVertical: 32,
        alignItems: 'center' as const,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center' as const,
    },
};