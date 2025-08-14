import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// export default TabBar;
type TabBarProps = {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
  selectedAccountType: string;
  showCounts?: boolean;
  tabCounts?: Record<string, number>;
}


const TabBar = ({
  tabs,
  activeTab,
  onTabPress,
  selectedAccountType,
  showCounts = false,
  tabCounts = {}
}: TabBarProps) => {

  return (
    <View className='px-3 pt-2'>
      <View className='relative'>
        <View className='flex-row justify-start pb-2'>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              className='mr-6'
              onPress={() => onTabPress(tab)}
            >
              <View className='items-center'>
                <Text className={`text-white font-InterSemiBold text-base ${activeTab === tab ? 'opacity-100' : 'opacity-70'}`}>
                  {tab} <Text className={`${activeTab === tab ? 'text-primary-100' : 'text-white'}`}>
                    ({showCounts && tabCounts[tab] !== undefined && `${tabCounts[tab]}`})
                  </Text>
                </Text>
                {/* Active underline */}
                <View className={`h-0.5 mt-1 ${activeTab === tab ? 'bg-primary-100 w-full' : 'bg-transparent'}`} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default TabBar;