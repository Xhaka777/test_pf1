import React, { useCallback, useRef, useState } from 'react';
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

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

interface NoPropFirmAccountsProps {
  showCart?: boolean;
  showTimePeriods?: boolean;
  showMetrics?: boolean;
  showTabs?: boolean;
  showSearchBar?: boolean;
  chartData?: any;
  isMenuScreen?: boolean;
}

const NoPropFirmAccounts = ({
  showCart = true,
  showTimePeriods = true,
  showMetrics = true,
  showTabs = true,
  showSearchBar = true,
  chartData = null,
  isMenuScreen = false
}: NoPropFirmAccountsProps) => {

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const propFirmTabs = ['Challenge', 'Funded'];
  const tabs = propFirmTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const [loading, setLoading] = useState<boolean>(true);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedTimePeroid, setSelectedTimePeriod] = useState('1D');
  const timePeriods = ['1D', '1W', '1M', 'All Time'];

  const tabCounts = {
    'Challenge': 1,
    'Funded': 2
  }

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

  //Search function
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
  const handleAccountPress = useCallback((account: any) => {
    setSelectedAccount({
      ...account,
      type: activeTab
    });
    bottomSheetRef.current?.present()
  }, [activeTab])

  const renderNoAccountContent = () => {
    // if ((evaluationAccounts.length === 0) || (fundedAccounts.length === 0)) {
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
          You don’t have any prop firm accounts yet. Please add a new account in order to start trading.
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

  //Todo: Duhet me check kur evaluation/funded accounts jane zero, ma qitke ni error ne BrokerPLCard...
  return (
    <SafeAreaView className={`flex-1 ${isMenuScreen ? 'mt-1' : 'mt-10'}`}>
      {challengeAccounts.length === 0 && fundedAccounts.length === 0 ? (
        renderNoAccountContent()
      ) : (
        <View className='flex-1 p-2'>
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
                {timePeriods.map((period) => (
                  <TouchableOpacity
                    key={period}
                    className={`px-3 py-2 rounded-lg mr-1 ${selectedTimePeroid === period ? 'bg-[#2F2C2D] border border-[#2F2C2D]' : 'bg-propfirmone-300 border border-[#4F494C]'}`}
                    onPress={() => setSelectedTimePeriod(period)}
                  >
                    <Text className={`text-sm font-InterSemiBold ${selectedTimePeroid === period ? 'text-white' : 'text-gray-400'}`}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {showSearchBar && (
            <SearchInput onSearch={handleSearch} />
          )
          }
          {showMetrics && (
            <View className='flex-row mb-1'>
              <MetricCard
                title='Total Challange Balance'
                value='$156,879'
                iconType='balance'
              />
              <MetricCard
                title='Daily P/L'
                value='$100,00'
                iconType='profit'
              />
            </View>
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