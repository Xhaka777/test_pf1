import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header/header';
import { TradingWidget } from '@/components/TradingWidget';


// Equivalent to your overviewAccountType enum
export enum OverviewAccountType {
  propfirm = 'propfirm',
  ownbroker = 'ownbroker'
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TradingViewChart from '@/components/TradingViewTest';
import TradingButtons from '@/components/TradingButtons';

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

      <TradingViewChart/>

      <TradingButtons />

    </SafeAreaView>
  );
}

export default Trade;