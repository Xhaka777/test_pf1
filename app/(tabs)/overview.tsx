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
import { useFetchAccountsOverviewDetails, useGetBrokerAccounts, useGetPropFirmAccounts } from '@/api';
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

  const [selectedAccount, setSelectedAccount] = useState<'evaluation' | 'funded' | 'live' | 'demo'>('evaluation');
  const [selectedSubAccount, setSelectedSubAccount] = useState<'evaluation' | 'funded'>('evaluation');
  const [selectedAccountType, setSelectedAccountType] = useState<'propFirm' | 'brokerage' | 'practice'>('propFirm');

  const [loading, setLoading] = useState<boolean>(true);

  // 🔄 Sync selectedAccountType when selectedAccount changes
  useEffect(() => {
    if (selectedAccount === 'evaluation' || selectedAccount === 'funded') {
      setSelectedAccountType('propFirm');
    } else if (selectedAccount === 'live') {
      setSelectedAccountType('brokerage');
    } else if (selectedAccount === 'demo') {
      setSelectedAccountType('practice');
    }
  }, [selectedAccount]);

  // 📡 Fetch accounts based on selected type
  const {
    data: propFirmAccountsData,
    isLoading: propFirmAccountsLoading,
    error: propFirmAccountsError,
    refetch: refetchPropFirmAccounts
  } = useGetPropFirmAccounts({
    enabled: selectedAccountType === 'propFirm',
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

  const getAccountData = (type: string) => {
    if (type === 'evaluation') return processedPropFirmAccounts.evaluation?.[0] ?? {};
    if (type === 'funded') return processedPropFirmAccounts.funded?.[0] ?? {};
    if (type === 'live') return brokerAccountsData?.live?.[0] ?? {};
    if (type === 'demo') return brokerAccountsData?.demo?.[0] ?? {};
    return {};
  };

  const currentAccountData = getAccountData(selectedAccount);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => Alert.alert("Signed out successfully!") }
    ]);
  };

  const handleAccountSelect = (accountId: any) => {
    setSelectedAccount(accountId);
    if (accountId === 'evaluation' || accountId === 'funded') {
      setSelectedSubAccount(accountId);
    }
  };

  const openAccountSelector = () => {
    bottomSheetRef.current?.expand();
  };

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

  const accountDisplayInfo = getAccountDisplayInfo();

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

  return (
    <SafeAreaView className='bg-[#100E0F] h-full'>
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
              <View className='flex-row space-x-2'>
                {accountDisplayInfo.subButtons.map((button) => (
                  <TouchableOpacity
                    key={button.id}
                    onPress={() => setSelectedSubAccount(button.id as 'evaluation' | 'funded')}
                    className={`py-3 px-5 rounded-lg border items-center justify-center ${
                      selectedSubAccount === button.id
                        ? 'border-[#e74694]'
                        : 'bg-propfirmone-300 border border-[#4F494C]'
                    }`}
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

        {/* Account Summary */}
        <AccountBalanceCard
          accountType={selectedAccount}
          balance={currentAccountData.balance}
          totalPL={currentAccountData.totalPL}
          totalPLPercentage={currentAccountData.changePercentage}
          dailyPL={currentAccountData.dailyPL}
          dailyPLPercentage={currentAccountData.dailyPLPercentage} // You can calculate if needed
        />

        <WinLossStats
          winPercentage={33.32}
          lossPercentage={64.68}
          winAmount={129}
          lossAmount={29.85}
        />

        <AdditionalStats
          winRate={currentAccountData.winRate}
          profitFactor={currentAccountData.profitFactor}
        />

        {/* Account Content */}
        <View className='flex-1'>
          {(selectedAccount === 'evaluation' || selectedAccount === 'funded') ? (
            <NoPropFirmAccounts
              showSearchBar={false}
              presetActiveTab={selectedAccount === 'evaluation' ? 'Challenge' : 'Funded'}
              hideTabBar={true}
              accountData={{
                evaluation: processedPropFirmAccounts.evaluation,
                funded: processedPropFirmAccounts.funded,
              }}
              isLoading={propFirmAccountsLoading}
              error={propFirmAccountsError}
              onRefresh={refetchPropFirmAccounts}
            />
          ) : selectedAccount === 'live' ? (
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Live"
              hideTabBar={true}
              brokerAccountsData={brokerAccountsData}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
            />
          ) : selectedAccount === 'demo' ? (
            <NoBrokerAccount
              showSearchBar={false}
              presetActiveTab="Demo"
              hideTabBar={true}
              brokerAccountsData={brokerAccountsData}
              brokerAccountsLoading={brokerAccountsLoading}
              brokerAccountsError={brokerAccountsError}
              refetchBrokerAccounts={refetchBrokerAccounts}
            />
          ) : (
            <NoPropFirmAccounts showSearchBar={false} />
          )}
        </View>
      </ScrollView>

      <AccountSelectorBottomSheet
        ref={bottomSheetRef}
        onAccountSelect={handleAccountSelect}
        selectedAccountId={selectedAccount}
      />
    </SafeAreaView>
  );
};

export default Overview