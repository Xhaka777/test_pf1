import { useAuth } from "@clerk/clerk-expo"
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import 'react-native-gesture-handler';

const Page = () => {
  // const { isSignedIn } = useAuth();
  const { isLoaded, isSignedIn } = useAuth();

  if (isSignedIn) return <Redirect href='/(tabs)/overview' />
  // return <Redirect href='/(auth)/login' />

  useEffect(() => {
    // Only navigate once everything is loaded
    if (!isLoaded) return;

    // Slight delay ensures layout and navigation system is ready
    const timeout = setTimeout(() => {
      if (isSignedIn) {
        router.replace("/(tabs)/overview");
      } else {
        router.replace("/(auth)/login");
      }
    }, 10); // 10–50ms is enough

    return () => clearTimeout(timeout);
    // }, []);
  }, [isLoaded, isSignedIn]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size='large' color='#ff13' />
    </View>
  )
}

export default Page;