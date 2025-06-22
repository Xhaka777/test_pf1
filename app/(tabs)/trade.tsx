import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { getDateRangeFromTimeframe, timeframes, TimeframeSelector } from '@/components/timeframe-selector';
import { useFetchAccountsOverviewDetails } from '@/hooks/api/useFetchAccountsOverviewDetails';
import { AccountTypeEnum } from '@/constants/enums';
import Header from '@/components/Header/header';
import { TradingWidget } from '@/components/TradingWidget';
import images from '@/constants/images';
import { symbol } from 'd3';

// Equivalent to your overviewAccountType enum
export enum OverviewAccountType {
  propfirm = 'propfirm',
  ownbroker = 'ownbroker'
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GridComponent from '@/components/TradingChart';
import TradingChart from '@/components/TradingChart';

type TradeProps = {
  navigation: NativeStackNavigationProp<any>;
};

const Trade = ({ navigation }: TradeProps) => {

  const handlePairPress = (symbol: any) => {
    console.log(`Pressed ${symbol}`)
  }

  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />
      <TradingWidget/>

      <TradingChart />

    </SafeAreaView>
  );
}

export default Trade;