import { useActiveSymbol } from '@/hooks/use-active-symbol';
import { useCurrencySymbol } from '@/providers/currency-symbols';
import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { TradingPrices } from './TradingPrices';
import { useTranslation } from 'react-i18next';
import { CurrencyCodeEnum, getCurrencyFlags } from '@/api/utils/currency-trade';
import images from '@/constants/images';
import { Image } from 'react-native';

//Skeleton component for loading states
const Skeleton = ({ width = 80, height = 20 }: { width?: number; height?: number }) => (
    <View className={`bg-gray-700`} style={{ width, height }} />
)

//Separator component
const Separator = () => (
    <View className='w-px h-10 bg-gray-700 mx-2' />
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

const PriceChangeIndicator = ({
    currentPrice,
    previousPrice }: {
        currentPrice: number;
        previousPrice: number | null;
    }) => {
    if (previousPrice === null || currentPrice === previousPrice) return null;

    const isUp = currentPrice > previousPrice;
    return (
        <View className={`w-2 h-2 rounded-full ml-1 ${isUp ? 'bg-green-500' : 'bg-red-500'}`} />
    )
}

const LivePrice = ({
    price,
    previousPrice,
    textStyle,
    isLoading = false
}: {
    price: number;
    previousPrice: number | null;
    textStyle?: string;
    isLoading?: boolean;
}) => {
    if (isLoading) {
        return <Skeleton width={80} height={20} />
    }

    return (
        <View className='flex-row items-center'>
            <Text className={textStyle}>
                {price.toLocaleString('en-US', {
                    maximumFractionDigits: price.toString().length
                })}
            </Text>
            <PriceChangeIndicator currentPrice={price} previousPrice={previousPrice} />
        </View>
    )
}

export function TradingWidget() {
    const { t } = useTranslation();
    const [activeSymbol, setActiveSymbol] = useActiveSymbol();
    const { coreSymbols, findCurrencyPairBySymbol, isLoadingCore } = useCurrencySymbol();

    const [previousPrice, setPreviousPrice] = useState<{
        marketPrice: number | null;
        bid: number | null;
        ask: number | null;
    }>({ marketPrice: null, bid: null, ask: null });

    // Set default symbol to BTCUSD only if we have core symbols loaded
    useEffect(() => {
        if (!activeSymbol && coreSymbols.length > 0 && !isLoadingCore) {
            // Check if BTCUSD exists in the core symbols first
            const btcSymbol = coreSymbols.find(symbol => symbol.symbol === 'BTCUSD');

            if (btcSymbol) {
                console.log('Setting default symbol to BTCUSD from core symbols');
                setActiveSymbol('BTCUSD');
            } else {
                // Fallback to first available core symbol
                console.log('BTCUSD not in core symbols, using first core symbol:', coreSymbols[0].symbol);
                setActiveSymbol(coreSymbols[0].symbol);
            }
        }
    }, [activeSymbol, coreSymbols, setActiveSymbol, isLoadingCore]);

    // Optimized symbol data lookup - only look for current active symbol
    const symbolData = useMemo(() => {
        if (!activeSymbol) {
            return {
                symbol: null,
                marketPrice: 0,
                ask: 0,
                bid: 0
            };
        }

        const symbol = findCurrencyPairBySymbol(activeSymbol);
        return {
            symbol: symbol,
            marketPrice: symbol?.marketPrice ?? 0,
            ask: symbol?.ask ?? 0,
            bid: symbol?.bid ?? 0
        }
    }, [activeSymbol, findCurrencyPairBySymbol]);

    // Update previous prices only when current symbol data changes
    useEffect(() => {
        if (symbolData.marketPrice || symbolData.bid || symbolData.ask) {
            setPreviousPrice(prev => ({
                marketPrice: symbolData.marketPrice !== prev.marketPrice ? prev.marketPrice : null,
                bid: symbolData.bid !== prev.bid ? prev.bid : null,
                ask: symbolData.ask !== prev.ask ? prev.ask : null,
            }))
        }
    }, [symbolData.marketPrice, symbolData.bid, symbolData.ask])

    const spread = useMemo(() => {
        if (symbolData.ask && symbolData.bid) {
            return symbolData.ask - symbolData.bid;
        }
        return 0;
    }, [symbolData.ask, symbolData.bid]);

    const spreadPercentage = useMemo(() => {
        if (spread && symbolData.marketPrice) {
            return ((spread / symbolData.marketPrice) * 100);
        }
        return 0;
    }, [spread, symbolData.marketPrice]);

    const flagData = useMemo(() => {
        if (!activeSymbol) return null;

        const { from, to } = getCurrencyFlags(activeSymbol);
        return {
            fromFlag: getCurrencyFlagImage(from),
            toFlag: getCurrencyFlagImage(to),
            from,
            to
        }
    }, [activeSymbol]);

    // Show loading state if core symbols are still loading
    if (isLoadingCore) {
        return (
            <View className='flex-row items-center p-2 border-b'>
                <Skeleton width={120} height={40} />
                <Separator />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className='flex-1'
                    contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 }}
                >
                    <Skeleton width={75} height={40} />
                    <Skeleton width={75} height={40} />
                    <Skeleton width={75} height={40} />
                </ScrollView>
            </View>
        );
    }

    return (
        <View className='flex-row items-center p-2 border-b'>
            <View className='flex-shrink-0'>
                <TradingPrices />
            </View>

            <Separator />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className='flex-1'
                contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 8 }}
            >
                <View className='min-w-[75px] flex-1 lg:flex-none'>
                    <Text className='text-gray-400 text-xs lg:text-sm mb-1'>
                        {t('Market Price')}
                    </Text>
                    <LivePrice
                        price={symbolData.marketPrice}
                        previousPrice={previousPrice.marketPrice}
                        textStyle='font-InterBold text-sm lg:text-base text-white'
                        isLoading={!symbolData.symbol}
                    />
                </View>

                <View className='min-w-[75px] flex-1 lg:flex-none'>
                    <Text className='text-gray-400 text-xs lg:text-sm mb-1'>
                        {t('Bid')}
                    </Text>
                    <LivePrice
                        price={symbolData.bid}
                        previousPrice={previousPrice.bid}
                        textStyle='text-sm lg:text-base text-green-500'
                        isLoading={!symbolData.symbol}
                    />
                </View>

                <View className='min-w-[75px] flex-1 lg:flex-none'>
                    <Text className='text-gray-400 text-xs lg:text-sm mb-1'>
                        {t('Ask')}
                    </Text>
                    <LivePrice
                        price={symbolData.ask}
                        previousPrice={previousPrice.ask}
                        textStyle='text-sm lg:text-base text-red-500'
                        isLoading={!symbolData.symbol}
                    />
                </View>
            </ScrollView>
        </View>
    )
}