import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null; // or loading spinner
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/overview" />;
  }

  return <Redirect href="/(auth)/login" />;
}