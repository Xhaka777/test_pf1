import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUser } from '@clerk/clerk-expo';

import MenuHeader from '@/components/Header/menuHeader';
import SelectableButton from '@/components/SelectableButton';
import Profile from '@/components/Profile';
import BottomSheet, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import ProfileBottomSheet from '@/components/ProfileBottomSheet';
import ConfirmBottomSheet from '@/components/ConfirmBottomSheet';
// Updated AccountBottomSheet component alias for clarity
import DemoAccBottomSheet from '@/components/AccountBottomSheet';
import BrokerBottomSheet from '@/components/overview/BrokerBottomSheet';
import SeachInput from '@/components/SearchInput';
import NoPropFirmAccounts from '@/components/NoPropFirmAccounts';
import NoBrokerAccount from '@/components/NoBrokerAccount';

// Import icons for bottom sheet configuration
import { EvaluatedAccountIcon } from '@/components/icons/EvaluatedAccountIcon';
import { FundedAccountIcon } from '@/components/icons/FundedAccountIcon';
import AccountIcon from '@/components/icons/AccountIcon';
import { PracticeIcon } from '@/components/icons/PracticeIcon';
import { useFetchPropFirmAccountsOverview, useGetBrokerAccounts, useGetPropFirmAccounts } from '@/api';

const Menu = () => {
  const { user } = useUser();

  // Updated state to use the three account types
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState(null); // For bottom sheet

  const bottomSheetRef = useRef<BottomSheet>(null);
  const confirmSignOutSheetRef = useRef<BottomSheet>(null);
  const demoBottomSheetRef = useRef<BottomSheetModal>(null);
  const accountBottomSheetRef = useRef<BottomSheetModal>(null);

  // ✅ FIXED: Get prop firm accounts data from API
  const {
    data: propFirmAccountsData,
    isLoading: propFirmAccountsLoading,
    error: propFirmAccountsError,
    refetch: refetchPropFirmAccounts
  } = useGetPropFirmAccounts({
    enabled: selectedAccountType === 'propFirm',
  });

  const {
    data: propFirmOverviewData,
    isLoading: propFirmOverviewLoading,
    error: propFirmOverviewError
  } = useFetchPropFirmAccountsOverview({
    enabled: selectedAccountType === 'propFirm',
  });

  const {
    data: brokerAccountsData,
    isLoading: brokerAccountsLoading,
    error: brokerAccountsError,
    refetch: refetchBrokerAccounts
  } = useGetBrokerAccounts();

  // ✅ FIXED: Process prop firm accounts similar to broker accounts
  const processedPropFirmAccounts = useMemo(() => {
    if (!propFirmAccountsData?.prop_firm_accounts) return { evaluation: [], funded: [] };

    console.log('[Menu] Processing prop firm accounts:', propFirmAccountsData.prop_firm_accounts.length);

    const processedAccounts = propFirmAccountsData.prop_firm_accounts.map((account: any) => {
      // Calculate performance percentage
      const totalGainLoss = account.balance - account.starting_balance;
      const totalPerformancePercentage = account.starting_balance > 0
        ? (totalGainLoss / account.starting_balance) * 100
        : 0;

      return {
        id: account.id,
        name: account.name,
        balance: account.balance,
        dailyPL: account.daily_pl,
        changePercentage: totalPerformancePercentage,
        type: account.account_type.toLowerCase() === 'funded' ? 'Funded' : 'Challenge',
        currency: account.currency || 'USD',
        firm: account.firm,
        program: account.program,
        totalPL: account.total_pl,
        netPL: account.net_pl,
        startingBalance: account.starting_balance,
        maxTotalDD: account.max_total_dd,
        profitTarget: account.profit_target,
        originalData: account,
      };
    });

    // Separate by account type
    const evaluation = processedAccounts.filter(acc => acc.type === 'Challenge');
    const funded = processedAccounts.filter(acc => acc.type === 'Funded');

    console.log('[Menu] Processed prop firm accounts:', { evaluation: evaluation.length, funded: funded.length });

    return { evaluation, funded };
  }, [propFirmAccountsData]);

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            Alert.alert("Signed out successfully!");
          }
        }
      ]
    );
  };

  // Handle profile press (passed to Profile component)
  const handleProfilePress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  //Handle confirm signOut press (passed to ProfileBottomSheet reusable component...)
  const handleConfirmSignOutPress = useCallback(() => {
    bottomSheetRef.current?.forceClose();
    confirmSignOutSheetRef.current?.expand();
  }, []);

  const handleDemoPress = useCallback(() => {
    demoBottomSheetRef.current?.present();
  }, []);

  // Handle account press - opens account details bottom sheet
  const handleAccountPress = useCallback((account: any) => {
    console.log('[Menu] Account pressed:', account.id, account.name, account.type);
    setSelectedAccount(account);
    
    // ✅ FIXED: Use appropriate bottom sheet based on account type
    if (account.type === 'Challenge' || account.type === 'Funded') {
      // Use AccountBottomSheet for prop firm accounts
      demoBottomSheetRef.current?.present();
    } else if (account.type === 'Live' || account.type === 'Demo') {
      // Use BrokerBottomSheet for broker accounts
      accountBottomSheetRef.current?.present();
    } else {
      // Fallback to AccountBottomSheet
      demoBottomSheetRef.current?.present();
    }
  }, []);

  // Handle trade press from bottom sheet
  const handleTradePress = useCallback((accountData: any) => {
    accountBottomSheetRef.current?.dismiss();
  }, []);

  // Render account content based on selected account type
  const renderAccountContent = () => {
    switch (selectedAccountType) {
      case 'propFirm':
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}
            hideTabBar={false} 
            // ✅ FIXED: Pass real API data instead of using internal mock data
            accountData={{
              evaluation: processedPropFirmAccounts.evaluation,
              funded: processedPropFirmAccounts.funded,
            }}
            isLoading={propFirmAccountsLoading}
            error={propFirmAccountsError}
            onAccountPress={handleAccountPress}
            onRefresh={refetchPropFirmAccounts}
          />
        );

      case 'brokerage':
        return (
          <NoBrokerAccount
            showCart={false}
            showTimePeriods={false}
            showMetrics={false}
            showTabs={true}
            isMenuScreen={true}
            presetActiveTab="Live"
            hideTabBar={false}
            showOnlyPresetTab={true}
            brokerAccountsData={brokerAccountsData}
            brokerAccountsLoading={brokerAccountsLoading}
            brokerAccountsError={brokerAccountsError}
            refetchBrokerAccounts={refetchBrokerAccounts}
          />
        );

      case 'practice':
        return (
          <NoBrokerAccount
            showCart={false}
            showTimePeriods={false}
            showMetrics={false}
            showTabs={true}
            isMenuScreen={true}
            presetActiveTab="Demo"
            hideTabBar={false}
            showOnlyPresetTab={true}
            brokerAccountsData={brokerAccountsData}
            brokerAccountsLoading={brokerAccountsLoading}
            brokerAccountsError={brokerAccountsError}
            refetchBrokerAccounts={refetchBrokerAccounts}
          />
        );

      default:
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}
            // ✅ FIXED: Pass real API data as fallback too
            accountData={{
              evaluation: processedPropFirmAccounts.evaluation,
              funded: processedPropFirmAccounts.funded,
            }}
            isLoading={propFirmAccountsLoading}
            error={propFirmAccountsError}
            onAccountPress={handleAccountPress}
            onRefresh={refetchPropFirmAccounts}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView className='flex-1 bg-propfirmone-main'>
      <SafeAreaView className="bg-propfirmone-main flex-1">
        <MenuHeader onSignOut={handleSignOut} />

        {/* Main content */}
        <View className="flex-1">
          <View className="px-6 pb-2 mt-3">
            <Text className="text-white text-xl text-start font-InterSemiBold">
              Switch Account
            </Text>
          </View>

          {/* Three Account Type Buttons */}
          <View className="flex-row px-3 py-2 space-x-2">
            <SelectableButton
              text="Prop Firm"
              isSelected={selectedAccountType === 'propFirm'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('propFirm')}
              additionalStyles="flex-1"
            />
            <SelectableButton
              text="Brokerage"
              isSelected={selectedAccountType === 'brokerage'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('brokerage')}
              additionalStyles="flex-1 mx-2"
            />
            <SelectableButton
              text="Practice"
              isSelected={selectedAccountType === 'practice'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('practice')}
              additionalStyles="flex-1"
            />
          </View>

          {/* Account Content */}
          <View className='flex-1'>
            {renderAccountContent()}
          </View>
        </View>

        {/* Profile at bottom */}
        <View>
          <View className="h-0.5 bg-propfirmone-100 mx-4" />
          <Profile
            onProfilePress={handleProfilePress}
            planName="Free Plan" />
        </View>

        <ProfileBottomSheet
          bottomSheetRef={bottomSheetRef}
          onSignOutPress={handleConfirmSignOutPress}
        />

        <ConfirmBottomSheet
          bottomSheetRef={bottomSheetRef}
          confirmSignOutSheetRef={confirmSignOutSheetRef}
        />

        <DemoAccBottomSheet
          bottomSheetRef={demoBottomSheetRef}
          accountData={selectedAccount && (selectedAccount.type === 'Challenge' || selectedAccount.type === 'Funded') ? {
            id: selectedAccount.id,
            name: selectedAccount.name,
            balance: `${selectedAccount.currency || 'USD'} ${selectedAccount.balance.toLocaleString()}`,
            dailyPL: `${selectedAccount.dailyPL >= 0 ? '+' : ''}${selectedAccount.currency || 'USD'} ${Math.abs(selectedAccount.dailyPL).toLocaleString()}`,
            changePercentage: `${selectedAccount.changePercentage >= 0 ? '+' : ''}${selectedAccount.changePercentage.toFixed(2)}%`,
            type: selectedAccount.type,
            originalData: selectedAccount.originalData,
            currency: selectedAccount.currency,
            firm: selectedAccount.firm,
            program: selectedAccount.program,
            totalPL: selectedAccount.totalPL,
            netPL: selectedAccount.netPL,
            startingBalance: selectedAccount.startingBalance,
            maxTotalDD: selectedAccount.maxTotalDD,
            profitTarget: selectedAccount.profitTarget,
          } : undefined}
        />

        {/* ✅ FIXED: BrokerBottomSheet for Broker accounts (Live/Demo) */}
        {selectedAccount && (selectedAccount.type === 'Live' || selectedAccount.type === 'Demo') && (
          <BrokerBottomSheet
            bottomSheetRef={accountBottomSheetRef}
            accountData={{
              id: selectedAccount.id,
              name: selectedAccount.name,
              balance: `${selectedAccount.currency || 'USD'} ${selectedAccount.balance.toLocaleString()}`,
              dailyPL: `${selectedAccount.dailyPL >= 0 ? '+' : ''}${selectedAccount.currency || 'USD'} ${Math.abs(selectedAccount.dailyPL).toLocaleString()}`,
              changePercentage: `${selectedAccount.changePercentage >= 0 ? '+' : ''}${selectedAccount.changePercentage.toFixed(2)}%`,
              type: selectedAccount.type,
              originalData: selectedAccount.originalData,
              currency: selectedAccount.currency,
              firm: selectedAccount.firm,
              exchange: selectedAccount.exchange,
              server: selectedAccount.server,
              status: selectedAccount.status,
              totalPL: selectedAccount.totalPL,
              startingBalance: selectedAccount.startingBalance,
            }}
          />
        )}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Menu;