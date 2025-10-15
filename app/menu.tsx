import { View, Text, SafeAreaView, Alert, TouchableOpacity, ScrollView } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUser } from '@clerk/clerk-expo';

import MenuHeader from '@/components/Header/menuHeader';
import SelectableButton from '@/components/SelectableButton';
import Profile from '@/components/Profile';
import BottomSheet, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import ProfileBottomSheet from '@/components/ProfileBottomSheet';
import ConfirmBottomSheet from '@/components/ConfirmBottomSheet';
import DemoAccBottomSheet from '@/components/AccountBottomSheet';
import BrokerBottomSheet from '@/components/overview/BrokerBottomSheet';
import NoPropFirmAccounts from '@/components/NoPropFirmAccounts';
import NoBrokerAccount from '@/components/NoBrokerAccount';
import { useArchiveAccountMutation, useFetchPropFirmAccountsOverview, useGetBrokerAccounts, useGetPropFirmAccounts } from '@/api';
import { AccountStatusEnum } from '@/constants/enums';
import { useAccounts } from '@/providers/accounts';
import { useGetMetrics } from '@/api/hooks/metrics';
import { ArchiveAccountModal } from '@/components/ArchiveAccountModal';

const Menu = () => {
  const { user } = useUser();

  // Updated state to use the three account types
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState(null); // For bottom sheet

  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [accountToArchive, setAccountToArchive] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true); // Default to true like web

  const bottomSheetRef = useRef<BottomSheet>(null);
  const confirmSignOutSheetRef = useRef<BottomSheet>(null);
  const demoBottomSheetRef = useRef<BottomSheetModal>(null);
  const accountBottomSheetRef = useRef<BottomSheetModal>(null);

  const {
    selectedAccountId,
    setSelectedAccountId,
    setSelectedPreviewAccountId,
    selectedPreviewAccountId
  } = useAccounts();

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

  const archiveAccountMutation = useArchiveAccountMutation();

  console.log('archiveAccountMutation', archiveAccountMutation)

  const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;
  const { data: metricsData } = useGetMetrics(currentAccountId);

  const lossRate = useMemo(() => {
    return 100 - (metricsData?.win_rate ?? 0);
  }, [metricsData?.win_rate]);

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
        status: account.status,
        originalData: account,
      };
    });

    // Separate by account type
    const evaluation = processedAccounts.filter(acc => acc.type === 'Challenge');
    const funded = processedAccounts.filter(acc => acc.type === 'Funded');

    console.log('[Menu] Processed prop firm accounts:', { evaluation: evaluation.length, funded: funded.length });

    return { evaluation, funded };
  }, [propFirmAccountsData]);

  const processedBrokerAccounts = useMemo(() => {
    if (!brokerAccountsData?.broker_accounts) return { live: [], demo: [] };

    console.log('[Menu] Processing broker accounts:', brokerAccountsData.broker_accounts.length);

    const processedAccounts = brokerAccountsData.broker_accounts.map((account: any) => {
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
        type: account.account_type.toLowerCase() === 'demo' ? 'Demo' : 'Live',
        currency: account.currency,
        firm: account.firm,
        exchange: account.exchange,
        server: account.server,
        status: account.status,
        totalPL: account.total_pl,
        startingBalance: account.starting_balance,
        originalData: account,
      };
    });

    const live = processedAccounts.filter(acc => acc.type === 'Live');
    const demo = processedAccounts.filter(acc => acc.type === 'Demo');

    console.log('[Menu] Processed broker accounts:', { live: live.length, demo: demo.length });

    return { live, demo };
  }, [brokerAccountsData]);

  const filteredActiveAccounts = useMemo(() => {
    let allAccounts = [];

    // Get all accounts based on selected type
    if (selectedAccountType === 'propFirm') {
      allAccounts = [...processedPropFirmAccounts.evaluation, ...processedPropFirmAccounts.funded];
    } else if (selectedAccountType === 'brokerage') {
      allAccounts = processedBrokerAccounts.live;
    } else if (selectedAccountType === 'practice') {
      allAccounts = processedBrokerAccounts.demo;
    }

    // Filter by ACTIVE status first (like web teammate's logic)
    const activeAccounts = allAccounts.filter((account) =>
      account.status === AccountStatusEnum.ACTIVE
    );

    // Then apply search filter (like web teammate's logic)
    return activeAccounts.filter((account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toString().includes(searchTerm) ||
      (account.currency && account.currency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.firm && account.firm.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [
    selectedAccountType,
    processedPropFirmAccounts.evaluation,
    processedPropFirmAccounts.funded,
    processedBrokerAccounts.live,
    processedBrokerAccounts.demo,
    searchTerm
  ]);

  const filteredArchivedAccounts = useMemo(() => {
    let allAccounts = [];

    // Get all accounts based on selected type
    if (selectedAccountType === 'propFirm') {
      allAccounts = [...processedPropFirmAccounts.evaluation, ...processedPropFirmAccounts.funded];
    } else if (selectedAccountType === 'brokerage') {
      allAccounts = processedBrokerAccounts.live;
    } else if (selectedAccountType === 'practice') {
      allAccounts = processedBrokerAccounts.demo;
    }

    // Filter by INACTIVE status first (PASSED, FAILED, DISCONNECTED like web teammate's logic)
    const inactiveAccounts = allAccounts.filter((account) =>
      [
        AccountStatusEnum.PASSED,
        AccountStatusEnum.FAILED,
        AccountStatusEnum.DISCONNECTED,
      ].includes(account.status)
    );

    // Then apply search filter (like web teammate's logic)
    return inactiveAccounts.filter((account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toString().includes(searchTerm) ||
      (account.currency && account.currency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.firm && account.firm.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [
    selectedAccountType,
    processedPropFirmAccounts.evaluation,
    processedPropFirmAccounts.funded,
    processedBrokerAccounts.live,
    processedBrokerAccounts.demo,
    searchTerm
  ]);

  const finalAccountsToShow = useMemo(() => {
    if (selectedAccountType === 'propFirm') {
      const activeEvaluation = filteredActiveAccounts.filter(acc => acc.type === 'Challenge');
      const activeFunded = filteredActiveAccounts.filter(acc => acc.type === 'Funded');

      if (activeOnly) {
        return { evaluation: activeEvaluation, funded: activeFunded };
      } else {
        // Include archived accounts too
        const archivedEvaluation = filteredArchivedAccounts.filter(acc => acc.type === 'Challenge');
        const archivedFunded = filteredArchivedAccounts.filter(acc => acc.type === 'Funded');

        return {
          evaluation: [...activeEvaluation, ...archivedEvaluation],
          funded: [...activeFunded, ...archivedFunded]
        };
      }
    } else {
      // For broker/practice accounts
      if (activeOnly) {
        return { accounts: filteredActiveAccounts };
      } else {
        return { accounts: [...filteredActiveAccounts, ...filteredArchivedAccounts] };
      }
    }
  }, [
    selectedAccountType,
    filteredActiveAccounts,
    filteredArchivedAccounts,
    activeOnly
  ]);

  const handleArchivePress = useCallback((account: any) => {
    setAccountToArchive(account);
    setArchiveModalVisible(true);
  }, []);

  const handleArchiveAccount = useCallback(async (
    status: AccountStatusEnum.PASSED | AccountStatusEnum.FAILED | AccountStatusEnum.DISCONNECTED | AccountStatusEnum.SUBSCRIPTION_ENDED
  ) => {
    if (!accountToArchive) return;

    try {
      await archiveAccountMutation.mutateAsync({
        account: accountToArchive.id,
        account_status: status,
      });

      Alert.alert(
        "Success",
        `"${accountToArchive.name}" has been archived successfully.`,
        [{ text: "OK" }]
      );

      if (selectedAccountId === accountToArchive.id) {
        //
      }

      if (selectedAccountType === 'propFirm') {
        refetchPropFirmAccounts();
      } else {
        refetchBrokerAccounts();
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while trying to archive the account. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setArchiveModalVisible(false);  // This will close the modal
      setAccountToArchive(null);      // Clear the account to archive
    }
  }, [
    accountToArchive,
    archiveAccountMutation,
    selectedAccountId,
    selectedAccountType,
    refetchPropFirmAccounts,
    refetchBrokerAccounts
  ]);

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
    console.log('[Menu] Account pressed:', {
      id: account.id,
      name: account.name,
      type: account.type,
      pressArea: 'full-account-area'
    });

    setSelectedAccount(account);

    // Add small delay to ensure state is set
    setTimeout(() => {
      if (account.type === 'Challenge' || account.type === 'Funded') {
        console.log('[Menu] Opening AccountBottomSheet for prop firm account');
        demoBottomSheetRef.current?.present();
      } else if (account.type === 'Live' || account.type === 'Demo') {
        console.log('[Menu] Opening BrokerBottomSheet for broker account');
        accountBottomSheetRef.current?.present();
      } else {
        console.log('[Menu] Unknown account type, using default AccountBottomSheet');
        demoBottomSheetRef.current?.present();
      }
    }, 100);
  }, []);

  const handleAccountSelect = useCallback((accountId: number) => {
    setSelectedAccountId(accountId);
  }, [setSelectedAccountId])

  const handleBrokerAccountPress = useCallback((account: any) => {
    console.log('[Menu] Broker account pressed - full area touch:', {
      id: account.id,
      name: account.name,
      type: account.type,
      originalData: !!account.originalData
    });

    // ADD THIS LINE - Set preview account for metrics
    setSelectedPreviewAccountId(account.id);

    // Create enhanced account data immediately
    const enhancedAccountData = {
      id: account.id,
      name: account.name,
      balance: `${account.currency || 'USD'} ${account.balance.toLocaleString()}`,
      dailyPL: `${account.dailyPL >= 0 ? '+' : ''}${account.currency || 'USD'} ${Math.abs(account.dailyPL).toLocaleString()}`,
      changePercentage: `${account.changePercentage >= 0 ? '+' : ''}${account.changePercentage.toFixed(2)}%`,
      type: account.type,
      originalData: account.originalData,
      currency: account.currency,
      firm: account.firm,
      exchange: account.exchange,
      server: account.server,
      status: account.status,
      totalPL: account.totalPL,
      startingBalance: account.startingBalance,
    };

    setSelectedAccount(enhancedAccountData);

    // Use immediate presentation for better responsiveness
    if (account.type === 'Live' || account.type === 'Demo') {
      accountBottomSheetRef.current?.present();
    } else {
      demoBottomSheetRef.current?.present();
    }
  }, [setSelectedPreviewAccountId]); // Add dependency

  // Handle trade press from bottom sheet
  const handleTradePress = useCallback((accountData: any) => {
    accountBottomSheetRef.current?.dismiss();
  }, []);

  // ✅ Handle search (like web teammate's logic)
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
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
            // ✅ Pass filtered data instead of original data
            accountData={finalAccountsToShow}
            isLoading={propFirmAccountsLoading}
            error={propFirmAccountsError}
            onAccountPress={handleAccountPress}
            onRefresh={refetchPropFirmAccounts}
            //
            currentAccountId={selectedAccountId}
            onArchivePress={handleArchivePress}
            context='menu'
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
            brokerAccountsData={{
              broker_accounts: finalAccountsToShow.accounts?.map(acc => acc.originalData) || []
            }}
            brokerAccountsLoading={brokerAccountsLoading}
            brokerAccountsError={brokerAccountsError}
            refetchBrokerAccounts={refetchBrokerAccounts}
            onAccountPress={handleBrokerAccountPress}
            //
            currentAccountId={selectedAccountId}
            onArchivePress={handleArchivePress}
            context='menu'
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
            brokerAccountsData={{
              broker_accounts: finalAccountsToShow.accounts?.map(acc => acc.originalData) || []
            }}
            brokerAccountsLoading={brokerAccountsLoading}
            brokerAccountsError={brokerAccountsError}
            refetchBrokerAccounts={refetchBrokerAccounts}
            onAccountPress={handleBrokerAccountPress}
            //
            currentAccountId={selectedAccountId}
            onArchivePress={handleArchivePress}
            context='menu'
          />
        );

      default:
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}

            accountData={finalAccountsToShow}
            isLoading={propFirmAccountsLoading}
            error={propFirmAccountsError}
            onAccountPress={handleAccountPress}
            onRefresh={refetchPropFirmAccounts}
            //
            currentAccountId={selectedAccountId}
            onArchivePress={handleArchivePress}
            context='menu'
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
          <ScrollView
            className='flex-1'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {renderAccountContent()}
          </ScrollView>
        </View>

        {/* Profile at bottom */}
        {!archiveModalVisible && (
          <>
            <View>
              <View className="h-0.5 bg-propfirmone-100 mx-4" />
              <Profile
                onProfilePress={handleProfilePress} />
            </View>

            <ProfileBottomSheet
              bottomSheetRef={bottomSheetRef}
              onSignOutPress={handleConfirmSignOutPress}
            />

            <ConfirmBottomSheet
              bottomSheetRef={bottomSheetRef}
              confirmSignOutSheetRef={confirmSignOutSheetRef}
            />
          </>
        )}

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
          metricsData={metricsData}
          onArchivePress={handleArchivePress}
          onAccountSelect={handleAccountSelect}
        />

        {selectedAccount && (selectedAccount.type === 'Live' || selectedAccount.type === 'Demo') && (
          <BrokerBottomSheet
            bottomSheetRef={accountBottomSheetRef}
            context="menu"
            accountData={selectedAccount && (selectedAccount.type === 'Live' || selectedAccount.type === 'Demo') ? {
              id: selectedAccount.id,
              name: selectedAccount.name,
              balance: typeof selectedAccount.balance === 'string'
                ? selectedAccount.balance
                : `${selectedAccount.currency || 'USD'} ${selectedAccount.balance.toLocaleString()}`,
              dailyPL: typeof selectedAccount.dailyPL === 'string'
                ? selectedAccount.dailyPL
                : `${selectedAccount.dailyPL >= 0 ? '+' : ''}${selectedAccount.currency || 'USD'} ${Math.abs(selectedAccount.dailyPL).toLocaleString()}`,
              changePercentage: typeof selectedAccount.changePercentage === 'string'
                ? selectedAccount.changePercentage
                : `${selectedAccount.changePercentage >= 0 ? '+' : ''}${selectedAccount.changePercentage.toFixed(2)}%`,
              type: selectedAccount.type,
              originalData: selectedAccount.originalData,
              currency: selectedAccount.currency,
              firm: selectedAccount.firm,
              exchange: selectedAccount.exchange,
              server: selectedAccount.server,
              status: selectedAccount.status,
              totalPL: selectedAccount.totalPL,
              startingBalance: selectedAccount.startingBalance,
            } : undefined}
            metricsData={metricsData}
            lossRate={lossRate}
            onArchivePress={handleArchivePress}
            onAccountSelect={handleAccountSelect}
          />
        )}


        <ArchiveAccountModal
          open={archiveModalVisible}  // Changed from 'visible' to 'open'
          onOpenChange={setArchiveModalVisible}  // Changed from 'onClose' to 'onOpenChange'
          onArchive={handleArchiveAccount}
        />

      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Menu;