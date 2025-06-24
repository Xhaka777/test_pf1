import { Text, SafeAreaView, Alert, View, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
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

interface ActivityData {
  time: string;
  value: number;
  isHourMark?: boolean;
}

const Overview = () => {
  const { user } = useUser();
  // console.log('user', user)

  const [selectedButton, setSelectedButton] = useState('propFirm');
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');

  const [loading, setLoading] = useState<boolean>(true)

  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>('1M');
  const [tabState] = useState<AccountTypeEnum>(AccountTypeEnum.DEMO);

  // Date range calculation (same as your web version)
  const dateRange = useMemo(() => {
    return getDateRangeFromTimeframe(timeframe);
  }, [timeframe]);

  // API call with same parameters structure
  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError
  } = useFetchAccountsOverviewDetails({
    account_type: AccountTypeEnum.DEMO,
    ...dateRange,
  }, {
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000,
    enabled: Boolean(dateRange.start_date && dateRange.end_date)
  });

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
        <View className='px-6 pb-2'>
          <Text className='text-white text-lg font-Inter'>
            Overview
          </Text>
        </View>
        <View className='flex-row px-3 py-2 space-x-3'>
          <SelectableButton
            text='Prop Firm Account'
            isSelected={selectedAccountType === 'propFirm'}
            selectedBorderColor='border-primary-100'
            unselectedBorderColor='border-gray-700'
            onPress={() => setSelectedAccountType('propFirm')}
            additionalStyles='mr-3'
          />
          <SelectableButton
            text="Own Broker Accounts"
            isSelected={selectedAccountType === 'ownBroker'}
            selectedBorderColor='border-primary-100'
            unselectedBorderColor='border-gray-700'
            onPress={() => setSelectedAccountType('ownBroker')}
          />
        </View>

        {/* <View className='h-[150px] mb-4'>
         {loading ? (
            <View className='flex-1 justify-center items-center'>
              <Text className='text-gray-400 text-base font-Inter'>Loading.......</Text>
            </View>
          ) : ( 
            <TimeSeriesChart
              data={data ?? undefined}
              timeframe={timeframe}
              height={180}
              showLabels={true}
              // lineColor="#c21e8c"
              // areaColor="#d13f99"
              // backgroundColor={'bg-propfirmone-main'}
            />
         
          )}
        </View> */}
        <View className='flex-1'>
          {selectedAccountType === 'propFirm' ? (
            <NoPropFirmAccounts showSearchBar={false} />
          ) : (
            <NoBrokerAccount showSearchBar={false} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Overview