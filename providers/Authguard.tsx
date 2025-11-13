import { useAuth } from '@clerk/clerk-expo';
import { useSegments, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Wait for component to mount before doing any navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't do anything until auth is loaded and component has mounted
    if (!isLoaded || !hasMounted) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)' || segments[0] === 'menu';

    console.log('[AuthGuard] Navigation check:', {
      isSignedIn,
      pathname,
      segments: segments.join('/'),
      inAuthGroup,
      inProtectedGroup,
      hasMounted
    });

    // Prevent navigation loops by checking current path
    if (!isSignedIn && inProtectedGroup && !pathname.includes('/login')) {
      // User is not signed in but trying to access protected routes
      console.log('[AuthGuard] Redirecting to login - user not signed in');
      setIsNavigating(true);
      
      // Use a safer navigation approach
      setTimeout(() => {
        try {
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('[AuthGuard] Navigation error:', error);
          // Fallback: try again after a longer delay
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 500);
        } finally {
          setIsNavigating(false);
        }
      }, 50);
      
    } else if (isSignedIn && inAuthGroup && !pathname.includes('/overview')) {
      // User is signed in but on auth pages
      console.log('[AuthGuard] Redirecting to overview - user signed in');
      setIsNavigating(true);
      
      setTimeout(() => {
        try {
          router.replace('/(tabs)/overview');
        } catch (error) {
          console.error('[AuthGuard] Navigation error:', error);
          // Fallback: try again after a longer delay
          setTimeout(() => {
            router.replace('/(tabs)/overview');
          }, 500);
        } finally {
          setIsNavigating(false);
        }
      }, 50);
    }
  }, [isSignedIn, segments, isLoaded, hasMounted, pathname, router]);

  // Show loading while auth is loading, component hasn't mounted, or while navigating
  if (!isLoaded || !hasMounted || isNavigating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#000' 
      }}>
        <ActivityIndicator size="large" color="#e74694" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>
          {!isLoaded ? 'Loading authentication...' : 
           !hasMounted ? 'Initializing...' : 
           'Redirecting...'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}