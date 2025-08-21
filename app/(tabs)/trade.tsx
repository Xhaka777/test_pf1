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

  const { accountDetails, isLoading: accountDetailsLoading } = useAccountDetails();
  const { selectedAccountId, isLoading: accountsLoading } = useAccounts();
  const [activeSymbol] = useActiveSymbol();
  const { isLoaded: userLoaded, user } = useUser();

  const [isInitializing, setIsInitializing] = useState(true);

  const isLoading = useMemo(() => {
    return !userLoaded || !user || accountsLoading || accountDetailsLoading || !selectedAccountId;
  }, [userLoaded, user, accountsLoading, accountDetailsLoading, selectedAccountId]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || isInitializing) {
    let loadingMessage = 'Loading trading interface';

    if (!userLoaded || !user) {
      loadingMessage = 'Authenticating user...';
    } else if (accountsLoading) {
      loadingMessage = 'Loading accounts...';
    } else if (!selectedAccountId) {
      loadingMessage = 'Selecting account...';
    } else if (accountDetailsLoading) {
      loadingMessage = 'Loading account details...';
    }

    return (
      <SafeAreaView className='flex-1 bg-[#100E0F]'>
        <Header />
        <View className='flex-1 flex justify-center items-center'>
          <ActivityIndicator size="large" color='#00d4aa' />
          <Text className="text-white mt-3 text-base">{loadingMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Minimal logging for debugging (instead of massive data dumps)
  console.log('[Trade] Rendering with:', {
    selectedAccountId,
    activeSymbol,
    hasAccountDetails: !!accountDetails,
    hasUser: !!user
  });


  console.log('selectedAccountId', selectedAccountId)
  console.log('activeSymbol', activeSymbol)
  console.log('accountDetails', accountDetails)


  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />

      <TradingWidget />

      {/* Use the enhanced TradingViewChart with provider-like logic */}
      {selectedAccountId && accountDetails && user && (
        <TradingViewChart
          symbol={activeSymbol || 'BTCUSD'}
          selectedAccountId={selectedAccountId}
          accountDetails={accountDetails}
          userId={user.id}
        />
      )}

      <TradingButtons />
    </SafeAreaView>
  );
}

export default Trade;