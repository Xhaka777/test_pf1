import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header/header';
import { TradingWidget } from '@/components/TradingWidget';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TradingViewChart from '@/components/TradingViewChart'; // Back to direct import
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

  // Add validation like your web teammates
  if (!selectedAccountId || !accountDetails || !details.isLoaded || !details.user) {
    return (
      <View className='flex-1 flex justify-center items-center bg-[#100E0F]'>
        <Loader size={20} color='#00d4aa' />
        <Text className="text-white mt-2">Loading trading interface...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />
      <TradingWidget />
      
      {/* Use the enhanced TradingViewChart with provider-like logic */}
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