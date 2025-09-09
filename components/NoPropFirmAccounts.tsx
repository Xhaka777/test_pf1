import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, Image, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import images from '@/constants/images';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FileText } from 'lucide-react-native';
import EvaluationAccounts from './EvaluationAccounts';
import FundedAccounts from './FundedAccounts';
import TimeSeriesChart from './TimeSeriesChart';
import TabBar from './TabBar';
import MetricCard from './MetricCard';
import ChallengeAccounts from './ChallengeAccounts';
import AccountBottomSheet from './AccountBottomSheet';
import SearchInput from './SearchInput';
import MenuAccounts from './MenuAccounts';
import { getDateRangeFromTimeframe, timeframes, TimeframeSelector } from './timeframe-selector';
import { AccountTypeEnum } from '@/constants/enums';

// Import API hooks but use them conditionally
import {
  useFetchPropFirmAccountsOverview,
  useFetchAccountsOverviewDetails
} from '@/api/hooks/accounts';
import { PropFirmAccount } from '@/types';

interface MockAccounts {
  evaluation: PropFirmAccount[];
  funded: PropFirmAccount[];
}

interface NoPropFirmAccountsProps {
  showCart?: boolean;
  showTimePeriods?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  showSearchBar?: boolean;
  chartData?: any;
  isMenuScreen?: boolean;
  presetActiveTab?: 'Challenge' | 'Funded';
  hideTabBar?: boolean;
  // Props for external data (from overview.tsx)
  accountData?: MockAccounts;
  isLoading?: boolean;
  error?: Error | null;
  onAccountPress?: (account: PropFirmAccount) => void;
  onRefresh?: () => void;
  context?: 'menu' | 'overview';
  // Archive functionality
  currentAccountId?: number;
  onArchivePress?: (account: PropFirmAccount) => void;
}

