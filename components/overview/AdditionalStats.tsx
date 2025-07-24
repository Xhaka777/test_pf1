import React from 'react';
import { View, Text, Image } from 'react-native';
import icons from '@/constants/icons';

interface AdditionalStatsProps {
  winRate: string;
  profitFactor: string;
}

const AdditionalStats = ({
  winRate = '13.79%',
  profitFactor = '0.04'
}: AdditionalStatsProps) => {

  return (
    <View className="px-2">
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {/* Win Rate Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3 mr-2'>
          <Text className='text-gray-400 text-base font-Inter'>Win Rate</Text>
          <Text className='text-white text-base font-InterSemiBold'>{winRate}</Text>
        </View>

        {/* Profit Factor Card */}
        <View className='flex-1 bg-propfirmone-300 rounded-lg p-3'>
          <Text className='text-gray-400 text-base font-Inter'>Profit Factor</Text>
          <Text className='text-white text-base font-InterSemiBold'>{profitFactor}</Text>
        </View>
      </View>
    </View>
  );
};

export default AdditionalStats;