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
import TradingChart from '@/components/TradingChart';
import { usePostHogTracking } from '@/hooks/usePostHogTracking';


type TradeProps = {
  navigation: NativeStackNavigationProp<any>;
};

const Trade = ({ navigation }: TradeProps) => {

  const { accountDetails, isLoading: accountDetailsLoading } = useAccountDetails();
  const { selectedAccountId, isLoading: accountsLoading } = useAccounts();
  const [activeSymbol] = useActiveSymbol();
  const { isLoaded: userLoaded, user } = useUser();
  const details = useUser();
  const { trackScreenView, trackEvent, trackError } = usePostHogTracking();

  const [isInitializing, setIsInitializing] = useState(true);

  const isLoading = useMemo(() => {
    return !userLoaded || !user || accountsLoading || accountDetailsLoading || !selectedAccountId;
  }, [userLoaded, user, accountsLoading, accountDetailsLoading, selectedAccountId]);

  // Track screen view when component mounts
  useEffect(() => {
    if (!isLoading && !isInitializing) {
      trackScreenView('trading_chart', {
        symbol: activeSymbol,
        account_id: selectedAccountId,
        exchange: accountDetails?.exchange,
        account_type: accountDetails?.account_type,
        has_account_details: !!accountDetails
      });
    }
  }, [isLoading, isInitializing, activeSymbol, selectedAccountId, accountDetails, trackScreenView]);

  // Track symbol changes
  useEffect(() => {
    if (activeSymbol && !isLoading) {
      trackEvent('trading_symbol_changed', {
        symbol: activeSymbol,
        account_id: selectedAccountId,
        exchange: accountDetails?.exchange,
        previous_symbol: null // You could track previous symbol if needed
      });
    }
  }, [activeSymbol, selectedAccountId, accountDetails, isLoading, trackEvent]);

  // Track account changes in trading
  useEffect(() => {
    if (selectedAccountId && accountDetails && !isLoading) {
      trackEvent('trading_account_changed', {
        account_id: selectedAccountId,
        account_name: accountDetails.name,
        account_type: accountDetails.account_type,
        exchange: accountDetails.exchange,
        balance: accountDetails.balance,
        currency: accountDetails.currency
      });
    }
  }, [selectedAccountId, accountDetails, isLoading, trackEvent]);

  // Track loading errors
  useEffect(() => {
    if (!userLoaded && user === null) {
      trackError('User authentication failed in trading screen', {
        screen: 'trading',
        context: 'user_loading'
      });
    }
  }, [userLoaded, user, trackError]);

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

  // console.log('selectedAccountId', selectedAccountId)
  console.log('activeSymbol', activeSymbol)
  // console.log('accountDetails', accountDetails)

  return (
    <SafeAreaView className='flex-1 bg-[#100E0F]'>
      <Header />

      <TradingWidget />

      {selectedAccountId && accountDetails && user && (
        <TradingViewChart
          symbol={activeSymbol || 'BTCUSD'}
          selectedAccountId={selectedAccountId}
          accountDetails={accountDetails}
          userId={user.id}
        />
      )}

      {/* {selectedAccountId && accountDetails && user && (
        <TradingChart
          symbol={activeSymbol || 'BTCUSD'}
          selectedAccountId={selectedAccountId}
          accountDetails={accountDetails}
          userId={`${details.user?.id}`}
          className="flex-1"
        />
      )} */}

      <TradingButtons />
    </SafeAreaView>
  );
}

export default Trade;