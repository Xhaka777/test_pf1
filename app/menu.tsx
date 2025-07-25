import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUser } from '@clerk/clerk-expo';

import MenuHeader from '@/components/Header/menuHeader';
import SelectableButton from '@/components/SelectableButton';
import Profile from '@/components/Profile';
import BottomSheet, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import ProfileBottomSheet from '@/components/ProfileBottomSheet';
import ConfirmBottomSheet from '@/components/ConfirmBottomSheet';
import DemoAccBottomSheet from '@/components/AccountBottomSheet';
import BrokerBottomSheet from '@/components/overview/BrokerBottomSheet'; // Import the dynamic bottom sheet
import SeachInput from '@/components/SearchInput';
import NoPropFirmAccounts from '@/components/NoPropFirmAccounts';
import NoBrokerAccount from '@/components/NoBrokerAccount';

// Import icons for bottom sheet configuration
import { EvaluatedAccountIcon } from '@/components/icons/EvaluatedAccountIcon';
import { FundedAccountIcon } from '@/components/icons/FundedAccountIcon';
import AccountIcon from '@/components/icons/AccountIcon';
import { PracticeIcon } from '@/components/icons/PracticeIcon';

const Menu = () => {
  const { user } = useUser();
  
  // Updated state to use the three account types
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const [selectedAccount, setSelectedAccount] = useState(null); // For bottom sheet
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const confirmSignOutSheetRef = useRef<BottomSheet>(null);
  const demoBottomSheetRef = useRef<BottomSheetModal>(null);
  const accountBottomSheetRef = useRef<BottomSheetModal>(null); // New ref for account details

  // Mock account data - replace with your actual data source
  const mockAccountData = {
    propFirm: [
      {
        id: 1,
        name: 'FTMO Challenge',
        balance: 50000,
        dailyPL: 1250,
        changePercentage: 2.5,
        type: 'Evaluation',
        currency: 'USD',
        firm: 'FTMO',
        phase: 'Phase 1',
        target: 5000,
        daysRemaining: 25,
        startingBalance: 50000,
      },
      {
        id: 2,
        name: 'FTMO Funded',
        balance: 100000,
        dailyPL: 2500,
        changePercentage: 15.5,
        type: 'Funded',
        currency: 'USD',
        firm: 'FTMO',
        phase: 'Funded',
        startingBalance: 100000,
      }
    ],
    brokerage: [
      {
        id: 3,
        name: 'IC Markets Live',
        balance: 25000,
        dailyPL: -150,
        changePercentage: -0.6,
        type: 'Live',
        currency: 'USD',
        broker: 'IC Markets',
        leverage: '1:500',
        server: 'ICMarkets-Live01',
        totalPL: 1500,
        startingBalance: 23500,
      }
    ],
    practice: [
      {
        id: 4,
        name: 'XM Demo',
        balance: 10000,
        dailyPL: 75,
        changePercentage: 0.75,
        type: 'Demo',
        currency: 'USD',
        broker: 'XM Global',
        leverage: '1:100',
        server: 'XM-Demo',
        totalPL: 75,
        startingBalance: 10000,
      }
    ]
  };

  // Get account configuration for bottom sheet
  const getAccountConfig = (accountType: string) => {
    const configs = {
      Evaluation: {
        bgColor: '#4A1D96',
        textColor: 'text-white',
        labelColor: 'bg-purple-900',
        borderColor: 'border-purple-500',
        icon: EvaluatedAccountIcon,
        iconSize: 32,
      },
      Funded: {
        bgColor: '#014737',
        textColor: 'text-white',
        labelColor: 'bg-green-900',
        borderColor: 'border-green-500',
        icon: FundedAccountIcon,
        iconSize: 32,
      },
      Live: {
        bgColor: '#633112',
        textColor: 'text-white',
        labelColor: 'bg-red-900',
        borderColor: 'border-red-500',
        icon: AccountIcon,
        iconSize: 40,
      },
      Demo: {
        bgColor: '#7744AA',
        textColor: 'text-white',
        labelColor: 'bg-yellow-900',
        borderColor: 'border-yellow-500',
        icon: PracticeIcon,
        iconSize: 40,
      },
    };
    
    return configs[accountType] || configs.Demo;
  };

  // Get stats data for bottom sheet
  const getStatsData = (accountType: string) => {
    const statsConfigs = {
      Evaluation: {
        winPercentage: 72.5,
        lossPercentage: 27.5,
        avgWinAmount: '$245',
        avgLossAmount: '-$89',
        winRate: '18.5%',
        profitFactor: '1.85',
      },
      Funded: {
        winPercentage: 68.8,
        lossPercentage: 31.2,
        avgWinAmount: '$520',
        avgLossAmount: '-$180',
        winRate: '22.3%',
        profitFactor: '2.15',
      },
      Live: {
        winPercentage: 58.2,
        lossPercentage: 41.8,
        avgWinAmount: '$180',
        avgLossAmount: '-$120',
        winRate: '15.2%',
        profitFactor: '1.25',
      },
      Demo: {
        winPercentage: 62.5,
        lossPercentage: 37.5,
        avgWinAmount: '$85',
        avgLossAmount: '-$45',
        winRate: '12.8%',
        profitFactor: '1.45',
      },
    };
    
    return statsConfigs[accountType] || statsConfigs.Demo;
  };

  // Handle sign out
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

  // Handle profile press (passed to Profile component)
  const handleProfilePress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  //Handle confirm signOut press (passed to ProfileBottomSheet reusable component...)
  const handleConfirmSignOutPress = useCallback(() => {
    bottomSheetRef.current?.forceClose();
    confirmSignOutSheetRef.current?.expand();
  }, []);

  const handleDemoPress = useCallback(() => {
    demoBottomSheetRef.current?.present();
  }, []);

  // Handle account press - opens account details bottom sheet
  const handleAccountPress = useCallback((account: any) => {
    setSelectedAccount(account);
    accountBottomSheetRef.current?.present();
  }, []);

  // Handle trade press from bottom sheet
  const handleTradePress = useCallback((accountData: any) => {
    console.log('Trade pressed for account:', accountData?.name);
    accountBottomSheetRef.current?.dismiss();
    // Navigate to trading screen
    // navigation.navigate('TradingScreen', { accountData });
  }, []);

  // Render account content based on selected account type
  const renderAccountContent = () => {
    switch (selectedAccountType) {
      case 'propFirm':
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}
            hideTabBar={false} // Show tab bar for Evaluation/Funded
            // Pass mock data or actual data
            mockAccounts={mockAccountData.propFirm}
          />
        );
      
      case 'brokerage':
        return (
          <NoBrokerAccount
            showCart={false}
            showTimePeriods={false}
            showMetrics={false}
            showTabs={true} // Show tabs
            isMenuScreen={true}
            presetActiveTab="Live"
            hideTabBar={false} // Show tab bar
            showOnlyPresetTab={true} // Show only Live tab
            // Pass mock data or actual data
            mockAccounts={mockAccountData.brokerage}
          />
        );
      
      case 'practice':
        return (
          <NoBrokerAccount
            showCart={false}
            showTimePeriods={false}
            showMetrics={false}
            showTabs={true} // Show tabs
            isMenuScreen={true}
            presetActiveTab="Demo"
            hideTabBar={false} // Show tab bar
            showOnlyPresetTab={true} // Show only Demo tab
            // Pass mock data or actual data
            mockAccounts={mockAccountData.practice}
          />
        );
      
      default:
        return (
          <NoPropFirmAccounts
            showTimePeriods={false}
            showMetrics={false}
            isMenuScreen={true}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView className='flex-1 bg-propfirmone-main'>
      <SafeAreaView className="bg-propfirmone-main flex-1">
        <MenuHeader onSignOut={handleSignOut} />

        {/* Main content */}
        <View className="flex-1">
          <View className="px-6 pb-2 mt-3">
            <Text className="text-white text-xl text-start font-InterSemiBold">
              Switch Account
            </Text>
          </View>
          
          {/* Three Account Type Buttons */}
          <View className="flex-row px-3 py-2 space-x-2">
            <SelectableButton
              text="Prop Firm"
              isSelected={selectedAccountType === 'propFirm'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('propFirm')}
              additionalStyles="flex-1"
            />
            <SelectableButton
              text="Brokerage"
              isSelected={selectedAccountType === 'brokerage'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('brokerage')}
              additionalStyles="flex-1 mx-2"
            />
            <SelectableButton
              text="Practice"
              isSelected={selectedAccountType === 'practice'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('practice')}
              additionalStyles="flex-1"
            />
          </View>
          
          {/* Account Content */}
          <View className='flex-1'>
            {renderAccountContent()}
          </View>
        </View>

        {/* Profile at bottom */}
        <View>
          <View className="h-0.5 bg-propfirmone-100 mx-4" />
          <Profile
            onProfilePress={handleProfilePress}
            planName="Free Plan" />
        </View>

        <ProfileBottomSheet
          bottomSheetRef={bottomSheetRef}
          onSignOutPress={handleConfirmSignOutPress}
        />

        <ConfirmBottomSheet
          bottomSheetRef={bottomSheetRef}
          confirmSignOutSheetRef={confirmSignOutSheetRef}
        />

        <DemoAccBottomSheet
          bottomSheetRef={demoBottomSheetRef}
        />

        {/* Dynamic Account Details Bottom Sheet */}
        {selectedAccount && (
          <BrokerBottomSheet
            bottomSheetRef={accountBottomSheetRef}
            accountData={{
              ...selectedAccount,
              balance: `${selectedAccount.currency || 'USD'} ${selectedAccount.balance.toLocaleString()}`,
              dailyPL: `${selectedAccount.dailyPL >= 0 ? '+' : ''}${selectedAccount.currency || 'USD'} ${Math.abs(selectedAccount.dailyPL).toLocaleString()}`,
              changePercentage: `${selectedAccount.changePercentage >= 0 ? '+' : ''}${selectedAccount.changePercentage.toFixed(2)}%`,
            }}
            accountTypeConfig={getAccountConfig(selectedAccount.type)}
            onTradePress={handleTradePress}
            statsData={getStatsData(selectedAccount.type)}
          />
        )}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Menu;