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
import { useFetchAccountsOverviewDetails } from '@/hooks/api/useFetchAccountsOverviewDetails';
import { set } from 'date-fns';

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
  const [activityData, setActivityData] = useState<ActivityData[]>([]);

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

  console.log('data---------------------', data)

  // const [activeTab, setActiveTab] = useState('live');


  // const tabs = [
  //   { id: 'live', label: 'Live', count: 0 },
  //   { id: 'demo', label: 'Demo', count: 0 },
  //   { id: 'competition', label: 'Competition', count: 1 },
  // ];

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

        // Sample data for the chart with 10-minute intervals for more dynamic chart
        // const data: ActivityData[] = [
        //   // 7 PM hour
        //   { time: '7:00 PM', value: 125, isHourMark: true },
        //   { time: '7:10 PM', value: 142 },
        //   { time: '7:20 PM', value: 165 },
        //   { time: '7:30 PM', value: 120 },
        //   { time: '7:40 PM', value: 115 },
        //   { time: '7:50 PM', value: 85 },

        //   // 8 PM hour
        //   { time: '8:00 PM', value: 110, isHourMark: true },
        //   { time: '8:10 PM', value: 145 },
        //   { time: '8:20 PM', value: 132 },
        //   { time: '8:30 PM', value: 120 },
        //   { time: '8:40 PM', value: 135 },
        //   { time: '8:50 PM', value: 148 },

        //   // 9 PM hour
        //   { time: '9:00 PM', value: 125, isHourMark: true },
        //   { time: '9:10 PM', value: 140 },
        //   { time: '9:20 PM', value: 110 },
        //   { time: '9:30 PM', value: 90 },
        //   { time: '9:40 PM', value: 105 },
        //   { time: '9:50 PM', value: 115 },

        //   // 10 PM hour
        //   { time: '10:00 PM', value: 50, isHourMark: true },
        //   { time: '10:10 PM', value: 75 },
        //   { time: '10:20 PM', value: 95 },
        //   { time: '10:30 PM', value: 125 },
        //   { time: '10:40 PM', value: 110 },
        //   { time: '10:50 PM', value: 90 },

        //   // 11 PM hour
        //   { time: '11:00 PM', value: 120, isHourMark: true },
        //   { time: '11:10 PM', value: 100 },
        //   { time: '11:20 PM', value: 85 },
        //   { time: '11:30 PM', value: 130 },
        //   { time: '11:40 PM', value: 145 },
        //   { time: '11:50 PM', value: 120 },

        //   // 12 PM hour
        //   { time: '12:00 PM', value: 100, isHourMark: true },
        //   { time: '12:10 PM', value: 115 },
        //   { time: '12:20 PM', value: 135 },
        //   { time: '12:30 PM', value: 150 },
        //   { time: '12:40 PM', value: 135 },
        //   { time: '12:50 PM', value: 145 },

        //   // 1 AM hour
        //   { time: '1:00 AM', value: 170, isHourMark: true },
        //   { time: '1:10 AM', value: 185 },
        //   { time: '1:20 AM', value: 165 },
        //   { time: '1:30 AM', value: 180 },
        //   { time: '1:40 AM', value: 195 },
        //   { time: '1:50 AM', value: 115 }
        // ];

        // setActivityData(data);
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
            <NoBrokerAccount showSearchBar={false}/>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Overview