import { View, Text, SafeAreaView, Alert, TouchableOpacity, ScrollView } from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth, useUser } from '@clerk/clerk-expo';

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
import { useArchiveAccountMutation, useFetchAccountTrades, useFetchPropFirmAccountsOverview, useGetBrokerAccounts, useGetCopierAccounts, useGetPropFirmAccounts, useSyncAccountStatus } from '@/api';
import { AccountStatusEnum } from '@/constants/enums';
import { useAccounts } from '@/providers/accounts';
import { useGetMetrics } from '@/api/hooks/metrics';
import { ArchiveAccountModal } from '@/components/ArchiveAccountModal';
import { Redirect, router } from 'expo-router';
import { useErrorLogsCount } from '@/utils/use-error-logs-count';
import { useSyncAllTradesMutation } from '@/api/hooks/trade-service';
import { addErrorLog } from '@/utils/logger';
import { ErrorLogsModal } from '@/components/ErrorsLogModal';
import MenuAccounts from '@/components/MenuAccounts';
import { FileText } from 'lucide-react-native';
import { getAccountRole, organizeAccountsIntoTree } from '@/utils/account-utils';
import AccountTreeView from '@/components/AccountTreeView';

const Menu = () => {
  const { user } = useUser();
  const { isSignedIn, isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

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
  //
  const [categorizationMode, setCategorizationMode] = useState<'type-based' | 'role-based'>('type-based');
  const [accountRoleTab, setAccountRoleTab] = useState<'all' | 'master' | 'copier'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingAccounts, setIsSyncingAccounts] = useState(false);
  const [errorsLogsOpen, setErrorLogsOpen] = useState(false);
  //
  const { data: copierAccounts } = useGetCopierAccounts();
  const errorLogsCount = useErrorLogsCount();
  const { mutateAsync: syncAllTrades } = useSyncAllTradesMutation();
  const { mutateAsync: syncHistory } = useFetchAccountTrades();
  const { mutateAsync: syncAccountStatus } = useSyncAccountStatus();

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

  // console.log('archiveAccountMutation', archiveAccountMutation)

  const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;
  const { data: metricsData } = useGetMetrics(currentAccountId);

  const lossRate = useMemo(() => {
    return 100 - (metricsData?.win_rate ?? 0);
  }, [metricsData?.win_rate]);


  const testMobileErrorLogs = (userId: string) => {
    // Test the same type of log that appears in the web screenshot
    addErrorLog.call(
      { userId },
      'Account Status Sync',
      `Sync completed: Processed 11 accounts.
  Reactivated 0, 2 account(s) require attention.
  
  Accounts requiring attention (2):
  • NewAccount: disconnected - Account status check timed out. Please try again later. Account status check timed out after 15s
  • LiveAcc: disconnected - Account status check timed out. Please try again later. Account status check timed out after 15s`,
      'log'
    );

    console.log('Test log added! Check your mobile badge and modal.');
  };

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

    if (selectedAccountType === 'propFirm') {
      allAccounts = [...processedPropFirmAccounts.evaluation, ...processedPropFirmAccounts.funded];
    } else if (selectedAccountType === 'brokerage') {
      allAccounts = processedBrokerAccounts.live;
    } else if (selectedAccountType === 'practice') {
      allAccounts = processedBrokerAccounts.demo;
    }

    const activeAccounts = allAccounts.filter((account) =>
      account.status === AccountStatusEnum.ACTIVE
    );

    let searchFiltered = activeAccounts.filter((account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toString().includes(searchTerm) ||
      (account.currency && account.currency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (account.firm && account.firm.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply role-based filtering
    if (categorizationMode === 'role-based' && copierAccounts) {
      searchFiltered = searchFiltered.filter((account) => {
        if (accountRoleTab === 'all') {
          return true;
        }

        const accountRole = getAccountRole(account.id, copierAccounts);

        if (accountRoleTab === 'master') {
          return accountRole === 'master';
        } else if (accountRoleTab === 'copier') {
          return accountRole === 'copier';
        }

        return false;
      });
    }

    return searchFiltered;
  }, [
    selectedAccountType,
    processedPropFirmAccounts,
    processedBrokerAccounts,
    searchTerm,
    categorizationMode,
    accountRoleTab,
    copierAccounts
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

  const handleSyncTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const [response, historyResponse] = await Promise.all([
        syncAllTrades(),
        syncHistory({
          account: selectedPreviewAccountId ?? selectedAccountId
        }),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
      if (historyResponse.status === 'success' && response.status === 'success') {
        Alert.alert('Success', response.message);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      if (error instanceof Error && 'httpStatus' in error && error.httpStatus === 429) {
        Alert.alert('Sync in progress', 'Account synchronization is already in progress. Please wait a moment and try again.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, selectedPreviewAccountId, syncHistory, syncAllTrades]);

  const handleSyncAccounts = useCallback(async () => {
    setIsSyncingAccounts(true);

    try {
      const response = await syncAccountStatus();

      if (response.accounts && response.accounts.length > 0) {
        const problemAccounts = response.accounts.filter(
          (acc) => acc.result === 'error' || acc.current_status === 'disconnected'
        );

        const reactivatedAccounts = response.accounts.filter(
          (acc) => acc.result === 'reactivated',
        );

        const logTitle = 'Manual Account Status Sync';
        let logDescription = `Sync completed: ${response.message}`;

        if (reactivatedAccounts.length > 0) {
          logDescription += `\n\nReactivated accounts (${reactivatedAccounts.length}):\n`;
          reactivatedAccounts.forEach((acc) => {
            logDescription += `• ${acc.account_name}: ${acc.message}\n`;
          });
        }

        if (problemAccounts.length > 0) {
          logDescription += `\n\nAccounts requiring attention (${problemAccounts.length}):\n`;
          problemAccounts.forEach((acc) => {
            logDescription += `• ${acc.account_name}: ${acc.message}\n`;
          });
        }

        const activeAccounts = response.accounts.filter(
          (acc) => acc.current_status === 'active' && acc.result !== 'error',
        );

        if (activeAccounts.length > 0) {
          logDescription += `\n\nActive accounts (${activeAccounts.length}):\n`;
          activeAccounts.forEach((acc) => {
            logDescription += `• ${acc.account_name}\n`;
          });
        }

        if (user?.id) {
          addErrorLog.call({ userId: user.id }, logTitle, logDescription, 'log');
        }
      }

      if (response.status === 'success' || response.status === 'partial_success') {
        const reactivatedCount = response.accounts.filter(
          (acc) => acc.result === 'reactivated',
        ).length;
        const errorCount = response.accounts.filter(
          (acc) => acc.result === 'error',
        ).length;

        let description = response.message;
        if (reactivatedCount > 0) {
          description += ` ${reactivatedCount} account(s) reactivated.`;
        }
        if (errorCount > 0) {
          description += ` ${errorCount} account(s) had errors.`;
        }

        Alert.alert(
          response.status === 'success' ? 'Accounts synced successfully' : 'Accounts partially synced',
          description
        );
      } else {
        Alert.alert('Error', 'Error syncing accounts');
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'httpStatus' in error && error.httpStatus === 429) {
        Alert.alert('Sync in progress', 'Account synchronization is already in progress. Please wait a moment and try again.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSyncingAccounts(false);
    }
  }, [syncAccountStatus, user?.id]);

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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            // index.tsx will automatically redirect to login
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        }
      }
    ]);
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

  //  Handle search (like web teammate's logic)
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  // Render account content based on selected account type
  const renderAccountContent = () => {
    if (categorizationMode === 'role-based') {
      // For role-based categorization, use tree structure when showing "All"
      if (accountRoleTab === 'all') {
        const treeData = organizeAccountsIntoTree(
          filteredActiveAccounts,
          copierAccounts
        );

        return (
          <ScrollView
            className='flex-1'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <AccountTreeView
              treeData={treeData}
              onAccountPress={handleAccountPress}
              currentAccountId={selectedAccountId}
              onArchivePress={handleArchivePress}
              context='menu'
            />
          </ScrollView>
        );
      } else {
        // For Master/Copier tabs, show flat list
        return (
          <ScrollView
            className='flex-1'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <MenuAccounts
              accounts={filteredActiveAccounts}
              onAccountPress={handleAccountPress}
              accountType="propFirm"
              activeTab="All"
              currentAccountId={selectedAccountId}
              onArchivePress={handleArchivePress}
              context='menu'
            />
          </ScrollView>
        );
      }
    }


    // For type-based categorization, use the existing logic
    switch (selectedAccountType) {
      case 'propFirm':
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}
            hideTabBar={false}
            accountData={finalAccountsToShow}
            isLoading={propFirmAccountsLoading}
            error={propFirmAccountsError}
            onAccountPress={handleAccountPress}
            onRefresh={refetchPropFirmAccounts}
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

          <View className="px-3 py-2">
            <View className="flex-row justify-start space-x-2">
              <TouchableOpacity
                className={`py-3 px-4 rounded-lg bg-transparent border items-center justify-center ${categorizationMode === 'type-based' ? 'border-primary-100' : 'border-gray-700'
                  }`}
                onPress={() => {
                  setCategorizationMode('type-based');
                  setAccountRoleTab('all');
                }}
              >
                <Text className="text-white font-Inter text-sm">
                  By Type
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`py-3 px-4 ml-2 rounded-lg bg-transparent border items-center justify-center ${categorizationMode === 'role-based' ? 'border-primary-100' : 'border-gray-700'
                  }`}
                onPress={() => {
                  setCategorizationMode('role-based');
                  setSelectedAccountType('propFirm');
                }}
              >
                <Text className="text-white font-Inter text-sm">
                  By Role
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic Tab Section */}
          {categorizationMode === 'role-based' ? (
            <View className="flex-row px-3 py-2 space-x-2">
              <SelectableButton
                text="All"
                isSelected={accountRoleTab === 'all'}
                selectedBorderColor="border-primary-100"
                unselectedBorderColor="border-gray-700"
                onPress={() => setAccountRoleTab('all')}
                additionalStyles="flex-1"
              />
              <SelectableButton
                text="Master"
                isSelected={accountRoleTab === 'master'}
                selectedBorderColor="border-primary-100"
                unselectedBorderColor="border-gray-700"
                onPress={() => setAccountRoleTab('master')}
                additionalStyles="flex-1 mx-2"
              />
              <SelectableButton
                text="Copier"
                isSelected={accountRoleTab === 'copier'}
                selectedBorderColor="border-primary-100"
                unselectedBorderColor="border-gray-700"
                onPress={() => setAccountRoleTab('copier')}
                additionalStyles="flex-1"
              />
            </View>
          ) : (
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
          )}

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

        <View className="px-4 py-2 space-y-2">
          {/* Logs & Errors Button */}
          <TouchableOpacity
            className="bg-transparent p-2 mb-2 rounded-lg flex-row items-center justify-between border border-gray-700"
            onPress={() => setErrorLogsOpen(true)}
          >
            <View className="flex-row items-center">
              <FileText size={14} color={'#fff'} />
              <Text className="text-white text-sm font-Inter ml-3">Logs & Errors</Text>
            </View>
            {errorLogsCount > 0 && (
              <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                <Text className="text-white text-xs font-medium">
                  {errorLogsCount > 99 ? '99+' : errorLogsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-500 p-2 rounded-lg"
            onPress={() => user?.id && testMobileErrorLogs(user.id)}
          >
            <Text className="text-white text-center text-sm font-InterMedium">
              🧪 Add Test Log
            </Text>
          </TouchableOpacity>


          {/* Sync Buttons Row */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="flex-1 bg-transparent border border-[#2fb784] p-2 rounded-lg"
              onPress={handleSyncTrades}
              disabled={isLoading}
            >
              <Text className={`text-center text-sm font-InterMedium ${isLoading ? 'text-[#2fb784]' : 'text-[#2fb784]'}`}>
                {isLoading ? 'Syncing...' : 'Sync All Trades'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-transparent border border-[#2fb784] p-2 ml-2 rounded-lg"
              onPress={handleSyncAccounts}
              disabled={isSyncingAccounts}
            >
              <Text className={`text-center text-sm font-InterMedium ${isSyncingAccounts ? 'text-[#2fb784]' : 'text-[#2fb784]'}`}>
                {isSyncingAccounts ? 'Syncing...' : 'Sync All Accounts'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        <ErrorLogsModal
          open={errorsLogsOpen}
          onOpenChange={setErrorLogsOpen}
        />

      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Menu;