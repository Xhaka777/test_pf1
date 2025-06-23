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

// type RootStackParamList = {
//     '(tabs)': undefined;
//     'assets': undefined;
//     'menu': undefined;
// }

// type NavigationProp = StackNavigationProp<RootStackParamList>;

// interface TradingWidgetProp {
//     baseCurrencyFlag: any;
//     quoteCurrencyFlag: any;
//     symbol: string;
//     markPrice: string;
//     bid: string;
//     ask: string;
//     spread: string;
//     onPress?: () => void;
//     showDropdown: boolean;
// }

// const TradingWidget = ({
//     baseCurrencyFlag,
//     quoteCurrencyFlag,
//     symbol = 'EURUSD',
//     markPrice = '1.06921',
//     bid = '1.06727',
//     ask = '1.06939',
//     spread = '-0.67%',
//     onPress,
//     showDropdown = true,
// }: TradingWidgetProp) => {

//     const navigation = useNavigation<NavigationProp>();

//     const [selectedAsset, setSelectedAsset] = useState({
//         baseCurrencyFlag,
//         quoteCurrencyFlag,
//         symbol,
//         markPrice,
//         bid,
//         ask,
//         spread
//     })

//     // Determine spread color based on positive/negative value
//     const getSpreadColor = (spreadValue: string) => {
//         if (spreadValue.startsWith('-')) {
//             return 'text-red-400';
//         } else if (spreadValue.startsWith('+')) {
//             return 'text-teal-400';
//         }
//         return 'text-white';
//     };

//     const handleOpenAssetsScreen = () => {
//         if (onPress) {
//             onPress();
//         } else {
//             navigation.navigate('assets')
//         }
//     }


//     return (
//         <View className='rounded-md shadow-lg'>
//             <View className='flex-row items-center justify-between p-3'>
//                 {/* Left Section - Currency Pair with Chevron */}
//                 <TouchableOpacity
//                     className="flex-row items-center"
//                     onPress={handleOpenAssetsScreen}
//                     activeOpacity={0.8}
//                 >
//                     <View className="flex-row items-center">
//                         {selectedAsset.baseCurrencyFlag && (
//                             <Image
//                                 source={selectedAsset.baseCurrencyFlag}
//                                 style={{ width: 20, height: 20 }}
//                             />
//                         )}
//                         {selectedAsset.quoteCurrencyFlag && (
//                             <Image
//                                 source={selectedAsset.quoteCurrencyFlag}
//                                 style={{ width: 20, height: 20, marginLeft: -6 }}
//                             />
//                         )}
//                         <Text className='text-white font-InterSemiBold text-base ml-2 mr-1'>{selectedAsset.symbol}</Text>
//                         <ChevronDown width={16} height={16} color="white" />
//                     </View>
//                 </TouchableOpacity>

//                 {/* Vertical Divider */}
//                 <View className="w-px h-8 bg-gray-700 mx-2" />

//                 {/* Trading Data - All in one row */}
//                 <View className="flex-row items-center space-x-4">
//                     {/* Market Price */}
//                     <View className="flex-row items-center">
//                         <View className="mr-3">
//                             <Text className="text-gray-400 text-sm font-Inter">Mark Price</Text>
//                             <Text className="text-white text-sm font-Inter">{markPrice}</Text>
//                         </View>
//                         <View className="w-px h-8 bg-gray-700" />
//                     </View>

//                     {/* Bid */}
//                     <View className="flex-row items-center">
//                         <View className="mx-3">
//                             <Text className="text-gray-400 text-sm font-Inter">Bid</Text>
//                             <Text className="text-teal-400 text-sm font-Inter">{bid}</Text>
//                         </View>
//                         <View className="w-px h-8 bg-gray-700" />
//                     </View>

//                     {/* Ask */}
//                     <View className="flex-row items-center">
//                         <View className="mx-3">
//                             <Text className="text-gray-400 text-sm font-Inter">Ask</Text>
//                             <Text className="text-red-400 text-sm font-Inter">{ask}</Text>
//                         </View>
//                         <View className="w-px h-8 bg-gray-700" />
//                     </View>

//                     {/* Spreads */}
//                     <View className="ml-2 items-center">
//                         <Text className="text-gray-400 text-sm font-Inter">Spreads</Text>
//                         <Text className={`text-sm font-font-Inter ${getSpreadColor(spread)}`}>{spread}</Text>
//                     </View>
//                 </View>
//             </View>
//             <View className="h-px bg-gray-700" />
//         </View>
//     )
// }

// export default TradingWidget

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