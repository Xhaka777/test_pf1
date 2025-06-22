import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, StatusBar, Text, TouchableOpacity, ScrollView } from 'react-native';
import TabBar from '@/components/TabBar';
import MetricCard from '@/components/MetricCard';
import { FileText } from 'lucide-react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import LiveAccounts from './LiveAccounts';
import DemoAccounts from './DemoAccounts';
import AccountBottomSheet from './AccountBottomSheet';
import MenuAccounts from './MenuAccounts';
import SearchInput from './SearchInput';
import { BrokerAccount } from '@/types';
import { useBrokerAccounts } from '@/hooks';
import TimeSeriesChart from './TimeSeriesChart';
import { getDateRangeFromTimeframe, timeframes, TimeframeSelector } from './timeframe-selector';
import { AccountTypeEnum } from '@/constants/enums';
import { useFetchAccountsOverviewDetails } from '@/hooks/api/useFetchAccountsOverviewDetails';

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

interface NoBrokerAccountProps {
  showCart?: boolean;
  showTimePeriods?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  chartData?: any;
  isMenuScreen?: boolean;
  showSearchBar?: boolean;
}

//BrokerAccount component format
interface DisplayAccount {
  id: number;
  name: string;
  balance: string;
  dailyPL: string;
  changePercentage: string;
  type: 'Live' | 'Demo';
  //maybe we should only add this...
  originalData?: BrokerAccount;
}

