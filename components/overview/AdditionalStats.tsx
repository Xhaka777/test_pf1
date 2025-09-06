import React from 'react';
import { View, Text, Image } from 'react-native';
import icons from '@/constants/icons';

interface AdditionalStatsProps {
  metricsData?: any;
  isLoading?: boolean;
}

const AdditionalStats = ({
  metricsData,
  isLoading = false,
}: AdditionalStatsProps) => {

  const formatAccountSize = (balance: number) => {
    if (isLoading) return '--';

    if (balance === null || balance === undefined || isNaN(balance)) {
      return '--';
    }

    return `$${balance.toLocaleString()}`;
  };

  const formatDailyPL = (dailyPL: number) => {
    if (isLoading) return '--';

    if (dailyPL === null || dailyPL === undefined || isNaN(dailyPL)) {
      return '--';
    }

    const sign = dailyPL >= 0 ? '+' : '';
    return `${sign}$${Math.abs(dailyPL).toLocaleString()}`;
  };

  const getDailyPLColor = (dailyPL: number) => {
    if (isLoading) return 'text-gray-400';
    if (dailyPL >= 0) return 'text-green-400';
    return 'text-red-400';
  };

  console.log('metricsData?.starting_balance', metricsData?.starting_balance)

  return (
    <View className="px-2 mt-2 mb-2">
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {/* Win Rate Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3 mr-2'>
          <Text className='text-gray-400 text-base font-Inter'>Account Size</Text>
          <Text className={`text-base font-InterSemiBold ${isLoading ? 'text-gray-400' : 'text-white'}`}>
            {formatAccountSize(metricsData?.starting_balance)}</Text>
        </View>

        {/* Profit Factor Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3'>
          <Text className='text-gray-400 text-base font-Inter'>Daily P/L</Text>
          <Text className={`text-base font-InterSemiBold ${isLoading ? 'text-gray-400' : 'text-white'}`}>
            {formatAccountSize(metricsData?.daily_pl)}</Text>
        </View>
      </View>
    </View>
  );
};

export default AdditionalStats;