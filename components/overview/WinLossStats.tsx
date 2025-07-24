import { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, Path, LinearGradient, Stop } from 'react-native-svg';

interface WinLossStatsProps {
  winPercentage: number;
  lossPercentage: number;
  winAmount: number;
  lossAmount: number;
}

export const WinLossStats = ({
  winPercentage,
  lossPercentage,
  winAmount,
  lossAmount,
}: WinLossStatsProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const barHeight = 10;
  const diagonalGap = 5;
  const diagonalOffset = 6;
  const radius = 5;
  // Add horizontal margins for the SVG bar
  const svgMargin = 20; // 10px on each side
  const effectiveWidth = containerWidth - (2 * svgMargin);

  const totalPercentage = winPercentage + lossPercentage;
  const winWidth = (winPercentage / totalPercentage) * (effectiveWidth - diagonalGap);
  const lossWidth = (lossPercentage / totalPercentage) * (effectiveWidth - diagonalGap);

  return (
    <View
      className="bg-[#1a1a1a] rounded-lg px-6 py-4 my-2 mx-2"
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <View className="flex-row justify-between mb-3">
        <Text className="text-gray-400 text-sm font-medium">Avg Win/Loss</Text>
        <Text className="text-sm font-semibold">
          <Text className="text-green-400">{winPercentage.toFixed(2)}%</Text>
          <Text className="text-gray-500"> / </Text>
          <Text className="text-red-500">{lossPercentage.toFixed(2)}%</Text>
        </Text>
      </View>

      {containerWidth > 0 && effectiveWidth > 0 && (
        <View className="items-center mb-3 w-full">
          <View style={{ marginHorizontal: svgMargin }}>
            <Svg width={effectiveWidth} height={barHeight} viewBox={`0 0 ${effectiveWidth} ${barHeight}`}>
              <Defs>
                <LinearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#4ade80" />
                  <Stop offset="100%" stopColor="#22c55e" />
                </LinearGradient>
                <LinearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#ef4444" />
                  <Stop offset="100%" stopColor="#dc2626" />
                </LinearGradient>
              </Defs>

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
            </Svg>
          </View>
        </View>
      )}

      <View className="flex-row justify-between">
        <Text className="text-green-400 font-bold">${winAmount}</Text>
        <Text className="text-red-500 font-bold">-${lossAmount}</Text>
      </View>
    </View>
  );
};