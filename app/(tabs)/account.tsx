import { View, Text, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Image } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { router, useParams } from 'expo-router';
import Header from '@/components/Header/header';
import images from '@/constants/images';
import { DashboardHeaderMobile } from '@/components/DashboardHeader';
import { useAccounts } from '@/providers/accounts';
import { useGetAccountDetails } from '@/api/hooks/account-details';
import { useGetMetrics } from '@/api/hooks/metrics';
import { AccountTypeEnum } from '@/shared/enums';
import { AccountMetrics } from '@/components/AccountMetrics';
import { AccountInfo } from '@/components/AccountInfo';
import AccountScreenChart from '@/components/AccountScreenChart';

export enum DashboardAccountType {
  PROP_FIRM = 'propfirm',
  OWN_BROKER = 'ownbroker',
}

const Account = () => {

  const {
    selectedAccountId,
    setSelectedPreviewAccountId,
    selectedPreviewAccountId
  } = useAccounts();

  const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;

  const { data: accountDetails } = useGetAccountDetails(currentAccountId);

  const [dashboardAccountType, setDashboardAccountType] =
    useState<DashboardAccountType | null>(null);

  const { data: metricsData } = useGetMetrics(currentAccountId);

  console.log('metricsData', metricsData)

  console.log('Account Screen - Current Account ID:', currentAccountId);
  console.log('Account Screen - Selected ID:', selectedAccountId);
  console.log('Account Screen - Preview ID:', selectedPreviewAccountId);
  console.log('Account Screen - Fetched accountDetails:', accountDetails);
  console.log('Account Screen - Account Balance:', accountDetails?.balance);

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

  const closedProfitLoss = useMemo(() => {
    if (!metricsData) {
      return 0;
    }

    return metricsData.trades_summary.reduce((acc, trade) => {
      return acc + trade.pl - trade.fees * -1;
    }, 0);
  }, [metricsData]);

  // Show no data state
  if (!accountDetails || !metricsData) {
    return (
      <SafeAreaView className='bg-[#100E0F] h-full'>
        <Header />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 text-lg">No account data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='bg-[#100E0F] h-full'>
      <ScrollView>
        <Header />

        {/* Dashboard Header with Account Details */}
        <DashboardHeaderMobile accountDetails={accountDetails} />

        {/* Account Performance Chart */}
        <AccountScreenChart
          metricsData={metricsData}
          dashboardAccountType={dashboardAccountType}
          startingBalance={metricsData.starting_balance ?? 0}
          profitTarget={metricsData.profit_target ?? 0}
          maxTotalDd={metricsData.max_total_dd ?? 0}
        />
        {/* <AccountScreenChart/> */}

        {/* Account Metrics */}
        <AccountMetrics
          dashboardAccountType={dashboardAccountType}
          accountMaxDailyLoss={accountDetails.max_daily_loss ?? 0}
          maxDrawdown={metricsData.max_total_dd ?? 0}
          profitTarget={metricsData.profit_target ?? 0}
          dailyPL={metricsData.daily_pl ?? 0}
          totalPL={closedProfitLoss}
          netPl={metricsData.net_pl ?? 0}
          winRate={metricsData.win_rate ?? 0}
          averageProfit={metricsData.average_profit ?? 0}
          averageLoss={metricsData.average_loss ?? 0}
          dailyLoss={dailyLoss}
          maxDailyLoss={maxDailyLoss}
          maxDailyDd={metricsData.max_daily_dd ?? 0}
          startingBalance={metricsData.starting_balance ?? 0}
          totalDd={metricsData.total_dd ?? 0}
          accountType={accountDetails.account_type}
        />

        {/* Account Information */}
        <AccountInfo
          accountDetails={accountDetails}
          metricsData={metricsData}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;