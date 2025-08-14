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
import { getDateRangeFromTimeframe, timeframes, TimeframeSelector } from './timeframe-selector';
import { AccountTypeEnum } from '@/constants/enums';
import TimeSeriesChart from './TimeSeriesChart';
import BrokerBottomSheet from './overview/BrokerBottomSheet';

interface NoBrokerAccountProps {
  showCart?: boolean;
  showTimePeriods?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  chartData?: any;
  isMenuScreen?: boolean;
  showSearchBar?: boolean;
  presetActiveTab?: 'Live' | 'Demo' | null;
  hideTabBar?: boolean;
  showOnlyPresetTab?: boolean;
  brokerAccountsData?: any;
  brokerAccountsLoading?: boolean;
  brokerAccountsError?: any;
  refetchBrokerAccounts?: () => void;
  onAccountPress?: (account: DisplayAccount) => void;
  context?: 'menu' | 'overview';
}

// Updated interface to match your BrokerPLCard component expectations
interface DisplayAccount {
  id: number;
  name: string;
  balance: number; // Keep as number for calculations
  dailyPL: number; // Keep as number for calculations
  changePercentage: number; // Keep as number for calculations
  type: 'Live' | 'Demo';
  originalData?: BrokerAccount;
  currency?: string;
  firm?: string | null;
  exchange?: string;
  server?: string;
  status?: string;
  totalPL?: number;
  startingBalance?: number;
}