const NoPropFirmAccounts = ({
  showCart = true,
  showTimePeriods = true,
  showMetrics = true,
  showTabs = true,
  showSearchBar = true,
  chartData = null,
  isMenuScreen = false,
  presetActiveTab = null,
  hideTabBar = false,

  accountData,
  isLoading: externalLoading = false,
  error: externalError = null,
  onAccountPress,
  onRefresh,
  context = 'menu',
  // Archive functionality
  currentAccountId,
  onArchivePress
}: NoPropFirmAccountsProps) => {

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Only fetch data when not provided by parent
  const shouldFetchData = !accountData;

  const {
    data: propFirmOverviewData,
    isLoading: overviewLoading,
    error: overviewError
  } = useFetchPropFirmAccountsOverview({
    enabled: shouldFetchData, // Only fetch when no external data is provided
  });

  // State management
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const propFirmTabs = ['Challenge', 'Funded'];
  const tabs = propFirmTabs;

  // Use presetActiveTab if provided, otherwise default to first tab
  const [activeTab, setActiveTab] = useState(presetActiveTab || tabs[0]);

  // Update activeTab when presetActiveTab changes
  useEffect(() => {
    if (presetActiveTab) {
      setActiveTab(presetActiveTab);
    }
  }, [presetActiveTab]);

  // State for time period selection and chart data
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>('1M');

  // Use EVALUATION for Challenge tab, FUNDED for Funded tab
  const currentAccountType = activeTab === 'Challenge' ? AccountTypeEnum.EVALUATION : AccountTypeEnum.FUNDED;

  const dateRange = useMemo(() => {
    return getDateRangeFromTimeframe(timeframe);
  }, [timeframe]);

  const {
    data: chartDetailsData,
    isLoading: chartLoading,
    error: chartError
  } = useFetchAccountsOverviewDetails({
    account_type: currentAccountType,
    ...dateRange
  }, {
    enabled: Boolean(dateRange.start_date && dateRange.end_date) && shouldFetchData,
    staleTime: 1 * 60 * 1000,
  });

  // Use passed data or empty arrays if no API data is available
  const challengeAccounts = useMemo(() => {
    if (accountData?.evaluation) {
      console.log('[NoPropFirmAccounts] Using external evaluation data:', accountData.evaluation.length);
      return accountData.evaluation;
    }

    // Return empty array if no data
    console.log('[NoPropFirmAccounts] No evaluation data available');
    return [];
  }, [accountData]);

  const fundedAccounts = useMemo(() => {
    if (accountData?.funded) {
      console.log('[NoPropFirmAccounts] Using external funded data:', accountData.funded.length);
      return accountData.funded;
    }

    // Return empty array if no data
    console.log('[NoPropFirmAccounts] No funded data available');
    return [];
  }, [accountData]);

  // Tab counts from actual data
  const tabCounts = useMemo(() => ({
    'Challenge': challengeAccounts.length,
    'Funded': fundedAccounts.length
  }), [challengeAccounts.length, fundedAccounts.length]);

  const [filteredChallengeAccounts, setFilteredChallengeAccounts] = useState(challengeAccounts);
  const [filteredFundedAccounts, setFilteredFundedAccounts] = useState(fundedAccounts);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFilteredChallengeAccounts(challengeAccounts);
    setFilteredFundedAccounts(fundedAccounts);
  }, [challengeAccounts, fundedAccounts]);

  // Use external overview data if available, otherwise use fetched data
  const overviewDataToUse = propFirmOverviewData;

  const totalChallengeBalance = useMemo(() => {
    if (!overviewDataToUse) return '$0';
    return `$${overviewDataToUse.total_evaluation_balance?.toLocaleString() || '0'}`;
  }, [overviewDataToUse]);

  const totalDailyPL = useMemo(() => {
    if (!overviewDataToUse) return '$0';
    const daily = overviewDataToUse.daily_pl || 0;
    const sign = daily >= 0 ? '+' : '';
    return `${sign}$${daily.toLocaleString()}`;
  }, [overviewDataToUse]);

  // Search function
  const handleSearch = (text: string) => {
    setSearchQuery(text.toLowerCase());

    if (text === '') {
      setFilteredChallengeAccounts(challengeAccounts);
      setFilteredFundedAccounts(fundedAccounts);
      return;
    }

    const filteredChallenges = challengeAccounts.filter(account =>
      account.name.toLowerCase().includes(text) ||
      account.balance.toString().toLowerCase().includes(text)
    );

    const filterFunded = fundedAccounts.filter(account =>
      account.name.toLowerCase().includes(text) ||
      account.balance.toString().toLowerCase().includes(text)
    );

    setFilteredChallengeAccounts(filteredChallenges);
    setFilteredFundedAccounts(filterFunded);
  };

  // Use external loading/error states when provided
  const isLoading = externalLoading || overviewLoading;
  const error = externalError || overviewError;

  const renderTabContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <View className='flex-1 items-center justify-center'>
          <Text className='text-gray-400 text-base font-Inter'>Loading accounts...</Text>
        </View>
      );
    }

    // Show error state with retry option
    if (error) {
      return (
        <View className='flex-1 items-center justify-center px-4'>
          <FileText size={48} color='#9CA3AF' className='mb-4' />
          <Text className='text-red-400 text-base font-Inter mb-4 text-center'>
            Error loading accounts: {error.message}
          </Text>
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              className='bg-primary-100 px-4 py-2 rounded-lg'
            >
              <Text className='text-white font-Inter'>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isMenuScreen) {
      const accountsToShow = activeTab === 'Challenge'
        ? filteredChallengeAccounts
        : filteredFundedAccounts;

      return accountsToShow.length === 0 ? (
        <View className='flex-1 justify-center items-center'>
          <FileText size={20} color='#9CA3AF' className='mb-4' />
          <Text className='text-gray-400 text-base font-Inter'>
            {searchQuery ? 'No matching accounts found' :
              activeTab === 'Challenge' ? 'No challenge accounts found' : 'No funded accounts found'
            }
          </Text>
        </View>
      ) : (
        <MenuAccounts
          accounts={accountsToShow}
          onAccountPress={onAccountPress || handleAccountPress}
          accountType="propFirm"
          activeTab={activeTab}
          currentAccountId={currentAccountId}
          onArchivePress={onArchivePress}
          context={context}
        />
      );
    } else {
      if (activeTab === 'Challenge') {
        return filteredChallengeAccounts.length === 0 ? (
          <View className='flex-1 justify-center items-center'>
            <FileText size={20} color='#9CA3AF' className='mb-4' />
            <Text className='text-gray-400 text-base font-Inter'>
              {searchQuery ? 'No matching accounts found' : 'No evaluated accounts found'}
            </Text>
          </View>
        ) : (
          <ChallengeAccounts
            accounts={filteredChallengeAccounts}
            onAccountPress={onAccountPress || handleAccountPress}
            currentAccountId={currentAccountId}
            onArchivePress={onArchivePress}
            context={context}
          />
        );
      } else if (activeTab === 'Funded') {
        return filteredFundedAccounts.length === 0 ? (
          <View className='flex-1 justify-center items-center'>
            <FileText size={20} color='#9CA3AF' className='mb-4' />
            <Text className='text-gray-400 text-base font-Inter'>
              {searchQuery ? 'No matching accounts found' : 'No funded accounts found'}
            </Text>
          </View>
        ) : (
          <FundedAccounts
            accounts={filteredFundedAccounts}
            onAccountPress={onAccountPress || handleAccountPress}
            currentAccountId={currentAccountId}
            onArchivePress={onArchivePress}
            context={context}
          />
        );
      }
    }
  };

  // Get current account count based on active tab
  const currentAccountCount = useMemo(() => {
    return activeTab === 'Challenge' ? challengeAccounts.length : fundedAccounts.length;
  }, [activeTab, challengeAccounts.length, fundedAccounts.length]);

  const handleAccountPress = useCallback((account: any) => {
    console.log('[NoPropFirmAccounts] Account pressed:', account.id, account.name, account.type);
    setSelectedAccount({
      ...account,
      type: activeTab // Ensure the type matches the current tab
    });
    bottomSheetRef.current?.present();
  }, [activeTab]);

  const renderNoAccountContent = () => {
    return (
      <View className='flex-1 justify-center items-center'>
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

  // Check if we should show the "No Accounts" view
  const shouldShowNoAccountsView = !isMenuScreen &&
    challengeAccounts.length === 0 &&
    fundedAccounts.length === 0 &&
    !isLoading &&
    !error;

  return (
    <SafeAreaView className={`flex-1 ${isMenuScreen ? 'mt-1' : 'mt-10'}`}>
      {shouldShowNoAccountsView ? (
        renderNoAccountContent()
      ) : (
        <View className='flex-1 p-2'>
          {/* Always show TabBar in menu screen, conditionally in other screens */}
          {(isMenuScreen || !hideTabBar) && (
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
            </View>
          )}

          {/* Accounts Section with Count - only show when hideTabBar is true (from overview) */}
          {hideTabBar && !isMenuScreen && (
            <View className='px-6 mb-4'>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                Accounts <Text style={{ color: '#E74694' }}>{currentAccountCount}</Text>
              </Text>
            </View>
          )}

          {/* Always show search bar in menu screen, conditionally in other screens */}
          {(isMenuScreen || showSearchBar) && (
            <SearchInput onSearch={handleSearch} />
          )}

          {renderTabContent()}

          <AccountBottomSheet
            bottomSheetRef={bottomSheetRef}
            context={context}
            onArchivePress={onArchivePress}
            accountData={selectedAccount ? {
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
              type: selectedAccount.type as 'Challenge' | 'Funded',
              currency: selectedAccount.currency,
              firm: selectedAccount.firm,
              program: selectedAccount.program,
              totalPL: selectedAccount.totalPL,
              netPL: selectedAccount.netPL,
              startingBalance: selectedAccount.startingBalance,
              maxTotalDD: selectedAccount.maxTotalDD,
              profitTarget: selectedAccount.profitTarget,
              originalData: selectedAccount.originalData,
            } : undefined}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default NoPropFirmAccounts;