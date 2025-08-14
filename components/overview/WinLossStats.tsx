import { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, Path, LinearGradient, Stop } from 'react-native-svg';

interface WinLossStatsProps {
  winPercentage: number;
  lossPercentage: number;
  winAmount: number;
  lossAmount: number;
  currency?: string;
  isLoading?: boolean;
}

export const WinLossStats = ({
  winPercentage,
  lossPercentage,
  winAmount,
  lossAmount,
  currency = 'USD',
  isLoading = false
}: WinLossStatsProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const barHeight = 10;
  const diagonalGap = 5;
  const diagonalOffset = 6;
  const radius = 5;
  // Add horizontal margins for the SVG bar
  const svgMargin = 16; // 10px on each side
  const effectiveWidth = containerWidth - (2 * svgMargin);

  const totalPercentage = winPercentage + lossPercentage;
  const winWidth = totalPercentage > 0 ? (winPercentage / totalPercentage) * (effectiveWidth - diagonalGap) : 0;
  const lossWidth = totalPercentage > 0 ? (lossPercentage / totalPercentage) * (effectiveWidth - diagonalGap) : 0;

  // Format currency amounts
  const formatAmount = (amount: number) => {
    if (isLoading) return '--';
    return `${currency} ${Math.abs(amount).toLocaleString()}`;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <View className="bg-propfirmone-300 rounded-lg px-5 py-3 mx-2">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-400 text-xs font-medium">Avg Win/Loss</Text>
          <Text className="text-xs font-semibold text-gray-400">Loading...</Text>
        </View>
        
        {/* Loading skeleton bar */}
        <View className="items-center mb-3 w-full">
          <View style={{ marginHorizontal: svgMargin }}>
            <View 
              style={{ 
                width: 200, 
                height: barHeight, 
                backgroundColor: '#374151', 
                borderRadius: radius 
              }} 
            />
          </View>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-gray-400 font-bold text-sm">--</Text>
          <Text className="text-gray-400 font-bold text-sm">--</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="bg-propfirmone-300 rounded-lg px-5 py-3 mx-2"
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      {/* Header with label and percentages */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-400 text-xs font-medium">Avg Win/Loss</Text>
        <Text className="text-xs font-semibold">
          <Text className="text-green-400">{winPercentage.toFixed(2)}%</Text>
          <Text className="text-gray-500"> / </Text>
          <Text className="text-red-500">{lossPercentage.toFixed(2)}%</Text>
        </Text>
      </View>

      {/* SVG Bar */}
      {containerWidth > 0 && effectiveWidth > 0 && totalPercentage > 0 && (
        <View className="items-center mb-3 w-full">
          <View style={{ marginHorizontal: svgMargin }}>
            <Svg width={effectiveWidth} height={barHeight} viewBox={`0 0 ${effectiveWidth} ${barHeight}`}>
              <Defs>
                <LinearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#31C48D" />
                  <Stop offset="100%" stopColor="#31C48D" />
                </LinearGradient>
                <LinearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#F05252" />
                  <Stop offset="100%" stopColor="#F05252" />
                </LinearGradient>
              </Defs>
              
              {/* Green (Win) section */}
              {winWidth > 0 && (
                <Path
                  d={`
                    M ${radius} 0
                    H ${winWidth + diagonalOffset}
                    L ${winWidth - diagonalOffset} ${barHeight}
                    H ${radius}
                    A ${radius} ${radius} 0 0 1 0 ${barHeight - radius}
                    V ${radius}
                    A ${radius} ${radius} 0 0 1 ${radius} 0
                    Z
                  `}
                  fill="url(#greenGrad)"
                />
              )}
              
              {/* Red (Loss) section */}
              {lossWidth > 0 && (
                <Path
                  d={`
                    M ${winWidth + diagonalGap + diagonalOffset} 0
                    H ${effectiveWidth - radius}
                    A ${radius} ${radius} 0 0 1 ${effectiveWidth} ${radius}
                    V ${barHeight - radius}
                    A ${radius} ${radius} 0 0 1 ${effectiveWidth - radius} ${barHeight}
                    H ${winWidth + diagonalGap - diagonalOffset}
                    L ${winWidth + diagonalGap + diagonalOffset} 0
                    Z
                  `}
                  fill="url(#redGrad)"
                />
              )}
            </Svg>
          </View>
        </View>
      )}

      {/* Fallback bar when no data */}
      {(containerWidth > 0 && totalPercentage === 0) && (
        <View className="items-center mb-3 w-full">
          <View style={{ marginHorizontal: svgMargin }}>
            <View 
              style={{ 
                width: effectiveWidth, 
                height: barHeight, 
                backgroundColor: '#374151', 
                borderRadius: radius 
              }} 
            />
          </View>
        </View>
      )}

      {/* Bottom amounts */}
      <View className="flex-row justify-between">
        <Text className="text-green-400 font-bold text-sm">
          {formatAmount(winAmount)}
        </Text>
        <Text className="text-red-500 font-bold text-sm">
          -{formatAmount(lossAmount)}
        </Text>
      </View>
    </View>
  );
};