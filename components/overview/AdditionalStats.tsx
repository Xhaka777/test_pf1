import React from 'react';
import { View, Text, Image } from 'react-native';
import icons from '@/constants/icons';

interface AdditionalStatsProps {
  winRate: number;
  profitFactor: number;
  isLoading?: boolean;
}

const AdditionalStats = ({
  winRate = 0,
  profitFactor = 0,
  isLoading = false,
}: AdditionalStatsProps) => {

  const formatWinRate = (rate: number) => {
    if (isLoading) return '--';
    return `${rate.toFixed(2)}%`;
  };

  const formatProfitFactor = (factor: number) => {
    if (isLoading) return '--';
    return factor.toFixed(2);
  }

  return (
    <View className="px-2">
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {/* Win Rate Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3 mr-2'>
          <Text className='text-gray-400 text-base font-Inter'>Win Rate</Text>
          <Text className={`text-base font-InterSemiBold ${isLoading ? 'text-gray-400' : 'text-white'}`}>
            {formatWinRate(winRate)}</Text>
        </View>

        {/* Profit Factor Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3'>
          <Text className='text-gray-400 text-base font-Inter'>Profit Factor</Text>
          <Text className={`text-base font-InterSemiBold ${isLoading ? 'text-gray-400' : 'text-white'}`}>
            {formatProfitFactor(profitFactor)}</Text>
        </View>
      </View>
    </View>
  );
};

export default AdditionalStats;