function NoBrokerAccount({
  showCart = true,
  showTimePeriods = true,
  showMetrics = true,
  showTabs = true,
  chartData = null,
  isMenuScreen = false,
  showSearchBar = true,
}: NoBrokerAccountProps) {

  const demoBottomSheetRef = useRef<BottomSheetModal>(null);

  // API hook to fetch broker accounts
  const {
    data: brokerAccountsData,
    loading: brokerAccountsLoading,
    error: brokerAccountsError,
    refetch: refetchBrokerAccounts
  } = useBrokerAccounts();

  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const ownBrokerTabs = ['Live', 'Demo']; // I removed the 'Competition' tab...
  const tabs = ownBrokerTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const [loading, setLoading] = useState<boolean>(true);

  // State for time period selection
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>('1M');
  const [tabState] = useState<AccountTypeEnum>(AccountTypeEnum.DEMO);

  // Date range calculation (same as your web version)
  const dateRange = useMemo(() => {
    setLoading(false);
    return getDateRangeFromTimeframe(timeframe);
  }, [timeframe]);

  // API call with same parameters structure
  const { data } = useFetchAccountsOverviewDetails({
    account_type: tabState,
    ...dateRange,
  });


  //State for processed accounts
  const [liveAccounts, setLiveAccounts] = useState<DisplayAccount[]>([]);
  const [demoAccounts, setDemoAccounts] = useState<DisplayAccount[]>([]);
  const [filteredLiveAccounts, setFilteredLiveAccounts] = useState<DisplayAccount[]>([]);
  const [filteredDemoAccounts, setFilteredDemoAccounts] = useState<DisplayAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Process broker accounts data
  useEffect(() => {
    if (brokerAccountsData?.broker_accounts) {
      // console.log('Processing broker accounts:', brokerAccountsData.broker_accounts);

      const processedAccounts = brokerAccountsData.broker_accounts.map((account: BrokerAccount): DisplayAccount => {
        // Format balance with currency
        const formattedBalance = `${account.currency} ${account.balance.toLocaleString()}`;

        // Format daily P&L with + or - sign
        const dailyPLFormatted = account.daily_pl >= 0
          ? `+${account.currency} ${account.daily_pl.toLocaleString()}`
          : `${account.currency} ${account.daily_pl.toLocaleString()}`;

        // Calculate percentage change based on total performance
        const totalGainLoss = account.balance - account.starting_balance;
        const totalPerformancePercentage = account.starting_balance > 0
          ? (totalGainLoss / account.starting_balance) * 100
          : 0;

        const changePercentageFormatted = totalPerformancePercentage >= 0
          ? `+${totalPerformancePercentage.toFixed(4)}%`
          : `${totalPerformancePercentage.toFixed(4)}%`;

        const processedAccount: DisplayAccount = {
          id: account.id,
          name: account.name,
          balance: formattedBalance,
          dailyPL: dailyPLFormatted,
          changePercentage: changePercentageFormatted,
          type: account.account_type === 'demo' ? 'Demo' : 'Live',
          originalData: account
        };

        return processedAccount;
      });

      // Separate accounts by type
      const live = processedAccounts.filter(acc => acc.type === 'Live');
      const demo = processedAccounts.filter(acc => acc.type === 'Demo');

      setLiveAccounts(live);
      setDemoAccounts(demo);
      setFilteredLiveAccounts(live);
      setFilteredDemoAccounts(demo);
    }
  }, [brokerAccountsData]);


  const tabCounts = {
    'Live': liveAccounts.length,
    'Demo': demoAccounts.length
  }

  //Search function
  const handleSearch = (text: string) => {
    setSearchQuery(text.toLowerCase());

    if (text === '') {
      setFilteredLiveAccounts(liveAccounts);
      setFilteredDemoAccounts(demoAccounts);
      return;
    }

    const filteredLive = liveAccounts.filter(account =>
      account.name.toLowerCase().includes(text) ||
      account.balance.toString().toLowerCase().includes(text)
    );

    const filteredDemo = demoAccounts.filter(account =>
      account.name.toLowerCase().includes(text) ||
      account.balance.toString().toLowerCase().includes(text)
    );

    setFilteredLiveAccounts(filteredLive);
    setFilteredDemoAccounts(filteredDemo);
  }


  //Calculate total metrics from real data
  const totalBalance = React.useMemo(() => {
    if (!brokerAccountsData?.broker_accounts) return '$0';

    const total = brokerAccountsData.broker_accounts.reduce((sum, account) => sum + account.balance, 0);
    return `$${total.toLocaleString()}`;
  }, [brokerAccountsData]);

  const totalDailyPL = React.useMemo(() => {
    if (!brokerAccountsData?.broker_accounts) return '$0';

    const total = brokerAccountsData.broker_accounts.reduce((sum, account) => sum + account.daily_pl, 0);
    const sign = total >= 0 ? '+' : '';
    return `${sign}$${total.toLocaleString()}`;
  }, [brokerAccountsData]);

  const renderTabContent = () => {
    //Show loading state while fetching data
    if (brokerAccountsLoading) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-gray-400 text-base font-Inter'>Loading accounts...</Text>
        </View>
      )
    }

    //Error and shiit
    if (brokerAccountsError) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-red-400 text-base font-Inter mb-4'>
            Error loading accounts: {brokerAccountsError}
          </Text>
          <TouchableOpacity
            onPress={refetchBrokerAccounts}
            className='bg-blue-500 px-4 py-2 rounded'>
            <Text className='text-white'>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (isMenuScreen) {
      const accountsToShow = activeTab === 'Live'
        ? filteredLiveAccounts
        : filteredDemoAccounts;

      return accountsToShow.length === 0 ? (
        <View className='flex-1 justify-center items-center'>
          <FileText size={20} color='#9Ca3Af' className='mb-4' />
          <Text className='text-gray-400 text-base font-Inter'>
            {searchQuery ? 'No matching accounts found' :
              activeTab === 'Live' ? 'No live accounts found' : 'No demo accounts found'}
          </Text>
        </View>
      ) : (
        <MenuAccounts
          accounts={accountsToShow}
          onAccountPress={handleAccountPress}
        />
      )
    } else {
      if (activeTab === 'Live') {
        return filteredLiveAccounts.length === 0 ? (
          <View className='flex-1 items-center justify-center'>
            <FileText size={20} color='#9CA3AF' className='mb-4' />
            <Text className='text-gray-400 text-base font-Inter'>
              {searchQuery ? 'No matching accounts found' : 'No live accounts found'}
            </Text>
          </View>
        ) : (
          <LiveAccounts accounts={filteredLiveAccounts} onAccountPress={handleAccountPress} />
        )
      } else if (activeTab === 'Demo') {
        return filteredDemoAccounts.length === 0 ? (
          <View className='flex-1 items-center justify-center'>
            <FileText size={20} color='#9CA3AF' className='mb-4' />
            <Text className='text-gray-400 text-base font-Inter'>
              {searchQuery ? 'No matching accounts found' : 'No demo accounts found'}
            </Text>
          </View>
        ) : (
          <DemoAccounts accounts={filteredDemoAccounts} onAccountPress={handleAccountPress} />
        )
      }
    }
  }

  const handleAccountPress = useCallback((account: DisplayAccount) => {
    //create enahanced account data for the bottom sheet
    const enhancedAccountData = {
      id: account.id,
      name: account.name,
      balance: account.balance,
      dailyPL: account.dailyPL,
      changePercentage: account.changePercentage,
      type: account.type,

      originalData: account.originalData, // Attach original data for more details

      currency: account.originalData?.currency || 'USD',
      firm: account.originalData?.firm,
      exchange: account.originalData?.exchange,
      server: account.originalData?.server,
      status: account.originalData?.status,
      totalPL: account.originalData?.total_pl,
      startingBalance: account.originalData?.starting_balance

    }
    setSelectedAccount(enhancedAccountData);
    demoBottomSheetRef.current?.present();
  }, [activeTab]);

  return (
    <SafeAreaView className={`flex-1 `}>
      <StatusBar barStyle="light-content" />
      <View className='h-[150px] mb-4'>
        <TimeSeriesChart
          data={data ?? undefined}
          timeframe={timeframe}
          height={180}
          showLabels={true}
        />
      </View>
      <View className='flex-1 p-2 mt-10'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-1 mr-2'>
            <TabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabPress={setActiveTab}
              selectedAccountType={selectedAccountType}
              showCounts={true}
              tabCounts={tabCounts}
            />
          </View>
          {showTimePeriods && (
            <View className='flex-row mt-3 mb-4'>
              <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
            </View>
          )}
        </View>
        {showSearchBar && (
          <SearchInput onSearch={handleSearch} />
        )}
        {showMetrics && (
          <View className='flex-row mb-1'>
            <MetricCard
              title="Total Balance (AUM)"
              value={totalBalance}
              iconType="balance"
            />
            <MetricCard
              title="Daily P/L"
              value={totalDailyPL}
              iconType="profit"
            />
          </View>
        )}
        {renderTabContent()}

        <AccountBottomSheet
          bottomSheetRef={demoBottomSheetRef}
          accountData={selectedAccount || {
            id: 1,
            name: ` ${activeTab} Account`,
            balance: '$0',
            dailyPL: '$0',
            changePercentage: '0%',
            type: activeTab as 'Live' | 'Demo',

            originalData: undefined,
            currency: 'USD',
            firm: null,
            exchange: '',
            server: '',
            status: 'inactive',
            totalPL: 0,
            startingBalance: 0
          }
          }
        />
      </View>
    </SafeAreaView>
  );
}


export default NoBrokerAccount;