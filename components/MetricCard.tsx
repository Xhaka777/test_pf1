import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import icons from '@/constants/icons';

interface MetricCardProps {
  title: string;
  value: string;
  iconType: 'balance' | 'profit';
}

function MetricCard({ title, value, iconType }: MetricCardProps) {
  return (
    <View className='flex-1 bg-propfirmone-300 rounded-lg p-3 mr-2'>
      <View className='w-8 h-8 bg-primary-900 rounded-lg items-center justify-center mb-1'>
        {iconType === 'balance' ? (
          <Image
            source={icons.dollar_chart_sign}
            className='w-8 h-8'
            resizeMode='contain'
          />
        ) : (
          <Image
            source={icons.dollar_sign}
            className='w-8 h-8'
            resizeMode='contain'
          />
        )}
      </View>
      <Text className='text-gray-400 text-sm font-Inter'>{title}</Text>
      <Text className='text-white text-lg font-InterSemiBold'>{value}</Text>
    </View>
  );
}

export default MetricCard;