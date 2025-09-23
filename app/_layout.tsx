// app/_layout.tsx - FIXED VERSION with proper screen transitions
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import 'react-native-gesture-handler'
import '../global.css'
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from "expo-secure-store";
import { QueryProvider } from '@/providers/query';
import { AccountsProvider } from '@/providers/accounts';
import { CurrencySymbolProvider } from '@/providers/currency-symbols';
import { AccountDetailsProvider } from '@/providers/account-details';
import { OpenPositionsProvider } from '@/providers/open-positions';
import { AppState } from 'react-native';
import { clerkTokenManager } from '@/utils/clerk-token-manager';
import { NetworkProvider, useNetwork } from '@/providers/network';
import ConnectionErrorScreen from '@/components/ConnectionErrorScreen';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  )
}

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { hasNetworkError } = useNetwork();

  useEffect(() => {
    clerkTokenManager.initialize().then(() => {
      console.log('[App] Token manager ready');
    }).catch((error) => {
      console.error('[App] Token manager initialization failed:', error);
    });
  }, []);

  const [loaded] = useFonts({
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
    "Inter-ExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
    "Inter-Italic": require("../assets/fonts/Inter-Italic.ttf"),
    "Inter-Light": require("../assets/fonts/Inter-Light.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf")
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Simple app state listener (WebSocketManager no longer needed)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[App] App going to background/inactive')
      } else if (nextAppState === 'active') {
        console.log('[App] App becoming active')
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Simple cleanup
    return () => {
      subscription?.remove();
      console.log('[App] App terminating');
    }
  }, []);

  if (!loaded) {
    return null;
  }

  if (hasNetworkError) {
    return <ConnectionErrorScreen />;
  }

  return (
    <GestureHandlerRootView className='flex-1'>
      <BottomSheetModalProvider>
        <NetworkProvider>
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
              <QueryProvider>
                <AccountsProvider>
                  <AccountDetailsProvider>
                    <CurrencySymbolProvider>
                      <OpenPositionsProvider>
                        <Stack>
                          <Stack.Screen name='index' options={{ headerShown: false }} />
                          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
                          <Stack.Screen 
                            name='(tabs)' 
                            options={{ 
                              headerShown: false,
                              animation: 'none' // No animation to avoid glitching
                            }} 
                          />
                          <Stack.Screen 
                            name='menu'
                            options={{
                              headerShown: false,
                              // Menu slides in from right to left
                              animation: 'slide_from_right',
                              // Enable gesture navigation
                              gestureEnabled: true,
                              gestureDirection: 'horizontal',
                            }}
                          />
                          <Stack.Screen 
                            name='assets'
                            options={{
                              headerShown: false,
                              animation: 'slide_from_right',
                              animationTypeForReplace: 'push'
                            }}
                          />
                        </Stack>
                      </OpenPositionsProvider>
                    </CurrencySymbolProvider>
                  </AccountDetailsProvider>
                </AccountsProvider>
                <StatusBar style="auto" />
              </QueryProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </NetworkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}