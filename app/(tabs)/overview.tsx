import { Text, SafeAreaView, Alert, View, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useMemo, useState, useRef } from 'react'
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
import { useFetchAccountsOverviewDetails } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import AccountSelectorBottomSheet, { AccountSelectorRef } from '@/components/SelectAccountBottomSheet'
import AccountBalanceCard from '@/components/overview/AccountBalanceCard';
import { WinLossStats } from '@/components/overview/WinLossStats';
import AdditionalStats from '@/components/overview/AdditionalStats';

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

const Overview = () => {
  const { user } = useUser();
  const bottomSheetRef = useRef<AccountSelectorRef>(null);

  // State for selected account from bottom sheet
  const [selectedAccount, setSelectedAccount] = useState('evaluation');
  const [selectedSubAccount, setSelectedSubAccount] = useState('evaluation'); // For Evaluation/Funded buttons

  const [loading, setLoading] = useState<boolean>(true)

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            Alert.alert("Signed out successfully!");
          }
        }
      ]
    );
  };

  // Handle account selection from bottom sheet
  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);

    // Set default sub-account based on selection
    if (accountId === 'evaluation' || accountId === 'funded') {
      setSelectedSubAccount(accountId);
    }

    // The bottom sheet will close automatically in the new implementation
  };

  // Open account selector bottom sheet
  const openAccountSelector = () => {
    bottomSheetRef.current?.expand();
  };

  // Get display text and show sub-buttons based on selected account
  const getAccountDisplayInfo = () => {
    switch (selectedAccount) {
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

  // Mock data for the account balance card - replace with real API data
  const getAccountData = (accountType: string) => {
    // This would come from your API based on the selected account
    const mockData = {
      evaluation: {
        balance: '$156,879',
        totalPL: '$21,450',
        totalPLPercentage: '13.79%',
        dailyPL: '$2,150',
        dailyPLPercentage: '13.79%',
        winPercentage: 64.68,
        lossPercentage: 33.32,
        avgWinAmount: '$129',
        avgLossAmount: '-$29.85',
        winRate: '13.79%',
        profitFactor: '0.04'
      },
      funded: {
        balance: '$298,456',
        totalPL: '$45,230',
        totalPLPercentage: '18.32%',
        dailyPL: '$3,420',
        dailyPLPercentage: '1.16%',
        winPercentage: 72.45,
        lossPercentage: 27.55,
        avgWinAmount: '$245',
        avgLossAmount: '-$89.50',
        winRate: '18.32%',
        profitFactor: '1.24'
      },
      live: {
        balance: '$125,340',
        totalPL: '-$8,760',
        totalPLPercentage: '-6.54%',
        dailyPL: '-$1,200',
        dailyPLPercentage: '-0.95%',
        winPercentage: 45.30,
        lossPercentage: 54.70,
        avgWinAmount: '$87',
        avgLossAmount: '-$156.20',
        winRate: '45.30%',
        profitFactor: '0.68'
      },
      demo: {
        balance: '$10,000',
        totalPL: '$850',
        totalPLPercentage: '8.50%',
        dailyPL: '$120',
        dailyPLPercentage: '1.20%',
        winPercentage: 58.90,
        lossPercentage: 41.10,
        avgWinAmount: '$45',
        avgLossAmount: '-$32.75',
        winRate: '58.90%',
        profitFactor: '0.92'
      }
    };

    return mockData[accountType as keyof typeof mockData] || mockData.evaluation;
  };

  const currentAccountData = getAccountData(selectedAccount);
  const accountDisplayInfo = getAccountDisplayInfo();

  //simulate some because of some...
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
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
        <Header onSignOut={handleSignOut} />

        {/* Account Selector Section */}
        <View className='px-6 pb-2'>
          <View className='flex-row items-center justify-between mt-3'>
            {/* Left side - Account title with chevron */}
            <TouchableOpacity
              onPress={openAccountSelector}
              className='flex-row items-center'
            >
              <Text className='text-white text-lg font-Inter mr-2'>
                {accountDisplayInfo.title}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color="white"
              />
            </TouchableOpacity>

            {/* Right side - Sub-account buttons (only for Prop Firm) */}
            {accountDisplayInfo.showSubButtons && (
              <View className='flex-row space-x-2'>
                {accountDisplayInfo.subButtons.map((button) => (
                  <TouchableOpacity
                    key={button.id}
                    onPress={() => setSelectedSubAccount(button.id)}
                    className={`py-3 px-5 rounded-lg bg-propfirmone-300 border items-center justify-center bg-transparent border mr-2
                      ${selectedSubAccount === button.id ? 'border-[#e74694]' : 'bg-propfirmone-300 border border-[#4F494C]'}
                      `}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: '500'
                      }}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Account Balance Card */}
        <AccountBalanceCard
          accountType={selectedAccount}
          balance={currentAccountData.balance}
          totalPL={currentAccountData.totalPL}
          totalPLPercentage={currentAccountData.totalPLPercentage}
          dailyPL={currentAccountData.dailyPL}
          dailyPLPercentage={currentAccountData.dailyPLPercentage}
        />

        {/* Win/Loss Statistics */}
        <WinLossStats
          winPercentage={33.32}
          lossPercentage={64.68}
          winAmount={129}
          lossAmount={29.85}
        />

        {/* Additional Statistics */}
        <AdditionalStats
          winRate={currentAccountData.winRate}
          profitFactor={currentAccountData.profitFactor}
        />

        <View className='flex-1'>
          {(selectedAccount === 'evaluation' || selectedAccount === 'funded') ? (
            <NoPropFirmAccounts 
              showSearchBar={false} 
              presetActiveTab={selectedAccount === 'evaluation' ? 'Challenge' : 'Funded'}
              hideTabBar={true}
            />
          ) : selectedAccount === 'live' ? (
            <NoBrokerAccount 
              showSearchBar={false} 
              presetActiveTab="Live"
              hideTabBar={true}
            />
          ) : selectedAccount === 'demo' ? (
            <NoBrokerAccount 
              showSearchBar={false} 
              presetActiveTab="Demo"
              hideTabBar={true}
            />
          ) : (
            <NoPropFirmAccounts showSearchBar={false} />
          )}
        </View>
      </ScrollView>

      {/* Account Selector Bottom Sheet */}
      <AccountSelectorBottomSheet
        ref={bottomSheetRef}
        onAccountSelect={handleAccountSelect}
        selectedAccountId={selectedAccount}
      />
    </SafeAreaView>
  )
}

export default Overview