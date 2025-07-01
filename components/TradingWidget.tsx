import { useActiveSymbol } from '@/hooks/use-active-symbol';
import { useCurrencySymbol } from '@/providers/currency-symbols';
import React, { useMemo } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { TradingPrices } from './TradingPrices';
import { useTranslation } from 'react-i18next';
// import { ChevronDown } from 'react-native-feather' // or your preferred icon library

//Skeleton component for loading states
const Skeleton = ({ width = 80, height = 20 }: { width?: number; height?: number }) => (
    <View
        style={{
            width,
            height,
            backgroundColor: '#E5E7EB',
            borderRadius: 4
        }}
    />
)

//Separator component
const Separator = () => (
    <View
        style={{
            width: 1,
            height: 40,
            backgroundColor: '#E5E7EB',
            marginHorizontal: 8
        }}
    />
)

export function TradingWidget() {
    const { t } = useTranslation();
    const [activeSymbol] = useActiveSymbol();
    const { findCurrencyPairBySymbol } = useCurrencySymbol();

    const symbolData = useMemo(() => {
        const symbol = activeSymbol ? findCurrencyPairBySymbol(activeSymbol) : null;
        return {
            marketPrice: symbol?.marketPrice ?? 0,
            ask: symbol?.ask ?? 0,
            bid: symbol?.bid ?? 0
        }
    }, [activeSymbol, findCurrencyPairBySymbol])

    return (
        <View style={styles.container}>
            <View style={styles.tradingPricesContainer}>
                <TradingPrices />
            </View>

            <Separator />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.dataSection}>
                    <Text style={styles.labelText}>
                        {t('Market Price')}
                    </Text>
                    <View style={styles.valueContainer}>
                        {symbolData.marketPrice ? (
                            <Text style={styles.marketPriceText}>
                                {symbolData.marketPrice.toLocaleString('en-US', {
                                    maximumFractionDigits: symbolData.marketPrice.toString().length
                                })}
                            </Text>
                        ) : (
                            <Skeleton width={80} height={24} />
                        )}
                    </View>
                </View>

                <View style={styles.dataSection}>
                    <Text style={styles.labelText}>
                        {t('Ask')}
                    </Text>
                    <View style={styles.valueContainer}>
                        {symbolData.ask ? (
                            <Text style={styles.askText}>
                                {symbolData.ask.toLocaleString('en-US', {
                                    maximumFractionDigits: symbolData.ask.toString().length
                                })}
                            </Text>
                        ) : (
                            <Skeleton width={80} height={20} />
                        )}
                    </View>
                </View>

            </ScrollView>
        </View>
    )
}

const styles = {
    container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    tradingPricesContainer: {
        // No specific styling needed, just a container
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 16,
        paddingHorizontal: 8,
    },
    dataSection: {
        minWidth: 75,
        flex: 1,
    },
    labelText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    valueContainer: {
        minHeight: 24,
        justifyContent: 'center' as const,
    },
    marketPriceText: {
        fontWeight: '600' as const,
        fontSize: 16,
        color: '#000',
    },
    bidText: {
        fontSize: 14,
        color: '#10B981', // green color
    },
    askText: {
        fontSize: 14,
        color: '#EF4444', // red color
    },
} as const;