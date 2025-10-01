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
import { useAccounts } from '@/providers/accounts';
import { useGetAccountDetails } from '@/api/hooks/account-details';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { OverviewAccountType, overviewAccountTypeAtom, overviewSelectedTabAtom } from '@/atoms/overview-atoms';
import { AccountStatusEnum } from '@/shared/enums';

export enum DashboardAccountType {
  PROP_FIRM = 'propfirm',
  OWN_BROKER = 'ownbroker',
}

const Overview = () => {
  const { user } = useUser();
  const bottomSheetRef = useRef<AccountSelectorRef>(null);

  const [selectedAccountType, setSelectedAccountType] = useAtom(overviewSelectedTabAtom);
  const setOverviewAccountType = useSetAtom(overviewAccountTypeAtom);
  const overviewAccountType = useAtomValue(overviewAccountTypeAtom);
  const [selectedSubAccount, setSelectedSubAccount] = useState<'evaluation' | 'funded'>('evaluation');
  const [selectedAccountTypeCategory, setSelectedAccountTypeCategory] = useState<'propfirm' | 'brokerage' | 'practice'>('propfirm');

  const [bottomSheetAccountData, setBottomSheetAccountData] = useState<any>(null);

  const overviewAccountBottomSheetRef = useRef<BottomSheetModal>(null);
  const overviewBrokerBottomSheetRef = useRef<BottomSheetModal>(null);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (selectedAccountType === AccountTypeEnum.EVALUATION ||
      selectedAccountType === AccountTypeEnum.FUNDED) {
      setOverviewAccountType(OverviewAccountType.PROPFIRM);
    } else if (selectedAccountType === AccountTypeEnum.LIVE ||
      selectedAccountType === AccountTypeEnum.DEMO) {
      setOverviewAccountType(OverviewAccountType.OWNBROKER);
    }
  }, [selectedAccountType, setOverviewAccountType]);

  const {
    data: propFirmAccountsData,
    isLoading: propFirmAccountsLoading,
    error: propFirmAccountsError,
    refetch: refetchPropFirmAccounts
  } = useGetPropFirmAccounts({
    // enabled: overviewAccountType === OverviewAccountType.PROPFIRM,
    // enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: brokerAccountsData,
    isLoading: brokerAccountsLoading,
    error: brokerAccountsError,
    refetch: refetchBrokerAccounts
  } = useGetBrokerAccounts({
    // enabled: overviewAccountType === OverviewAccountType.OWNBROKER,
    // enabled: true,
    staleTime: 5 * 60 * 1000,

  });

  const {
    selectedAccountId,
    setSelectedPreviewAccountId,
    selectedPreviewAccountId
  } = useAccounts();

  const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;

  const { data: accountDetails } = useGetAccountDetails(currentAccountId);
  const { data: metricsData, refetch: refetchMetrics, isLoading: metricsLoading } = useGetMetrics(currentAccountId, {
    enabled: Boolean(currentAccountId && currentAccountId > 0),
    staleTime: 0,
    gcTime: 0,
  });

  const [dashboardAccountType, setDashboardAccountType] =
    useState<DashboardAccountType | null>(null);

  const dailyLoss = useMemo(() => {
    const starting_day_balance =
      (metricsData?.starting_balance ?? 0) - (metricsData?.daily_pl ?? 0);
    return (metricsData?.daily_pl ?? 0) > 0
      ? 0
      : ((metricsData?.daily_pl ?? 0) / starting_day_balance) * 100;
  }, [metricsData?.daily_pl, metricsData?.starting_balance]);

  const maxDailyLoss = useMemo(() => {
    const maxDailyLossInUnits =
      ((metricsData?.max_daily_dd ?? 0) / 100) *
      (metricsData?.starting_balance ?? 0);
    return Number(maxDailyLossInUnits.toFixed(2));
  }, [metricsData?.max_daily_dd, metricsData?.starting_balance]);

  const closedProfitLoss = useMemo(() => {
    if (!metricsData) {
      return 0;
    }

    return metricsData.trades_summary.reduce((acc, trade) => {
      return acc + trade.pl - trade.fees * -1;
    }, 0);
  }, [metricsData]);

  // Add AccountMetrics calculations (same as in AccountMetrics.tsx):
  const maxDrawdownInUnits = useMemo(() => {
    return ((metricsData?.max_total_dd ?? 0) / 100) * (metricsData?.starting_balance ?? 0);
  }, [metricsData?.max_total_dd, metricsData?.starting_balance]);

  const profitTargetInUnits = useMemo(() => {
    const profitTarget = metricsData?.profit_target ?? 0;
    return ((profitTarget > 0 ? profitTarget : 15) / 100) * (metricsData?.starting_balance ?? 0);
  }, [metricsData?.profit_target, metricsData?.starting_balance]);

  const netPlInUnits = useMemo(() => {
    let result = ((metricsData?.net_pl ?? 0) / 100) * (metricsData?.starting_balance ?? 0);

    if (result === 0) {
      return result;
    }

    if (result > 0) {
      result = Math.min(result, profitTargetInUnits);
    } else {
      result = Math.max(result, -maxDrawdownInUnits);
    }
    return result;
  }, [maxDrawdownInUnits, metricsData?.net_pl, profitTargetInUnits, metricsData?.starting_balance]);

  const convertedDailyLoss = useMemo(() => {
    const dailyPL = metricsData?.daily_pl ?? 0;
    const dailyLossCalc =
      ((dailyPL < 0 ? dailyPL : 0) / Number(maxDailyLoss)) * 100 * -1;

    return dailyLossCalc <= 100 ? dailyLossCalc : 100;
  }, [metricsData?.daily_pl, maxDailyLoss]);

  // Win/Loss rate calculations
  const lossRate = useMemo(() => {
    return 100 - (metricsData?.win_rate ?? 0);
  }, [metricsData?.win_rate]);

  // Calculate daily PL percentage
  const dailyPLPercentage = useMemo(() => {
    if (!metricsData?.starting_balance || metricsData.starting_balance === 0) return 0;
    return ((metricsData?.daily_pl ?? 0) / metricsData.starting_balance) * 100;
  }, [metricsData?.daily_pl, metricsData?.starting_balance]);

  // Calculate total PL percentage
  const totalPLPercentage = useMemo(() => {
    if (!metricsData?.starting_balance || metricsData.starting_balance === 0) return 0;
    return (closedProfitLoss / metricsData.starting_balance) * 100;
  }, [closedProfitLoss, metricsData?.starting_balance]);

  useEffect(() => {
    if (!accountDetails?.account_type) {
      return;
    }

    if (
      [AccountTypeEnum.DEMO, AccountTypeEnum.LIVE].includes(
        accountDetails?.account_type,
      )
    ) {
      setDashboardAccountType(DashboardAccountType.OWN_BROKER);
    }

    if (
      [
        AccountTypeEnum.EVALUATION,
        AccountTypeEnum.FUNDED,
        AccountTypeEnum.COMPETITION,
      ].includes(accountDetails?.account_type)
    ) {
      setDashboardAccountType(DashboardAccountType.PROP_FIRM);
    }
  }, [accountDetails]);

  const getBrokerMetricsData = useCallback(() => {
    if (bottomSheetAccountData?.originalData?.id && bottomSheetAccountData.originalData.id === currentAccountId) {
      return metricsData;
    }
    return null;
  }, [bottomSheetAccountData?.originalData?.id, currentAccountId, metricsData]);

  const getBrokerTotalPL = useCallback(() => {
    const brokerMetrics = getBrokerMetricsData();
    if (!brokerMetrics) return 0;

    return brokerMetrics.trades_summary?.reduce((acc, trade) => {
      return acc + trade.pl - trade.fees * -1;
    }, 0) || 0;
  }, [getBrokerMetricsData]);

  useEffect(() => {
    if (selectedAccountType && currentAccountId && currentAccountId > 0) {
      console.log('[Overview] Tab switched to:', selectedAccountType, 'for account:', currentAccountId);

      // Clear preview account when switching tabs
      setSelectedPreviewAccountId(undefined);

      // Refetch metrics for the current account
      const timer = setTimeout(() => {
        refetchMetrics();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedAccountType]);

  useEffect(() => {
    if (currentAccountId && currentAccountId > 0) {
      console.log('[Overview] Account changed to:', currentAccountId);
      const timer = setTimeout(() => {
        refetchMetrics();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentAccountId]);

  const processedPropFirmAccounts = useMemo(() => {
    // ✅ Remove the overviewAccountType check
    if (!propFirmAccountsData?.prop_firm_accounts) {
      return { evaluation: [], funded: [] };
    }

    const processedAccounts = propFirmAccountsData.prop_firm_accounts
      .filter(account => account.status === AccountStatusEnum.ACTIVE)
      .map((account: any) => {
        const totalGainLoss = account.balance - account.starting_balance;
        const totalPerformancePercentage = account.starting_balance > 0
          ? (totalGainLoss / account.starting_balance) * 100
          : 0;

        const isEvaluation = account.account_type === AccountTypeEnum.EVALUATION;
        const isFunded = account.account_type === AccountTypeEnum.FUNDED;

        return {
          id: account.id,
          name: account.name,
          balance: account.balance,
          dailyPL: account.daily_pl,
          changePercentage: totalPerformancePercentage,
          type: isEvaluation ? 'Challenge' : isFunded ? 'Funded' : 'Challenge',
          accountType: account.account_type,
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

    return {
      evaluation: processedAccounts.filter(acc =>
        acc.accountType === AccountTypeEnum.EVALUATION
      ),
      funded: processedAccounts.filter(acc =>
        acc.accountType === AccountTypeEnum.FUNDED
      )
    };
  }, [propFirmAccountsData]); // ✅ Only depend on data, not tab


  // ✅ Same fix for broker accounts
  const processedBrokerAccounts = useMemo(() => {
    // ✅ Remove the overviewAccountType check
    if (!brokerAccountsData?.broker_accounts) {
      return { broker: [], demo: [] };
    }

    const processedAccounts = brokerAccountsData.broker_accounts
      .filter(account => account.status === AccountStatusEnum.ACTIVE)
      .map((account: any) => {
        const totalGainLoss = account.balance - account.starting_balance;
        const totalPerformancePercentage = account.starting_balance > 0
          ? (totalGainLoss / account.starting_balance) * 100
          : 0;

        const isLive = account.account_type === AccountTypeEnum.LIVE ||
          account.account_type === 'broker';
        const isDemo = account.account_type === AccountTypeEnum.DEMO;

        return {
          id: account.id,
          name: account.name,
          balance: account.balance,
          dailyPL: account.daily_pl,
          changePercentage: totalPerformancePercentage,
          type: isLive ? 'Live' : isDemo ? 'Demo' : 'Demo',
          accountType: isLive ? AccountTypeEnum.LIVE : AccountTypeEnum.DEMO,
          currency: account.currency || 'USD',
          firm: account.firm,
          exchange: account.exchange,
          server: account.server,
          status: account.status,
          totalPL: account.total_pl,
          startingBalance: account.starting_balance,
          originalData: account,
        };
      });

    return {
      broker: processedAccounts.filter(acc =>
        acc.accountType === AccountTypeEnum.LIVE
      ),
      demo: processedAccounts.filter(acc =>
        acc.accountType === AccountTypeEnum.DEMO
      )
    };
  }, [brokerAccountsData]);

  // Check if there are any prop firm accounts
  const hasPropFirmAccounts = useMemo(() => {
    return processedPropFirmAccounts.evaluation.length > 0 || processedPropFirmAccounts.funded.length > 0;
  }, [processedPropFirmAccounts]);

  const getAccountData = (type: string) => {
    if (type === 'evaluation') return processedPropFirmAccounts.evaluation?.[0] ?? {};
    if (type === 'funded') return processedPropFirmAccounts.funded?.[0] ?? {};
    if (type === 'broker') return processedBrokerAccounts.broker?.[0] ?? {};
    if (type === 'demo') return processedBrokerAccounts.demo?.[0] ?? {};
    return {};
  };
  const currentAccountData = getAccountData(selectedAccountType);

  // Calculate account counts for tabs
  const accountCounts = useMemo(() => {
    return {
      evaluation: processedPropFirmAccounts.evaluation.length,
      funded: processedPropFirmAccounts.funded.length,
      broker: processedBrokerAccounts.broker.length,
      demo: processedBrokerAccounts.demo.length,
    };
  }, [processedPropFirmAccounts, processedBrokerAccounts]);

  const handleAccountSelect = (accountId: string) => {
    console.log('[Overview] Account selected:', accountId);
    // Convert string to enum if needed
    const enumValue = accountId as AccountTypeEnum;
    setSelectedAccountType(enumValue);
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
      case 'broker':
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

  const handleOverviewAccountPress = useCallback((account: any) => {
    console.log('[Overview] Account pressed for trading:', account.id, account.name, account.type);

    // Set the account data for the bottom sheet
    setBottomSheetAccountData({
      ...account,
      type: account.type || selectedAccountType
    });

    // ADD THIS LINE - Set preview account for ALL account types, not just prop firm
    setSelectedPreviewAccountId(account.id);

    // Open the appropriate bottom sheet based on account type
    if (account.type === 'Challenge' || account.type === 'Funded') {
      overviewAccountBottomSheetRef.current?.present();
    } else if (account.type === 'Live' || account.type === 'Demo') {
      overviewBrokerBottomSheetRef.current?.present();
    }
  }, [selectedAccountType, setSelectedPreviewAccountId]);

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

  useEffect(() => {
    if (selectedAccountType) {
      let firstAccountId: number | undefined;

      switch (selectedAccountType) {
        case AccountTypeEnum.EVALUATION:
          firstAccountId = processedPropFirmAccounts.evaluation[0]?.id;
          break;
        case AccountTypeEnum.FUNDED:
          firstAccountId = processedPropFirmAccounts.funded[0]?.id;
          break;
        case AccountTypeEnum.LIVE:
          firstAccountId = processedBrokerAccounts.broker[0]?.id;
          break;
        case AccountTypeEnum.DEMO:
          firstAccountId = processedBrokerAccounts.demo[0]?.id;
          break;
      }

      // If we have a first account and it's different from current, select it
      if (firstAccountId && firstAccountId !== selectedPreviewAccountId) {
        console.log('[Overview] Auto-selecting first account for tab:', firstAccountId);
        setSelectedPreviewAccountId(firstAccountId);
      }
    }
  }, [selectedAccountType, processedPropFirmAccounts, processedBrokerAccounts]);

  // Render the "No Accounts" content for prop firm accounts
  const renderNoPropFirmAccountsContent = () => {
    const getAccountTypeInfo = () => {
      switch (selectedAccountType) {
        case 'evaluation':
          return { title: 'Evaluation', type: 'evaluation' };
        case 'funded':
          return { title: 'Funded', type: 'funded' };
        case 'broker':
          return { title: 'Live', type: 'broker' };
        case 'demo':
          return { title: 'Demo', type: 'demo' };
        default:
          return { title: 'Evaluation', type: 'evaluation' };
      }
    };

    const accountTypeInfo = getAccountTypeInfo();

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
          No {accountTypeInfo.title} Accounts
        </Text>
        <Text className='text-gray-400 text-base text-center mb-6 font-Inter'>
          You don't have any {accountTypeInfo.type} accounts yet. Please add a new account in order to start trading.
        </Text>

        <LinearGradient
          colors={['#9061F919', '#E7469419']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='rounded-lg p-4 mb-6'
          style={{ borderRadius: 8 }}
        >
          <Text className='text-white text-sm text-center font-Inter p-4'>
            Please note that adding new accounts is only available on the desktop version.
            To create a new account, please use the desktop application.
          </Text>
        </LinearGradient>
      </View>
    );
  };

  const shouldShowAccountCards = () => {
    if (selectedAccountType === 'evaluation') {
      return accountCounts.evaluation > 0 && !propFirmAccountsLoading && !propFirmAccountsError;
    } else if (selectedAccountType === 'funded') {
      return accountCounts.funded > 0 && !propFirmAccountsLoading && !propFirmAccountsError;
    } else if (selectedAccountType === 'broker') {
      return accountCounts.broker > 0 && !brokerAccountsLoading && !brokerAccountsError;
    } else if (selectedAccountType === 'demo') {
      return accountCounts.demo > 0 && !brokerAccountsLoading && !brokerAccountsError;
    }
    return false;
  };

  const shouldShowNoAccountsMessage = () => {
    if (selectedAccountType === 'evaluation') {
      return accountCounts.evaluation === 0 && !propFirmAccountsLoading && !propFirmAccountsError;
    } else if (selectedAccountType === 'funded') {
      return accountCounts.funded === 0 && !propFirmAccountsLoading && !propFirmAccountsError;
    } else if (selectedAccountType === 'broker') {
      return accountCounts.broker === 0 && !brokerAccountsLoading && !brokerAccountsError;
    } else if (selectedAccountType === 'demo') {
      return accountCounts.demo === 0 && !brokerAccountsLoading && !brokerAccountsError;
    }
    return false;
  };

  // Tab component
  const AccountTypeTab = ({
    type,
    label,
    count,
    isSelected,
    onPress
  }: {
    type: AccountTypeEnum;
    label: string;
    count: number;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="items-center py-2 relative px-3" activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <Text className={`text-base font-InterBold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
          {label}
        </Text>
        <Text className={`text-base font-InterBold ml-1 ${count > 0 ? 'text-[#e74694]' : (isSelected ? 'text-white' : 'text-gray-400')}`}>
          {count}
        </Text>
      </View>
      {isSelected && (
        <View
          className="absolute bottom-0 h-0.5 bg-[#e74694] rounded-full"
          style={{ width: '100%' }}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className='bg-[#100E0F] h-full'
      style={{
        flex: 1,
        backgroundColor: '#100E0F'
      }}
      edges={Platform.OS === 'ios' ? ['bottom'] : []}
    >
      <ScrollView>
        <Header />

        {/* Top Account Type Tabs */}
        <View className='py-2'>
          <View className='flex-row items-start'>
            <AccountTypeTab
              type={AccountTypeEnum.EVALUATION}
              label="Evaluation"
              count={accountCounts.evaluation}
              isSelected={selectedAccountType === AccountTypeEnum.EVALUATION}
              onPress={() => handleAccountSelect(AccountTypeEnum.EVALUATION)}
            />
            <AccountTypeTab
              type={AccountTypeEnum.FUNDED}
              label="Funded"
              count={accountCounts.funded}
              isSelected={selectedAccountType === AccountTypeEnum.FUNDED}
              onPress={() => handleAccountSelect(AccountTypeEnum.FUNDED)}
            />
            <AccountTypeTab
              type={AccountTypeEnum.LIVE}
              label="Live"
              count={accountCounts.broker}
              isSelected={selectedAccountType === AccountTypeEnum.LIVE}
              onPress={() => handleAccountSelect(AccountTypeEnum.LIVE)}
            />
            <AccountTypeTab
              type={AccountTypeEnum.DEMO}
              label="Demo"
              count={accountCounts.demo}
              isSelected={selectedAccountType === AccountTypeEnum.DEMO}
              onPress={() => handleAccountSelect(AccountTypeEnum.DEMO)}
            />
          </View>
        </View>

        {/* COMMENTED OUT: Old Account Selector Header */}
        {/* 
        <View className='pr-6 pb-2'>
          <View className='flex-row items-center justify-between mt-3'>
            <TouchableOpacity onPress={openAccountSelector} className='flex-row items-center ml-3 mr-2'>
              <Text className='text-white text-lg font-Inter mr-2'>
                {accountDisplayInfo.title}
              </Text>
              <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>

            {accountDisplayInfo.showSubButtons && accountDisplayInfo.subButtons && accountDisplayInfo.subButtons.length > 0 && (
              <View className='flex-row'>
                {accountDisplayInfo.subButtons.map((button, index) => {
                  if (!button || !button.id || !button.text) {
                    return null;
                  }

                  return (
                    <TouchableOpacity
                      key={button.id}
                      onPress={() => setSelectedSubAccount(button.id as 'evaluation' | 'funded')}
                      className={`py-3 px-5 rounded-lg border items-center justify-center ${selectedSubAccount === button.id
                        ? 'border-[#e74694]'
                        : 'bg-propfirmone-300 border border-[#4F494C]'
                        } ${index < accountDisplayInfo.subButtons.length - 1 ? 'mr-3' : ''}`}
                    >
                      <Text className='text-white text-sm font-medium'>
                        {String(button.text)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
        */}

        {/* ✅ FIXED: Simplified conditional rendering */}
        {shouldShowNoAccountsMessage() && renderNoPropFirmAccountsContent()}

        {shouldShowAccountCards() && (
          <>
            <AccountBalanceCard
              key={`balance-${currentAccountId}-${selectedAccountType}`}
              accountType={selectedAccountType}
              accounts={
                selectedAccountType === 'evaluation'
                  ? processedPropFirmAccounts.evaluation
                  : selectedAccountType === 'funded'
                    ? processedPropFirmAccounts.funded
                    : selectedAccountType === 'broker'
                      ? processedBrokerAccounts.broker
                      : selectedAccountType === 'demo'
                        ? processedBrokerAccounts.demo
                        : []
              }
              totalPL={closedProfitLoss}
              totalPLPercentage={totalPLPercentage}
              dailyPL={metricsData?.daily_pl ?? 0}
              dailyPLPercentage={dailyPLPercentage}
            />

            <WinLossStats
              key={`winloss-${currentAccountId}-${selectedAccountType}-${metricsData?.win_rate}`}
              winPercentage={metricsData?.win_rate ?? 0}
              lossPercentage={lossRate}
              winAmount={Math.abs(metricsData?.average_profit ?? 0)}
              lossAmount={Math.abs(metricsData?.average_loss ?? 0)}
              isLoading={metricsLoading}
            />

            <AdditionalStats
              key={`stats-${currentAccountId}-${selectedAccountType}`}
              metricsData={metricsData}
              isLoading={metricsLoading || !metricsData}
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
              context='overview'
            />
          </View>
        )}

        {selectedAccountType === AccountTypeEnum.LIVE && (
          <View className='flex-1'>
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Live"
              hideTabBar={true}
              brokerAccountsData={{
                broker_accounts: processedBrokerAccounts.broker.map(acc => acc.originalData)
              }}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
              onAccountPress={handleOverviewAccountPress}
              context='overview'
            />
          </View>
        )}

        {selectedAccountType === AccountTypeEnum.DEMO && (
          <View className='flex-1'>
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Demo"
              hideTabBar={true}
              brokerAccountsData={{
                broker_accounts: processedBrokerAccounts.demo.map(acc => acc.originalData)
              }}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
              onAccountPress={handleOverviewAccountPress}
              context='overview'
            />
          </View>
        )}
      </ScrollView>

      <AccountSelectorBottomSheet
        ref={bottomSheetRef}
        onAccountSelect={handleAccountSelect}
        selectedAccountId={selectedAccountType}
      />

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
        metricsData={metricsData}
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
        metricsData={metricsData}
        lossRate={lossRate}
      />

    </SafeAreaView>
  );
};

export default Overview