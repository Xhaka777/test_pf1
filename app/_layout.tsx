import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import 'react-native-gesture-handler'
import '../global.css'
import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo'
// import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from "expo-secure-store";
import { QueryProvider } from '@/providers/query';
import { AccountsProvider } from '@/providers/accounts';
import { CurrencySymbolProvider } from '@/providers/currency-symbols';
import { AccountDetailsProvider } from '@/providers/account-details';
import { AppState } from 'react-native';
import { WebSocketManager } from '@/services/websocket-manager';
import { OpenPositionsProvider } from '@/providers/open-positions';


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

  {/* load the font here, font from Figma project... */ }
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

  //listener for WebSocket cleanup
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[App] App going to background/inactive')
      } else if (nextAppState === 'active') {
        console.log('[App] App becoming active')
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    //Cleanup function for app termination
    return () => {
      subscription?.remove();
      //Cleanup WebSocket connections when app is terminated
      console.log('[App] App terminating, cleaning up WebSocket connections');
      WebSocketManager.cleanup();
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className='flex-1'>
      <BottomSheetModalProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={
          tokenCache
        }
        >
          <ClerkLoaded>
            <QueryProvider>
              <AccountsProvider>
                <AccountDetailsProvider>
                  <CurrencySymbolProvider>
                    <OpenPositionsProvider>
                      <Stack>
                        <Stack.Screen name='index' options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
                        <Stack.Screen name='menu'
                          options={{
                            headerShown: false,
                            animation: 'slide_from_right',
                          }}
                        />
                        <Stack.Screen name='assets'
                          options={{
                            headerShown: false,
                            // presentation: 'modal',
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}


