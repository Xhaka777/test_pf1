import React from "react";
import { View, Text } from 'react-native';
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ProfitLossIndicatorProps {
    companyName?: string;
    totalValue?: number;
    percentageChange?: number;
    dailyPL?: number;
    iconComponent?: React.ReactNode;
    // Additional props for broker accounts
    startingBalance?: number;
    currency?: string;
    showLabels?: boolean;
}

const ProfitLossIndicator = ({
    companyName,
    totalValue = 0,
    percentageChange,
    dailyPL = 0,
    iconComponent,
    startingBalance,
    currency = 'USD',
    showLabels = true
}: ProfitLossIndicatorProps) => {
    
    // Calculate percentage change if not provided
    const calculatedPercentageChange = React.useMemo(() => {
        if (percentageChange !== undefined) {
            return percentageChange;
        }
        
        // If we have starting balance and daily P/L, calculate percentage
        if (startingBalance && startingBalance > 0) {
            return (dailyPL / startingBalance) * 100;
        }
        
        // If we have total value and daily P/L, calculate percentage
        if (totalValue && totalValue > 0) {
            return (dailyPL / totalValue) * 100;
        }
        
        return 0;
    }, [percentageChange, dailyPL, startingBalance, totalValue]);

    // Calculate position of the indicator (translate -10% to +10% to 0-100%)
    const indicatorPosition = Math.min(Math.max(((calculatedPercentageChange + 10) / 20) * 100, 0), 100);
    
    // Determine if we're in profit or loss
    const isProfit = calculatedPercentageChange >= 0;
    
    // Calculate overlay percentage (limit to reasonable range)
    const overlayPercentage = Math.min(Math.abs(calculatedPercentageChange) * 5, 50); // 10% max change = 50% max width

    // Format currency values
    const formatCurrency = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${currency} ${Math.abs(value).toLocaleString()}`;
    };

    // Format percentage
    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    return (
        <View className="mt-2">
            {/* Performance Summary */}
            {showLabels && (
                <View className="flex-row justify-between items-center mb-2">
                    <View>
                        <Text className="text-gray-400 text-xs font-Inter">Performance</Text>
                    </View>
                </View>
            )}

            {/* Progress Track */}
            <View className="relative h-2 rounded-sm overflow-hidden">
                {/* Base gradient background with opacity */}
                <View className="absolute inset-0 w-full h-full opacity-65">
                    <LinearGradient
                        colors={['#EF4444', '#EF4444', '#F59E0B', '#10B981', '#10B981']}
                        locations={[0, 0.3, 0.5, 0.7, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-full"
                    />
                </View>

                {/* Dynamic color overlay based on performance */}
                <View 
                    className="absolute top-0 bottom-0 h-full" 
                    style={{
                        left: '50%',
                        width: `${overlayPercentage}%`,
                        overflow: 'hidden',
                        transform: [
                            { translateX: isProfit ? 0 : -overlayPercentage }
                        ],
                    }}
                >
                    <LinearGradient
                        colors={isProfit ? ['#F59E0B', '#10B981'] : ['#EF4444', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </View>

                {/* Center indicator with dynamic positioning */}
                <View
                    className="absolute top-1/2 w-2 h-6 bg-white rounded-sm z-10"
                    style={{
                        left: `${indicatorPosition}%`,
                        transform: [
                            { translateX: -4 },
                            { translateY: -12 }
                        ],
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                        elevation: 3,
                    }}
                />
            </View>

            {/* Percentage scale labels */}
            <View className="flex-row justify-between mt-1">
                <Text className="text-xs text-gray-500 font-Inter">-10%</Text>
                <Text className="text-xs text-gray-500 font-Inter">0%</Text>
                <Text className="text-xs text-gray-500 font-Inter">+10%</Text>
            </View>

            {/* Additional info for extreme values */}
            {Math.abs(calculatedPercentageChange) > 10 && (
                <View className="mt-1 items-center">
                    <Text 
                        className="text-xs font-Inter"
                        style={{ color: isProfit ? '#10B981' : '#EF4444' }}
                    >
                        {Math.abs(calculatedPercentageChange) > 10 ? 
                            `Extreme ${isProfit ? 'Gain' : 'Loss'}: ${formatPercentage(calculatedPercentageChange)}` : 
                            ''
                        }
                    </Text>
                </View>
            )}
        </View>
    );
}

export default ProfitLossIndicator;