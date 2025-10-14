import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Image, ScrollView, Button, Dimensions, Alert } from 'react-native'
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
import TradingChart from '@/components/TradingChart';
import { useAuthenticatedApi } from '@/api/services/api';
import { GetPricesData } from '@/api/schema';
import { ApiRoutes } from '@/api/types';
import SimpleTradingViewPositions from '@/components/SimpleTradingViewPositions';
import TradingView from '@/components/TradingView';


type TradeProps = {
  navigation: NativeStackNavigationProp<any>;
};

const Trade = ({ navigation }: TradeProps) => {

  const { accountDetails, isLoading: accountDetailsLoading } = useAccountDetails();
  const { selectedAccountId, isLoading: accountsLoading } = useAccounts();
  const [activeSymbol] = useActiveSymbol();
  const { isLoaded: userLoaded, user } = useUser();
  const details = useUser();

  const [isInitializing, setIsInitializing] = useState(true);

  const isLoading = useMemo(() => {
    return !userLoaded || !user || accountsLoading || accountDetailsLoading || !selectedAccountId;
  }, [userLoaded, user, accountsLoading, accountDetailsLoading, selectedAccountId]);

  const positions = [
    {
      symbol: 'AAPL',
      side: 'LONG',
      quantity: 10,
      entryPrice: 170.50,
      currentPrice: 173.68,
      profit: 31.80,
    },
    {
      symbol: 'AAPL',
      side: 'SHORT',
      quantity: 5,
      entryPrice: 175.00,
      currentPrice: 173.68,
      profit: 6.60,
    }
  ];

  // useEffect(() => {
  //   if (!isLoading) {
  //     const timer = setTimeout(() => {
  //       setIsInitializing(false);
  //     }, 500);

  //     return () => clearTimeout(timer);
  //   }
  // }, [isLoading]);

  // if (isLoading || isInitializing) {
  //   let loadingMessage = 'Loading trading interface';

  //   if (!userLoaded || !user) {
  //     loadingMessage = 'Authenticating user...';
  //   } else if (accountsLoading) {
  //     loadingMessage = 'Loading accounts...';
  //   } else if (!selectedAccountId) {
  //     loadingMessage = 'Selecting account...';
  //   } else if (accountDetailsLoading) {
  //     loadingMessage = 'Loading account details...';
  //   }

  //   return (
  //     <SafeAreaView className='flex-1 bg-[#100E0F]'>
  //       <Header />
  //       <View className='flex-1 flex justify-center items-center'>
  //         <ActivityIndicator size="large" color='#00d4aa' />
  //         <Text className="text-white mt-3 text-base">{loadingMessage}</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // // Minimal logging for debugging (instead of massive data dumps)
  // console.log('[Trade] Rendering with:', {
  //   selectedAccountId,
  //   activeSymbol,
  //   hasAccountDetails: !!accountDetails,
  //   hasUser: !!user
  // });


  // console.log('selectedAccountId', selectedAccountId)
  console.log('activeSymbol', activeSymbol)
  // console.log('accountDetails', accountDetails)

  const samplePositions = [
    {
      id: '1',
      symbol: 'AAPL',
      side: "LONG" as "LONG",
      entry: 173.68,
      quantity: 12,
      tp: 180,
      sl: 165,
      profit: 75.84,
      loss: -104.16
    },
    {
      id: '2',
      symbol: 'AAPL',
      side: "SHORT" as "SHORT",
      entry: 175.50,
      quantity: 10,
      tp: 170,
      sl: 178,
      profit: 55.00,
      loss: -25.00
    }
  ];

  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />

      <TradingWidget />

      {/* Use the enhanced TradingViewChart with provider-like logic */}
      {/* {selectedAccountId && accountDetails && user && (
        <TradingViewChart
          symbol={activeSymbol || 'BTCUSD'}
          selectedAccountId={selectedAccountId}
          accountDetails={accountDetails}
          userId={user.id}
        />
      )} */}

      {selectedAccountId && accountDetails && user && (
        <TradingChart
          symbol={activeSymbol || 'BTCUSD'}
          selectedAccountId={selectedAccountId}
          accountDetails={accountDetails}
          userId={`${details.user?.id}`}
          className="flex-1"
        />
      )}
      {/* <TradingChart/> */}
      {/* <SimpleTradingViewPositions positions={samplePositions}/> */}
      {/* <TradingView/> */}
      <TradingButtons />
    </SafeAreaView>
  );
}

export default Trade;