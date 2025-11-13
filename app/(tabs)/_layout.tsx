import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { svgTabIcons } from '@/components/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';

interface TabIconProps {
  focused: boolean;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  title: string;
}

// function TabIcon({ focused, icon: Icon, title }: TabIconProps) {
//   return (
//     <View style={[styles.tabContainer, focused && styles.focusedTabContainer]}>
//       <Icon 
//         width={24} 
//         height={24}
//         color={focused ? '#ec4899' : '#6b7280'} 
//       />
//       <Text style={[styles.tabLabel, focused && styles.focusedTabLabel]}>
//         {title}
//       </Text>
//     </View>
//   );
// }

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null; // loading state
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  // const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#100E0F',
          borderTopWidth: 0,
          elevation: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowColor: 'transparent',
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          paddingHorizontal: 16,
        },
        tabBarActiveTintColor: '#ec4899',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
          paddingVertical: 4,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
      }}
    >
      <Tabs.Screen
        name='overview'
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <svgTabIcons.overview
                width={28}
                height={28}
                color={focused ? '#ec4899' : '#6b7280'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='trade'
        options={{
          title: 'Trade',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <svgTabIcons.trade
                width={28}
                height={28}
                color={focused ? '#ec4899' : '#6b7280'}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='positions'
        options={{
          title: 'Positions',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <svgTabIcons.positions
                width={28}
                height={28}
                color={focused ? '#ec4899' : '#6b7280'}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='account'
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <svgTabIcons.account
                width={28}
                height={28}
                color={focused ? '#ec4899' : '#6b7280'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  )
}


const styles = StyleSheet.create({
  tabBarBackground: {
    backgroundColor: '#100E0F',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 5,
  },
});