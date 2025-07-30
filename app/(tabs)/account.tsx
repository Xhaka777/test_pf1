import { View, Text, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Image } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router';
import Header from '@/components/Header/header';
import images from '@/constants/images';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ProfitLossIndicator from '@/components/ProfitLossIndicator';
import AccountScreenChart from '@/components/AccountScreenChart';
import { DashboardHeaderMobile } from '@/components/DashboardHeader';
import { useAccounts } from '@/providers/accounts';
import { useGetAccountDetails } from '@/api/hooks/account-details';
import { useGetMetrics } from '@/api/hooks/metrics';
import { AccountTypeEnum } from '@/shared/enums';
import { AccountMetrics } from '@/components/AccountMetrics';
import { AccountInfo } from '@/components/AccountInfo';
// import AccountScreenChart from '@/components/AccountScreenChart';

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

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

  const { accountId } = useParams<{ accountId: string }>();

  const { data: accountDetails } = useGetAccountDetails(
    accountId ? Number(accountId) : selectedAccountId,
  );

  const [DashboardAccountType, setDashboardAccountType] =
    useState<DashboardAccountType | null>(null);

  useEffect(() => {
    if (accountId !== selectedPreviewAccountId?.toString()) {
      setSelectedPreviewAccountId(accountId ? Number(accountId) : undefined);
    }
  }, [
    accountId,
    selectedAccountId,
    selectedPreviewAccountId,
    setSelectedPreviewAccountId
  ]);

  const { data: metricsData } = useGetMetrics(
    selectedPreviewAccountId ?? selectedAccountId,
  )

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

  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Sample data for the chart with 10-minute intervals for more dynamic chart
        const data: ActivityData[] = [
          // 7 PM hour
          { time: '7:00 PM', value: 125, isHourMark: true },
          { time: '7:10 PM', value: 142 },
          { time: '7:20 PM', value: 165 },
          { time: '7:30 PM', value: 120 },
          { time: '7:40 PM', value: 115 },
          { time: '7:50 PM', value: 85 },

          // 8 PM hour
          { time: '8:00 PM', value: 110, isHourMark: true },
          { time: '8:10 PM', value: 145 },
          { time: '8:20 PM', value: 132 },
          { time: '8:30 PM', value: 120 },
          { time: '8:40 PM', value: 135 },
          { time: '8:50 PM', value: 148 },

          // 9 PM hour
          { time: '9:00 PM', value: 125, isHourMark: true },
          { time: '9:10 PM', value: 140 },
          { time: '9:20 PM', value: 110 },
          { time: '9:30 PM', value: 90 },
          { time: '9:40 PM', value: 105 },
          { time: '9:50 PM', value: 115 },

          // 10 PM hour
          { time: '10:00 PM', value: 50, isHourMark: true },
          { time: '10:10 PM', value: 75 },
          { time: '10:20 PM', value: 95 },
          { time: '10:30 PM', value: 125 },
          { time: '10:40 PM', value: 110 },
          { time: '10:50 PM', value: 90 },

          // 11 PM hour
          { time: '11:00 PM', value: 120, isHourMark: true },
          { time: '11:10 PM', value: 100 },
          { time: '11:20 PM', value: 85 },
          { time: '11:30 PM', value: 130 },
          { time: '11:40 PM', value: 145 },
          { time: '11:50 PM', value: 120 },

          // 12 PM hour
          { time: '12:00 PM', value: 100, isHourMark: true },
          { time: '12:10 PM', value: 115 },
          { time: '12:20 PM', value: 135 },
          { time: '12:30 PM', value: 150 },
          { time: '12:40 PM', value: 135 },
          { time: '12:50 PM', value: 145 },

          // 1 AM hour
          { time: '1:00 AM', value: 170, isHourMark: true },
          { time: '1:10 AM', value: 185 },
          { time: '1:20 AM', value: 165 },
          { time: '1:30 AM', value: 180 },
          { time: '1:40 AM', value: 195 },
          { time: '1:50 AM', value: 115 }
        ];

        setActivityData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView className='bg-[#100E0F] h-full'>
      <ScrollView>
        <Header />

        {/* we need to call the DashBoardHeaderMobile and remove the part below */}
        <DashboardHeaderMobile accountDetails={accountDetails} />

        {/* this part need to be commented because now we call the DashBoardHeaderMobile */}
        <View className='flex-row items-center justify-between py-5 px-2'>
          <View className='flex-row items-center'>
            <View className='border border-gray-800 w-12 h-12 items-center justify-center rounded-lg mr-4 bg-gray-00'>
              <Image
                source={images.alpha_capital}
                resizeMode='contain'
                className='w-7 h-7'
              />
            </View>
            <View className='flex-shrink'>
              <Text className='text-white text-lg font-InterBold'>FTMO</Text>
              <View className='flex-row items-center mt-1'>
                <Image source={images.mini_funding_logo} className='w-4 h-4 rounded-full mr-1' />
                <Text className='text-gray-400 text-sm opacity-90 font-Inter'>ID: 123456</Text>
              </View>
            </View>
          </View>
          <View className='bg-success-800 rounded-md px-3 py-0.5 mr-1'>
            <Text className='font-Inter text-base text-white'>
              Demo
            </Text>
          </View>
        </View>

        <AccountScreenChart
          metricsData={metricsData}
          dashboardAccountType={DashboardAccountType}
          startingBalance={metricsData?.starting_balance ?? 0}
          profitTarget={metricsData?.profit_target ?? 0}
          maxTotalDd={metricsData?.max_daily_dd ?? 0}
        />

        {/*so instead of all the data below I want to call the AccountMetrics just for the code to be cleaner  */}
        <AccountMetrics
          dashboardAccountType={dashboardAccountType}
          accountMaxDailyLoss={accountDetails?.max_daily_loss ?? 0}
          maxDrawdown={metricsData?.max_total_dd ?? 0}
          profitTarget={metricsData?.profit_target ?? 0}
          dailyPL={metricsData?.daily_pl ?? 0}
          totalPL={closedProfitLoss}
          netPl={metricsData?.net_pl ?? 0}
          winRate={metricsData?.win_rate ?? 0}
          averageProfit={metricsData?.average_profit ?? 0}
          averageLoss={metricsData?.average_loss ?? 0}
          dailyLoss={dailyLoss}
          maxDailyLoss={maxDailyLoss}
          maxDailyDd={metricsData?.max_daily_dd ?? 0}
          startingBalance={metricsData?.starting_balance ?? 0}
          totalDd={metricsData?.total_dd ?? 0}
          accountType={accountDetails?.account_type}
        />

        {/* from this code needs to be replaced with the AccountMetrics and AccountInfo... */}
        <View className='flex-row items-center justify-between rounded-lg mt-2'>
          <View className='bg-propfirmone-300 flex-1 rounded-lg py-3 px-2'>
            <View className='flex-row items-center justify-between'>
              <Text className='text-gray-500 text-xs'>Daily Loss</Text>
              <Text className='text-danger-500 text-xs'>-$1,000<Text className='text-white'>/-$5,000</Text></Text>
            </View>
            <ProfitLossIndicator />
          </View>
          <View className='flex-1 ml-1 py-3 bg-propfirmone-300 rounded-lg px-2'>
            <View className='flex-row items-center justify-between'>
              <Text className='text-gray-500 text-xs'>Max Drawdown</Text>
              <Text className='text-gray-500 text-xs'>Profit Traget</Text>
            </View>
            <ProfitLossIndicator />
          </View>
        </View>

        {/* TTTTTTTT */}
        <View className='flex-row items-center justify-between rounded-lg mt-2'>
          <View className='bg-propfirmone-300 flex-1 rounded-lg py-3'>
            <Text className='text-gray-600 text-sm ml-3 font-Inter'>Daily Loss</Text>
            <Text className='text-danger-600 text-base font-InterSemiBold ml-3'>-$32.39</Text>
          </View>

          <View className='flex-1 ml-1 py-3 bg-propfirmone-300 rounded-lg'>
            <Text className='text-gray-600 text-sm ml-3 font-Inter'>Total P/L</Text>
            <Text className='text-danger-600 text-base font-InterSemiBold ml-3'>-$1,000</Text>
          </View>
        </View>

        {/* TTTTTT */}
        <View className='space-y-3 mb-2 mt-4'>
          <View className='flex-row justify-between'>
            <Text className='text-gray-400 text-sm mb-1 font-Inter'>Balance:</Text>
            <Text className='text-white text-base font-Inter'>$199,027.50</Text>
          </View>
          <View className='flex-row justify-between'>
            <Text className='text-gray-400 text-sm mb-1 font-Inter'>Equity:</Text>
            <Text className='text-white text-base font-Inter'>$99,287.50</Text>
          </View>
        </View>
        <View className="w-full h-0.5 bg-gray-800" />
        <View className='space-y-3 mt-2'>
          <View className='flex-row justify-between '>
            <Text className='text-gray-400 text-sm mb-1 font-Inter'>Program:</Text>
            <Text className='text-white text-base font-Inter'>1 step</Text>
          </View>
          <View className='flex-row justify-between'>
            <Text className='text-gray-400 text-sm mb-1 font-Inter'>Trading Days:</Text>
            <Text className='text-white text-base font-Inter'>1 / 3</Text>
          </View>
        </View>
        <View className="space-y-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400 text-sm mb-1 font-Inter">Status:</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <Text className="text-green-500 text-base font-Inter">Active</Text>
            </View>
          </View>
        </View>
        <View className="w-full h-0.5 bg-gray-800" />
        <View className="space-y-3 mt-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm mb-1 font-Inter">Leverage:</Text>
            <Text className="text-white text-base font-Inter">100x</Text>
          </View>
        </View>
        <View className="space-y-3">
          {/* DailyLoss */}
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm font-Inter">Daily Loss:</Text>
            <Text className="text-red-500 text-sm font-Inter">-$1000 <Text className='text-white font-Inter'>/-$5,000</Text></Text>
          </View>

          {/* Max Loss */}
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm font-Inter">Max Loss:</Text>
            <Text className="text-red-500 text-sm font-Inter">-$175 <Text className='text-white font-Inter'>/ -$10,000</Text></Text>
          </View>

          {/* Profit Target */}
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm font-Inter">Profit Target:</Text>
            <Text className="text-red-500 text-sm font-Inter">-$175 <Text className='text-white font-Inter'>/ -$10,000</Text></Text>
          </View>

          {/* Trading Days */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400 text-sm font-Inter">Trading Days:</Text>
            <Text className="text-white text-sm font-Inter">1 / 3</Text>
          </View>
        </View>
        <View className="w-full h-0.5 bg-gray-800" />

        <View className='flex-row items-center justify-between rounded-lg mt-2'>
          <View className='flex-1 bg-propfirmone-300 py-3 px-2 rounded-lg justify-center'>
            <Text className='text-gray-400 text-xs ml-1 font-Inter'>Progress:</Text>
            <ProfitLossIndicator

            />
          </View>
        </View>
        {/* to this code needs to be replaced with the AccountMetrics and AccountInfo... */}

        <AccountInfo
          accountDetails={accountDetails}
          metricsData={metricsData}
        />

      </ScrollView>
    </SafeAreaView>
  );
};


export default Account