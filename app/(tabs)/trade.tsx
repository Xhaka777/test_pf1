import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header/header';
import { TradingWidget } from '@/components/TradingWidget';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TradingViewChart from '@/components/TradingViewChart';
import TradingButtons from '@/components/TradingButtons';
import { useAccountDetails } from '@/providers/account-details';
import { useAccounts } from '@/providers/accounts';
import { useActiveSymbol } from '@/hooks/use-active-symbol';
import { useUser } from '@clerk/clerk-expo';
import { Loader } from 'lucide-react-native';

type TradeProps = {
  navigation: NativeStackNavigationProp<any>;
};

const Trade = ({ navigation }: TradeProps) => {

  const { accountDetails } = useAccountDetails();
  const { selectedAccountId } = useAccounts();
  const [activeSymbol] = useActiveSymbol();
  const details = useUser();

  if (!details.isLoaded || !details.user) {
    return null;
  }

  console.log('selectedAccountId', selectedAccountId)
  console.log('activeSymbol', activeSymbol)
  console.log('accountDetails', accountDetails)
  console.log('details.isLoaded', details.isLoaded)
  console.log('details.user', details.user)

  if (!selectedAccountId || !accountDetails || !details.isLoaded || !details.user) {
    return (
      <View className='flex-1 flex justify-center items-center'>
        <Loader size={20} color='#000' />
      </View>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />
      <TradingWidget />

      <TradingViewChart
        symbol={activeSymbol}
        selectedAccountId={selectedAccountId}
        accountDetails={accountDetails}
        userId={`${details.user.id}`}
      />

      <TradingButtons />

    </SafeAreaView>
  );
}

export default Trade;