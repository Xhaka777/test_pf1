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

// ✅ Use proper API hooks
import { 
  useFetchPropFirmAccountsOverview,
  useFetchAccountsOverviewDetails 
} from '@/api/hooks/accounts';

interface NoPropFirmAccountsProps {
  showCart?: boolean;
  showTimePeriods?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  showSearchBar?: boolean;
  chartData?: any;
  isMenuScreen?: boolean;
  presetActiveTab?: 'Challenge' | 'Funded'; // New prop to preset the active tab
  hideTabBar?: boolean; // New prop to hide the TabBar
}

const NoPropFirmAccounts = ({
  showCart = true,
  showTimePeriods = true,
  showMetrics = true,
  showTabs = true,
  showSearchBar = true,
  chartData = null,
  isMenuScreen = false,
  presetActiveTab = null, // New prop
  hideTabBar = false // New prop
}: NoPropFirmAccountsProps) => {

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  
  // ✅ Use proper React Query hooks for prop firm data
  const {
    data: propFirmOverviewData,
    isLoading: overviewLoading,
    error: overviewError
  } = useFetchPropFirmAccountsOverview();

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

  // Date range calculation for chart
  const dateRange = useMemo(() => {
    return getDateRangeFromTimeframe(timeframe);
  }, [timeframe]);

  // ✅ Fetch chart data for prop firm accounts
  const { 
    data: chartDetailsData, 
    isLoading: chartLoading, 
    error: chartError 
  } = useFetchAccountsOverviewDetails({
    account_type: currentAccountType,
    ...dateRange,
  }, {
    enabled: Boolean(dateRange.start_date && dateRange.end_date),
    staleTime: 1 * 60 * 1000, // 1 minute for chart data
  });

  const tabCounts = {
    'Challenge': 1,
    'Funded': 2
  }

  // Sample data (you might want to replace this with real API data later)
  const challengeAccounts = [
    {
      id: 1,
      name: 'Account A',
      balance: 3.321,
      dailyPL: 120,
      changePercentage: -2.33,
      type: 'Challenge' as const,
      percentageChange: -2.33,
    },
    {
      id: 2,
      name: 'Test B',
      balance: 5.123,
      dailyPL: 200,
      changePercentage: 1.23,
      type: 'Challenge' as const,
      percentageChange: 1.23
    },
  ];
  
  const fundedAccounts = [
    {
      id: 1,
      name: 'Account C',
      balance: '$10,000',
      dailyPL: '+500',
      changePercentage: '+5.00%',
      type: 'Funded' as const,
      percentageChange: 5.00
    },
    {
      id: 2,
      name: 'Account D',
      balance: '$8,000',
      dailyPL: '-300',
      changePercentage: '-3.75%',
      type: 'Funded' as const,
      percentageChange: -3.75
    },
  ];

  const [filteredChallengeAccounts, setFilteredChallengeAccounts] = useState(challengeAccounts);
  const [filteredFundedAccounts, setFilteredFundedAccounts] = useState(fundedAccounts);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Calculate total metrics from prop firm overview data
  const totalChallengeBalance = useMemo(() => {
    if (!propFirmOverviewData) return '$0';
    return `$${propFirmOverviewData.total_evaluation_balance?.toLocaleString() || '0'}`;
  }, [propFirmOverviewData]);

  const totalDailyPL = useMemo(() => {
    if (!propFirmOverviewData) return '$0';
    const daily = propFirmOverviewData.daily_pl || 0;
    const sign = daily >= 0 ? '+' : '';
    return `${sign}$${daily.toLocaleString()}`;
  }, [propFirmOverviewData]);

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
  }

  const renderTabContent = () => {
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
          onAccountPress={handleAccountPress}
          accountType="propFirm"
          activeTab={activeTab}
        />
      )
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
          <ChallengeAccounts accounts={filteredChallengeAccounts} onAccountPress={handleAccountPress} />
        )
      } else if (activeTab === 'Funded') {
        return filteredFundedAccounts.length === 0 ? (
          <View className='flex-1 justify-center items-center'>
            <FileText size={20} color='#9CA3AF' className='mb-4' />
            <Text className='text-gray-400 text-base font-Inter'>
              {searchQuery ? 'No matching accounts found' : 'No funded accounts found'}
            </Text>
          </View>
        ) : (
          <FundedAccounts accounts={filteredFundedAccounts} onAccountPress={handleAccountPress} />
        )
      }
    }
  }

  // Get current account count based on active tab
  const currentAccountCount = useMemo(() => {
    return activeTab === 'Challenge' ? challengeAccounts.length : fundedAccounts.length;
  }, [activeTab, challengeAccounts.length, fundedAccounts.length]);

  const handleAccountPress = useCallback((account: any) => {
    setSelectedAccount({
      ...account,
      type: activeTab
    });
    bottomSheetRef.current?.present()
  }, [activeTab])

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
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className='rounded-lg p-4 mb-6'
          style={{ borderRadius: 8 }}
        >
          <Text className='text-white text-sm text-center font-Inter'>
            Please note that adding new accounts is only available on the desktop version.
            To create a new account, please use the desktop application.
          </Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <SafeAreaView className={`flex-1 ${isMenuScreen ? 'mt-1' : 'mt-10'}`}>
      {challengeAccounts.length === 0 && fundedAccounts.length === 0 ? (
        renderNoAccountContent()
      ) : (
        <View className='flex-1 p-2'>
          {/* Conditionally render TabBar only if hideTabBar is false */}
          {!hideTabBar && (
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
          {hideTabBar && (
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

          <AccountBottomSheet
            bottomSheetRef={bottomSheetRef}
            accountData={
              selectedAccount || {
                id: 1,
                name: `${activeTab} Account`,
                balance: '$0',
                dailyPL: '$0',
                changePercentage: '0%',
                type: activeTab as 'Live' | 'Demo'
              }
            }
          />
        </View>
      )}
    </SafeAreaView>
  )
};

export default NoPropFirmAccounts;