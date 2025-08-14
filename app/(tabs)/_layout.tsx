import { Tabs } from 'expo-router';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Platform, Text, View } from 'react-native';
import icons from '@/constants/icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabIconProps {
  icon: any;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon = ({ icon, color, name, focused }: TabIconProps) => {
  return (
    <View className="flex flex-row items-center justify-center rounded-full">
      <View className="rounded-full w-15 h-12 items-center justify-center">
        {/* Icon section */}
        <View style={{ height: 24, marginBottom: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={icon}
            resizeMode='contain'
            tintColor={focused ? '#E74694' : '#898587'}
            style={{ width: 24, height: 24 }}
          />
        </View>

        {/* Text section - always gray */}
        <Text
          className={`font-InterRegular text-xs`}
          style={{
            color: '#898587', // Always gray for labels
            textAlign: 'center',
            width: '100%'
          }}
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {name}
        </Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 70 + insets.bottom : 70,
          backgroundColor: '#100E0F',
          // shadowColor: '#000',
          // shadowOffset: {
          //   width: 0,
          //   height: -1,
          // },
          // shadowOpacity: 0.1,
          // shadowRadius: 1,
          // elevation: 1,
        },
        tabBarItemStyle: {
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: '#E74694',   // Your new active color
        tabBarInactiveTintColor: '#898587'  // Keep gray for inactive
      }}
    >
      <Tabs.Screen
        name='overview'
        options={{
          title: 'Overview',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.overview}
              color={color}
              name='Overview'
              focused={focused}
            />
          )
        }}
      />
      <Tabs.Screen
        name='trade'
        options={{
          title: 'Trade',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.chart}
              color={color}
              name='Trade'
              focused={focused}
            />
          )
        }}
      />

      <Tabs.Screen
        name='positions'
        options={{
          title: 'Positions',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.positions}
              color={color}
              name='Positions'
              focused={focused}
            />
          )
        }}
      />

      <Tabs.Screen
        name='account'
        options={{
          title: 'Account',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.account}
              color={color}
              name='Account'
              focused={focused}
            />
          )
        }}
      />
    </Tabs>
  )
}