import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header/header';
import { TradingWidget } from '@/components/TradingWidget';
import images from '@/constants/images';
import { symbol } from 'd3';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';


// Equivalent to your overviewAccountType enum
export enum OverviewAccountType {
  propfirm = 'propfirm',
  ownbroker = 'ownbroker'
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TradingViewFinal from '@/components/TradingViewTest';
import TradingViewChart from '@/components/TradingViewTest';
import TradingButtons from '@/components/TradingButtons';
import TradingViewTest from '@/components/TradingViewTest';
import FileDetectionTest from '@/components/TradingViewTest';
import BundleFileLoader from '@/components/TradingViewTest';

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
      {/* <TradingWidget/> */}

      {/* <TradingChart /> */}

      {/* <TradingViewChart
        symbol="BTCUSD"
        interval="1H"
        theme="dark"
        hide_side_toolbar={true}
        toolbar_bg="#1e1e1e"
      /> */}

      <BundleFileLoader />

      <TradingButtons />

    </SafeAreaView>
  );
}

export default Trade;