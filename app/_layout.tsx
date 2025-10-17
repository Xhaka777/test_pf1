// app/_layout.tsx
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
import { ActivityIndicator, AppState, View } from 'react-native';
import { clerkTokenManager } from '@/utils/clerk-token-manager';
import ConnectionErrorScreen from '@/components/ConnectionErrorScreen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useNetwork } from '@/hooks/useNetwork';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env')
}

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
};

SplashScreen.preventAutoHideAsync();

// Create a wrapper component for the app content that checks network
function AppContent() {
  const isConnected = useNetwork(); // ADD THIS LINE instead

  // 3. REPLACE the existing network check with this:
  if (isConnected === null) {
    // Still checking connection
    return (
      <View className="flex-1 bg-[#100E0F] justify-center items-center">
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  if (!isConnected) {
    // No connection - show offline screen
    console.log('[App] 🚫 No connection - showing offline screen');
    return <ConnectionErrorScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='(auth)' options={{ headerShown: false }} />
      <Stack.Screen
        name='(tabs)'
        options={{
          headerShown: false,
          animation: 'none'
        }}
      />
      <Stack.Screen
        name='menu'
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initAuth = async () => {
      try {
        await clerkTokenManager.initialize();
        console.log('Auth system ready');
      } catch (error) {
        console.error('Auth init failed:', error);
      }
    };

    initAuth();

    return () => {
      clerkTokenManager.clearCache();
    };
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

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[App] App going to background/inactive')
      } else if (nextAppState === 'active') {
        console.log('[App] App becoming active')
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      console.log('[App] App terminating');
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <KeyboardProvider>
      <GestureHandlerRootView className='flex-1'>
        <BottomSheetModalProvider>
          {/* <NetworkProvider> */}
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
              <ClerkLoaded>
                <QueryProvider>
                  <AccountsProvider>
                    <AccountDetailsProvider>
                      <CurrencySymbolProvider>
                        <OpenPositionsProvider>
                          <AppContent />
                        </OpenPositionsProvider>
                      </CurrencySymbolProvider>
                    </AccountDetailsProvider>
                  </AccountsProvider>
                  <StatusBar style="auto" />
                </QueryProvider>
              </ClerkLoaded>
            </ClerkProvider>
          {/* </NetworkProvider> */}
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}