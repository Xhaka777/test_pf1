import React from "react";
import { View, Text } from 'react-native';
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

    // Clamp percentage to reasonable range for display (-10% to +10%)
    const clampedPercentage = Math.min(Math.max(calculatedPercentageChange, -10), 10);
    
    // Calculate indicator position (0% to 100% across the bar)
    const indicatorPosition = ((clampedPercentage + 10) / 20) * 100;
    
    // Determine if we're in profit or loss
    const isProfit = calculatedPercentageChange >= 0;

    return (
        <View style={{ marginTop: 8 }}>
            {/* Performance Summary */}
            {showLabels && (
                <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 8 
                }}>
                    <Text style={{ 
                        color: '#9CA3AF', 
                        fontSize: 12, 
                        fontWeight: '400' 
                    }}>
                        Performance
                    </Text>
                </View>
            )}

            {/* Progress Track Container */}
            <View style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                {/* Background Gradient */}
                <LinearGradient
                    colors={['#EF4444', '#F59E0B', '#10B981']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        opacity: 0.6
                    }}
                />

                {/* Indicator - White dot */}
                <View
                    style={{
                        position: 'absolute',
                        top: -4,
                        left: `${indicatorPosition}%`,
                        width: 16,
                        height: 16,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 8,
                        transform: [{ translateX: -8 }],
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                />
            </View>

            {/* Percentage scale labels */}
            <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginTop: 4 
            }}>
                <Text style={{ 
                    fontSize: 10, 
                    color: '#6B7280', 
                    fontWeight: '400' 
                }}>
                    -10%
                </Text>
                <Text style={{ 
                    fontSize: 10, 
                    color: '#6B7280', 
                    fontWeight: '400' 
                }}>
                    0%
                </Text>
                <Text style={{ 
                    fontSize: 10, 
                    color: '#6B7280', 
                    fontWeight: '400' 
                }}>
                    +10%
                </Text>
            </View>
        </View>
    );
}

export default ProfitLossIndicator;