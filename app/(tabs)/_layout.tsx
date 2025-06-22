import { Tabs } from 'expo-router';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';
import icons from '@/constants/icons';
import MaskedView from '@react-native-masked-view/masked-view';

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
          {focused ? (
            <MaskedView
              maskElement={
                <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    source={icon}
                    resizeMode='contain'
                    style={{ width: 24, height: 24, tintColor: 'black' }}
                  />
                </View>
              }
            >
              <LinearGradient
                colors={['#9061F9', '#7EDCE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: 24, height: 24 }}
              />
            </MaskedView>
          ) : (
            <Image
              source={icon}
              resizeMode='contain'
              tintColor={color}
              style={{ width: 24, height: 24 }}
            />
          )}
        </View>

        {/* Text section - consistent positioning */}
        <Text
          className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`}
          style={{
            color: focused ? '#9061F9' : color,
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          backgroundColor: '#100E0F',
        },
        tabBarItemStyle: {
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 4,
        },
        tabBarActiveTintColor: '#9061F9',
        tabBarInactiveTintColor: '#898587'
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