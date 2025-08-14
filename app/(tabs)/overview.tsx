import { Text, SafeAreaView, Alert, View, TouchableOpacity, Image, StyleSheet, ScrollView, Platform } from 'react-native'
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/clerk-expo'
import { SignedIn } from '@clerk/clerk-react';
import images from '@/constants/images';
import { LinearGradient } from "expo-linear-gradient";
import SelectableButton from '@/components/SelectableButton';
import NoPropFirmAccounts from '@/components/NoPropFirmAccounts';
import NoBrokerAccount from '@/components/NoBrokerAccount';
import Header from '@/components/Header/header';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import { getDateRangeFromTimeframe, timeframes } from '@/components/timeframe-selector';
import { AccountTypeEnum } from '@/constants/enums';
import { useFetchAccountsOverviewDetails, useGetBrokerAccounts, useGetPropFirmAccounts } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import AccountSelectorBottomSheet, { AccountSelectorRef } from '@/components/SelectAccountBottomSheet'
import AccountBalanceCard from '@/components/overview/AccountBalanceCard';
import { WinLossStats } from '@/components/overview/WinLossStats';
import AdditionalStats from '@/components/overview/AdditionalStats';
import { testNewWebSocketAuth } from '@/hooks/test';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import BrokerBottomSheet from '@/components/overview/BrokerBottomSheet';
import AccountBottomSheet from '@/components/AccountBottomSheet';
import { useGetMetrics } from '@/api/hooks/metrics';

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

const calculateWinLossStats = (metrics: any) => {
  if (!metrics) {
    return {
      winPercentage: 0,
      lossPercentage: 0,
      winAmount: 0,
      lossAmount: 0
    }
  }

  const totalTrades = metrics.total_trades || 0;
  const winningTrades = metrics.winning_trades || 0;
  const losingTrades = metrics.losing_trades || 0;

  const winPercentage = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const lossPercentage = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;

  const winAmount = metrics.average_profit || 0;
  const lossAmount = Math.abs(metrics.average_loss || 0);

  return {
    winPercentage,
    lossPercentage,
    winAmount,
    lossAmount
  }

}