function NoBrokerAccount({
  showCart = true,
  showTimePeriods = true,
  showMetrics = true,
  showTabs = true,
  chartData = null,
  isMenuScreen = false,
  showSearchBar = true,
  presetActiveTab = null,
  hideTabBar = false,
  showOnlyPresetTab = false,
  // ✅ External data props
  brokerAccountsData,
  brokerAccountsLoading = false,
  brokerAccountsError = null,
  refetchBrokerAccounts,
  onAccountPress,
  context = 'menu'
}: NoBrokerAccountProps) {

  const demoBottomSheetRef = useRef<BottomSheetModal>(null);

  // Use presetActiveTab if provided, otherwise default to 'Live'
  const [activeTab, setActiveTab] = useState<'Live' | 'Demo'>(presetActiveTab || 'Live');

  // Update activeTab when presetActiveTab changes
  useEffect(() => {
    if (presetActiveTab) {
      setActiveTab(presetActiveTab);
    }
  }, [presetActiveTab]);

  const currentAccountType = useMemo(() => {
    return activeTab === 'Live' ? AccountTypeEnum.LIVE : AccountTypeEnum.DEMO;
  }, [activeTab]);

  // Other state
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // State for processed accounts
  const [liveAccounts, setLiveAccounts] = useState<DisplayAccount[]>([]);
  const [demoAccounts, setDemoAccounts] = useState<DisplayAccount[]>([]);
  const [filteredLiveAccounts, setFilteredLiveAccounts] = useState<DisplayAccount[]>([]);
  const [filteredDemoAccounts, setFilteredDemoAccounts] = useState<DisplayAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Process broker accounts data when available
  useEffect(() => {
    if (brokerAccountsData?.broker_accounts) {
      console.log('[NoBrokerAccount] Processing broker accounts:', brokerAccountsData.broker_accounts.length);

      const processedAccounts = brokerAccountsData.broker_accounts.map((account: any): DisplayAccount => {
        // Calculate total performance percentage
        const totalGainLoss = account.balance - account.starting_balance;
        const totalPerformancePercentage = account.starting_balance > 0
          ? (totalGainLoss / account.starting_balance) * 100
          : 0;

        return {
          id: account.id,
          name: account.name,
          balance: account.balance, // Keep as number
          dailyPL: account.daily_pl, // Keep as number
          changePercentage: totalPerformancePercentage, // Keep as number
          type: account.account_type.toLowerCase() === 'demo' ? 'Demo' : 'Live',
          originalData: account,
          currency: account.currency,
          firm: account.firm,
          exchange: account.exchange,
          server: account.server,
          status: account.status,
          totalPL: account.total_pl,
          startingBalance: account.starting_balance
        };
      });

      // Separate by account type
      const live = processedAccounts.filter(acc => acc.type === 'Live');
      const demo = processedAccounts.filter(acc => acc.type === 'Demo');

      console.log('[NoBrokerAccount] Processed accounts:', { live: live.length, demo: demo.length });

      setLiveAccounts(live);
      setDemoAccounts(demo);
      setFilteredLiveAccounts(live);
      setFilteredDemoAccounts(demo);
    } else {
      // Reset when no data
      setLiveAccounts([]);
      setDemoAccounts([]);
      setFilteredLiveAccounts([]);
      setFilteredDemoAccounts([]);
    }
  }, [brokerAccountsData]);

  // Tab counts for display
  const tabCounts = useMemo(() => ({
    'Live': liveAccounts.length,
    'Demo': demoAccounts.length
  }), [liveAccounts.length, demoAccounts.length]);

  // Get current account count based on active tab
  const currentAccountCount = useMemo(() => {
    return activeTab === 'Live' ? liveAccounts.length : demoAccounts.length;
  }, [activeTab, liveAccounts.length, demoAccounts.length]);

  const handleSearch = useCallback((text: string) => {
    const query = text.toLowerCase();
    setSearchQuery(query);

    if (query === '') {
      setFilteredLiveAccounts(liveAccounts);
      setFilteredDemoAccounts(demoAccounts);
      return;
    }

    const filteredLive = liveAccounts.filter(account =>
      account.name.toLowerCase().includes(query) ||
      account.id.toString().includes(query) ||
      account.currency?.toLowerCase().includes(query) ||
      account.firm?.toLowerCase().includes(query)
    );

    const filteredDemo = demoAccounts.filter(account =>
      account.name.toLowerCase().includes(query) ||
      account.id.toString().includes(query) ||
      account.currency?.toLowerCase().includes(query) ||
      account.firm?.toLowerCase().includes(query)
    );

    setFilteredLiveAccounts(filteredLive);
    setFilteredDemoAccounts(filteredDemo);
  }, [liveAccounts, demoAccounts]);

  const handleAccountPress = useCallback((account: DisplayAccount) => {
    console.log('[NoBrokerAccount] Account pressed:', account.id, account.name);

    if (onAccountPress) {
      onAccountPress(account);
      return;
    }

    const enhancedAccountData = {
      id: account.id,
      name: account.name,
      balance: `${account.currency || 'USD'} ${account.balance.toLocaleString()}`,
      dailyPL: `${account.dailyPL >= 0 ? '+' : ''}${account.currency || 'USD'} ${account.dailyPL.toLocaleString()}`,
      changePercentage: `${account.changePercentage >= 0 ? '+' : ''}${account.changePercentage.toFixed(2)}%`,
      type: account.type,
      originalData: account.originalData,
      currency: account.currency,
      firm: account.firm,
      exchange: account.exchange,
      server: account.server,
      status: account.status,
      totalPL: account.totalPL,
      startingBalance: account.startingBalance
    };

    setSelectedAccount(enhancedAccountData);
    demoBottomSheetRef.current?.present();
  }, [onAccountPress]);

  const renderTabContent = () => {
    // Show loading state while fetching data
    if (brokerAccountsLoading) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-gray-400 text-base font-Inter'>Loading accounts...</Text>
        </View>
      );
    }

    // Error state
    if (brokerAccountsError) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-red-400 text-base font-Inter mb-4'>
            Error loading accounts: {brokerAccountsError.message}
          </Text>
          {refetchBrokerAccounts && (
            <TouchableOpacity
              onPress={() => refetchBrokerAccounts()}
              className='bg-blue-500 px-4 py-2 rounded'>
              <Text className='text-white'>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Get accounts to show based on active tab
    const accountsToShow = activeTab === 'Live' ? filteredLiveAccounts : filteredDemoAccounts;
    const hasSearchQuery = searchQuery.trim().length > 0;

    // Menu screen layout
    if (isMenuScreen) {
      return accountsToShow.length === 0 ? (
        <View className='flex-1 justify-center items-center'>
          <FileText size={20} color='#9CA3AF' className='mb-4' />
          <Text className='text-gray-400 text-base font-Inter'>
            {hasSearchQuery
              ? 'No matching accounts found'
              : `No ${activeTab.toLowerCase()} accounts found`
            }
          </Text>
        </View>
      ) : (
        <MenuAccounts
          accounts={accountsToShow}
          onAccountPress={handleAccountPress}
          accountType={presetActiveTab === 'Live' ? 'brokerage' : 'practice'}
          activeTab={activeTab}
        />
      );
    }

    // Regular screen layout
    if (activeTab === 'Live') {
      return filteredLiveAccounts.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <FileText size={20} color='#9CA3AF' className='mb-4' />
          <Text className='text-gray-400 text-base font-Inter'>
            {hasSearchQuery ? 'No matching live accounts found' : 'No live accounts found'}
          </Text>
        </View>
      ) : (
        <LiveAccounts
          accounts={filteredLiveAccounts}
          onAccountPress={handleAccountPress}
        />
      );
    } else {
      return filteredDemoAccounts.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <FileText size={20} color='#9CA3AF' className='mb-4' />
          <Text className='text-gray-400 text-base font-Inter'>
            {hasSearchQuery ? 'No matching demo accounts found' : 'No demo accounts found'}
          </Text>
        </View>
      ) : (
        <DemoAccounts
          accounts={filteredDemoAccounts}
          onAccountPress={handleAccountPress}
        />
      );
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isMenuScreen ? 'mt-1' : ''}`}>
      <StatusBar barStyle="light-content" />

      <View className='flex-1 p-2'>

        {/* Conditionally render TabBar only if hideTabBar is false */}
        {!hideTabBar && showTabs && (
          <View className='flex-row items-center justify-between mb-4'>
            <View className='flex-1 mr-2'>
              <TabBar
                tabs={showOnlyPresetTab && presetActiveTab ? [presetActiveTab] : ['Live', 'Demo']}
                activeTab={activeTab}
                onTabPress={showOnlyPresetTab ? () => { } : setActiveTab} // Disable tab switching if showing only one tab
                selectedAccountType="ownBroker"
                showCounts={true}
                tabCounts={tabCounts}
              />
            </View>
          </View>
        )}

        {/* Accounts Section with Count - only show when hideTabBar is true AND not in menu screen */}
        {hideTabBar && !isMenuScreen && (
          <View className='px-6 mb-4'>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              Accounts <Text style={{ color: '#E74694' }}>{currentAccountCount}</Text>
            </Text>
          </View>
        )}

        {showSearchBar && (
          <SearchInput onSearch={handleSearch} />
        )}

        {renderTabContent()}

        <BrokerBottomSheet
          bottomSheetRef={demoBottomSheetRef}
          context={context}
          accountData={selectedAccount || {
            id: 1,
            name: `${activeTab} Account`,
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
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default NoBrokerAccount;