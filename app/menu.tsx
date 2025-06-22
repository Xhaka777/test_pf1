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
import SeachInput from '@/components/SearchInput';
import NoPropFirmAccounts from '@/components/NoPropFirmAccounts';
import NoBrokerAccount from '@/components/NoBrokerAccount';

const Menu = () => {
  const { user } = useUser();
  const [selectedAccountType, setSelectedAccountType] = useState('propFirm');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const confirmSignOutSheetRef = useRef<BottomSheet>(null);
  const demoBottomSheetRef = useRef<BottomSheetModal>(null);

  const propFirmTabs = ['Evaluation', 'Funded'];
  const ownBrokerTabs = ['Live', 'Demo'];
  const tabs = selectedAccountType === 'propFirm' ? propFirmTabs : ownBrokerTabs;

  const [activeTab, setActiveTab] = useState(tabs[0]);

  //Reset active tab when account type changes
  const handleAccountTypeChange = (type: any) => {
    setSelectedAccountType(type);
    setActiveTab(type === 'propFirm' ? propFirmTabs[0] : ownBrokerTabs[0])
  }

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

  //Render account content based on active tab
  const renderAccountContent = () => {
    if (selectedAccountType === 'ownBroker' && activeTab === 'Demo') {
      return <SeachInput onDemoPress={handleDemoPress} />;
    }

    return (
      <View className='flex-1 justify-center items-center'>
        <Text className='text-white text-lg'>
          {selectedAccountType === 'propFirm'
            ? (activeTab === 'Evaluation' ? 'Evaluation Accounts' : 'Funded Accounts')
            : (activeTab === 'Live' ? 'Live Accounts' : 'Demo Accounts')
          }
        </Text>
      </View>
    )
  }


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
          <View className="flex-row px-3 py-2 space-x-3">
            <SelectableButton
              text="Prop Firm Account"
              isSelected={selectedAccountType === 'propFirm'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('propFirm')}
              additionalStyles="mr-3"
            />
            <SelectableButton
              text="Own Broker Accounts"
              isSelected={selectedAccountType === 'ownBroker'}
              selectedBorderColor="border-primary-100"
              unselectedBorderColor="border-gray-700"
              onPress={() => setSelectedAccountType('ownBroker')}
            />
          </View>
          <View className='flex-1'>
            {selectedAccountType === 'propFirm' ? (
              <NoPropFirmAccounts
                showTimePeriods={false}
                showMetrics={false}
                isMenuScreen={true}
              />
            ) : (
              <NoBrokerAccount
                showCart={false}
                showTimePeriods={false}
                showMetrics={false}
                isMenuScreen={true}
              />
            )}
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

      </SafeAreaView>

    </GestureHandlerRootView>
  );
};

export default Menu;