const Overview = () => {
  const { user } = useUser();
  const bottomSheetRef = useRef<AccountSelectorRef>(null);

  // ✅ FIXED: Keep account type as string, separate from selected account data
  const [selectedAccountType, setSelectedAccountType] = useState<'evaluation' | 'funded' | 'live' | 'demo'>('evaluation');
  const [selectedSubAccount, setSelectedSubAccount] = useState<'evaluation' | 'funded'>('evaluation');
  const [selectedAccountTypeCategory, setSelectedAccountTypeCategory] = useState<'propFirm' | 'brokerage' | 'practice'>('propFirm');

  // ✅ FIXED: Separate state for bottom sheet account data
  const [bottomSheetAccountData, setBottomSheetAccountData] = useState<any>(null);

  const overviewAccountBottomSheetRef = useRef<BottomSheetModal>(null);
  const overviewBrokerBottomSheetRef = useRef<BottomSheetModal>(null);

  const [loading, setLoading] = useState<boolean>(true);

  // 🔄 Sync selectedAccountTypeCategory when selectedAccountType changes
  useEffect(() => {
    if (selectedAccountType === 'evaluation' || selectedAccountType === 'funded') {
      setSelectedAccountTypeCategory('propFirm');
    } else if (selectedAccountType === 'live') {
      setSelectedAccountTypeCategory('brokerage');
    } else if (selectedAccountType === 'demo') {
      setSelectedAccountTypeCategory('practice');
    }
  }, [selectedAccountType]);

  // 📡 Fetch accounts based on selected type
  const {
    data: propFirmAccountsData,
    isLoading: propFirmAccountsLoading,
    error: propFirmAccountsError,
    refetch: refetchPropFirmAccounts
  } = useGetPropFirmAccounts({
    enabled: selectedAccountTypeCategory === 'propFirm',
  });

  const {
    data: brokerAccountsData,
    isLoading: brokerAccountsLoading,
    error: brokerAccountsError,
    refetch: refetchBrokerAccounts
  } = useGetBrokerAccounts();

  // ⚙️ Process prop firm accounts like in Menu.tsx
  const processedPropFirmAccounts = useMemo(() => {
    if (!propFirmAccountsData?.prop_firm_accounts) return { evaluation: [], funded: [] };

    const processedAccounts = propFirmAccountsData.prop_firm_accounts.map((account: any) => {
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

    return {
      evaluation: processedAccounts.filter(acc => acc.type === 'Challenge'),
      funded: processedAccounts.filter(acc => acc.type === 'Funded')
    };
  }, [propFirmAccountsData]);

  // Check if there are any prop firm accounts
  const hasPropFirmAccounts = useMemo(() => {
    return processedPropFirmAccounts.evaluation.length > 0 || processedPropFirmAccounts.funded.length > 0;
  }, [processedPropFirmAccounts]);

  // ✅ FIXED: Get account data based on string account type, not object
  const getAccountData = (type: string) => {
    if (type === 'evaluation') return processedPropFirmAccounts.evaluation?.[0] ?? {};
    if (type === 'funded') return processedPropFirmAccounts.funded?.[0] ?? {};
    if (type === 'live') return brokerAccountsData?.live?.[0] ?? {};
    if (type === 'demo') return brokerAccountsData?.demo?.[0] ?? {};
    return {};
  };

  const currentAccountData = getAccountData(selectedAccountType);

  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError
  } = useGetMetrics(
    currentAccountData?.id || 0,
    {
      enabled: Boolean(currentAccountData?.id)
    }
  )

  const winLossStats = useMemo(() => {
    return calculateWinLossStats(metricsData);
  }, [metricsData]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => Alert.alert("Signed out successfully!") }
    ]);
  };

  // ✅ FIXED: Handle account selection properly
  const handleAccountSelect = (accountId: string) => {
    console.log('[Overview] Account selected:', accountId);
    setSelectedAccountType(accountId as 'evaluation' | 'funded' | 'live' | 'demo');
    if (accountId === 'evaluation' || accountId === 'funded') {
      setSelectedSubAccount(accountId as 'evaluation' | 'funded');
    }
  };

  const openAccountSelector = () => {
    bottomSheetRef.current?.expand();
  };

  const getAccountDisplayInfo = () => {
    switch (selectedAccountType) {
      case 'evaluation':
      case 'funded':
        return {
          title: 'Prop Firm Accounts',
          showSubButtons: true,
          subButtons: [
            { id: 'evaluation', text: 'Evaluation' },
            { id: 'funded', text: 'Funded' }
          ]
        };
      case 'live':
        return {
          title: 'Brokerage Account',
          showSubButtons: false,
          subButtons: []
        };
      case 'demo':
        return {
          title: 'Practice Account',
          showSubButtons: false,
          subButtons: []
        };
      default:
        return {
          title: 'Prop Firm Accounts',
          showSubButtons: true,
          subButtons: [
            { id: 'evaluation', text: 'Evaluation' },
            { id: 'funded', text: 'Funded' }
          ]
        };
    }
  };

  const accountDisplayInfo = getAccountDisplayInfo();

  // ✅ FIXED: Handle account press for bottom sheet
  const handleOverviewAccountPress = useCallback((account: any) => {
    console.log('[Overview] Account pressed for trading:', account.id, account.name, account.type);

    // Set the account data for the bottom sheet WITHOUT changing selectedAccountType
    setBottomSheetAccountData({
      ...account,
      type: account.type || selectedAccountType
    });

    // Open the appropriate bottom sheet based on account type
    if (account.type === 'Challenge' || account.type === 'Funded') {
      overviewAccountBottomSheetRef.current?.present();
    } else if (account.type === 'Live' || account.type === 'Demo') {
      overviewBrokerBottomSheetRef.current?.present();
    }
  }, [selectedAccountType]); // Remove selectedAccount from dependency

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const authTests = testNewWebSocketAuth();
  authTests.testWebSocketTokenFlow()
    .then(() => console.log('🎉 New auth system works!'))
    .catch(error => console.error('❌ Still issues:', error));

  // Render the "No Accounts" content for prop firm accounts
  const renderNoPropFirmAccountsContent = () => {
    return (
      <View className='flex-1 justify-center items-center px-6 py-10'>
        <View className='mb-4'>
          <Image
            source={images.results}
            className='w-38 h-38'
            resizeMode='contain'
          />
        </View>
        <Text className='text-white text-2xl font-Inter text-center mb-2'>
          No Prop Firm Accounts
        </Text>
        <Text className='text-gray-400 text-base text-center mb-6 font-Inter'>
          You don't have any prop firm accounts yet. Please add a new account in order to start trading.
        </Text>

        <LinearGradient
          colors={['#9061F919', '#E7469419']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='rounded-lg p-4 mb-6'
          style={{ borderRadius: 8 }}
        >
          <Text className='text-white text-sm text-center font-Inter'>
            Please note that adding new accounts is only available on the desktop version.
            To create a new account, please use the desktop application.
          </Text>
        </LinearGradient>
      </View>
    );
  };

  // ✅ FIXED: Determine what content to show based on current state
  const shouldShowAccountCards = () => {
    if (selectedAccountType === 'evaluation' || selectedAccountType === 'funded') {
      return hasPropFirmAccounts && !propFirmAccountsLoading && !propFirmAccountsError;
    } else if (selectedAccountType === 'live' || selectedAccountType === 'demo') {
      return brokerAccountsData && !brokerAccountsLoading && !brokerAccountsError;
    }
    return false;
  };

  const shouldShowNoAccountsMessage = () => {
    if (selectedAccountType === 'evaluation' || selectedAccountType === 'funded') {
      return !hasPropFirmAccounts && !propFirmAccountsLoading && !propFirmAccountsError;
    }
    return false;
  };

  return (
    <SafeAreaView className='bg-[#100E0F] h-full'
      style={{
        flex: 1,
        backgroundColor: '#100E0F'
      }}
      edges={Platform.OS === 'ios' ? ['bottom'] : []}
    >
      <ScrollView>
        <Header onSignOut={handleSignOut} />

        {/* Account Selector Header */}
        <View className='px-6 pb-2'>
          <View className='flex-row items-center justify-between mt-3'>
            <TouchableOpacity onPress={openAccountSelector} className='flex-row items-center'>
              <Text className='text-white text-lg font-Inter mr-2'>
                {accountDisplayInfo.title}
              </Text>
              <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>

            {accountDisplayInfo.showSubButtons && (
              <View className='flex-row'>
                {accountDisplayInfo.subButtons.map((button, index) => (
                  <TouchableOpacity
                    key={button.id}
                    onPress={() => setSelectedSubAccount(button.id as 'evaluation' | 'funded')}
                    className={`py-3 px-5 rounded-lg border items-center justify-center ${selectedSubAccount === button.id
                      ? 'border-[#e74694]'
                      : 'bg-propfirmone-300 border border-[#4F494C]'
                      } ${index < accountDisplayInfo.subButtons.length - 1 ? 'mr-3' : ''}
                      `}
                  >
                    <Text className='text-white text-sm font-medium'>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ✅ FIXED: Simplified conditional rendering */}
        {shouldShowNoAccountsMessage() && renderNoPropFirmAccountsContent()}

        {shouldShowAccountCards() && (
          <>
            <AccountBalanceCard
              accountType={selectedAccountType}
              balance={currentAccountData.balance}
              totalPL={currentAccountData.totalPL}
              totalPLPercentage={currentAccountData.changePercentage}
              dailyPL={currentAccountData.dailyPL}
              dailyPLPercentage={currentAccountData.dailyPLPercentage}
            />

            {/* <WinLossStats
              winPercentage={33.32}
              lossPercentage={64.68}
              winAmount={129}
              lossAmount={29.85}
            /> */}
            <WinLossStats
              winPercentage={winLossStats.winPercentage}
              lossPercentage={winLossStats.lossPercentage}
              winAmount={winLossStats.winAmount}
              lossAmount={winLossStats.lossAmount}
            />

            <AdditionalStats
              winRate={currentAccountData.winRate}
              profitFactor={currentAccountData.profitFactor}
            />
          </>
        )}

        {/* Account Lists */}
        {(selectedAccountType === 'evaluation' || selectedAccountType === 'funded') && hasPropFirmAccounts && (
          <View className='flex-1'>
            <NoPropFirmAccounts
              showSearchBar={false}
              presetActiveTab={selectedAccountType === 'evaluation' ? 'Challenge' : 'Funded'}
              hideTabBar={true}
              accountData={{
                evaluation: processedPropFirmAccounts.evaluation,
                funded: processedPropFirmAccounts.funded,
              }}
              isLoading={propFirmAccountsLoading}
              error={propFirmAccountsError}
              onAccountPress={handleOverviewAccountPress}
              onRefresh={refetchPropFirmAccounts}
            />
          </View>
        )}

        {selectedAccountType === 'live' && (
          <View className='flex-1'>
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Live"
              hideTabBar={true}
              brokerAccountsData={brokerAccountsData}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
              onAccountPress={handleOverviewAccountPress}
            />
          </View>
        )}

        {selectedAccountType === 'demo' && (
          <View className='flex-1'>
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Demo"
              hideTabBar={true}
              brokerAccountsData={brokerAccountsData}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
              onAccountPress={handleOverviewAccountPress}
            />
          </View>
        )}
      </ScrollView>

      <AccountSelectorBottomSheet
        ref={bottomSheetRef}
        onAccountSelect={handleAccountSelect}
        selectedAccountId={selectedAccountType}
      />

      {/* ✅ FIXED: Use bottomSheetAccountData instead of selectedAccount */}
      <AccountBottomSheet
        bottomSheetRef={overviewAccountBottomSheetRef}
        context="overview"
        onAccountSelect={handleAccountSelect}
        accountData={bottomSheetAccountData && (bottomSheetAccountData.type === 'Challenge' || bottomSheetAccountData.type === 'Funded') ? {
          id: bottomSheetAccountData.id,
          name: bottomSheetAccountData.name,
          balance: typeof bottomSheetAccountData.balance === 'string'
            ? bottomSheetAccountData.balance
            : `${bottomSheetAccountData.currency || 'USD'} ${bottomSheetAccountData.balance.toLocaleString()}`,
          dailyPL: typeof bottomSheetAccountData.dailyPL === 'string'
            ? bottomSheetAccountData.dailyPL
            : `${bottomSheetAccountData.dailyPL >= 0 ? '+' : ''}${bottomSheetAccountData.currency || 'USD'} ${Math.abs(bottomSheetAccountData.dailyPL).toLocaleString()}`,
          changePercentage: typeof bottomSheetAccountData.changePercentage === 'string'
            ? bottomSheetAccountData.changePercentage
            : `${bottomSheetAccountData.changePercentage >= 0 ? '+' : ''}${bottomSheetAccountData.changePercentage.toFixed(2)}%`,
          type: bottomSheetAccountData.type as 'Challenge' | 'Funded',
          currency: bottomSheetAccountData.currency,
          firm: bottomSheetAccountData.firm,
          program: bottomSheetAccountData.program,
          totalPL: bottomSheetAccountData.totalPL,
          netPL: bottomSheetAccountData.netPL,
          startingBalance: bottomSheetAccountData.startingBalance,
          maxTotalDD: bottomSheetAccountData.maxTotalDD,
          profitTarget: bottomSheetAccountData.profitTarget,
          originalData: bottomSheetAccountData.originalData,
        } : undefined}
      />

      <BrokerBottomSheet
        bottomSheetRef={overviewBrokerBottomSheetRef}
        context="overview"
        accountData={bottomSheetAccountData && (bottomSheetAccountData.type === 'Live' || bottomSheetAccountData.type === 'Demo') ? {
          id: bottomSheetAccountData.id,
          name: bottomSheetAccountData.name,
          balance: `${bottomSheetAccountData.currency || 'USD'} ${bottomSheetAccountData.balance.toLocaleString()}`,
          dailyPL: `${bottomSheetAccountData.dailyPL >= 0 ? '+' : ''}${bottomSheetAccountData.currency || 'USD'} ${Math.abs(bottomSheetAccountData.dailyPL).toLocaleString()}`,
          changePercentage: `${bottomSheetAccountData.changePercentage >= 0 ? '+' : ''}${bottomSheetAccountData.changePercentage.toFixed(2)}%`,
          type: bottomSheetAccountData.type,
          originalData: bottomSheetAccountData.originalData,
          currency: bottomSheetAccountData.currency,
          firm: bottomSheetAccountData.firm,
          exchange: bottomSheetAccountData.exchange,
          server: bottomSheetAccountData.server,
          status: bottomSheetAccountData.status,
          totalPL: bottomSheetAccountData.totalPL,
          startingBalance: bottomSheetAccountData.startingBalance,
        } : undefined}
      />

    </SafeAreaView>
  );
};

export default Overview