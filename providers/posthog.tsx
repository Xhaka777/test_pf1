// providers/posthog.tsx
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import PostHog from 'posthog-react-native';
import { useAuth } from '@clerk/clerk-expo';

interface PostHogContextType {
  posthog: PostHog | null;
  isInitialized: boolean;
  identify: (userId: string, properties?: Record<string, any>) => void;
  track: (event: string, properties?: Record<string, any>) => void;
  reset: () => void;
}

const PostHogContext = createContext<PostHogContextType>({
  posthog: null,
  isInitialized: false,
  identify: () => {},
  track: () => {},
  reset: () => {},
});

export function PostHogProvider({ children }: PropsWithChildren) {
  const [posthog, setPostHog] = useState<PostHog | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isSignedIn } = useAuth();

  useEffect(() => {
    const initializePostHog = async () => {
      try {
        // console.log('[PostHog] Initializing...');
        
        const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
        const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

        if (!posthogKey) {
          // console.warn('[PostHog] Missing EXPO_PUBLIC_POSTHOG_KEY in environment variables');
          return;
        }

        if (!posthogHost) {
          // console.warn('[PostHog] Missing EXPO_PUBLIC_POSTHOG_HOST in environment variables');
          return;
        }
        
        const client = new PostHog(
          posthogKey,
          {
            host: posthogHost,
            enableSessionReplay: false, // Disable for mobile performance
            captureApplicationLifecycleEvents: true,
            captureDeepLinks: true,
            debug: __DEV__, // Enable debug in development
            flushAt: 20, // Send events in batches of 20
            flushInterval: 30, // Send events every 30 seconds
          }
        );

        setPostHog(client);
        setIsInitialized(true);
        // console.log('[PostHog] ✅ Initialized successfully');
      } catch (error) {
        // console.error('[PostHog] ❌ Initialization failed:', error);
      }
    };

    initializePostHog();
  }, []);

  // Identify user when signed in
  useEffect(() => {
    if (isInitialized && posthog && isSignedIn && user) {
      // console.log('[PostHog] Identifying user:', user.id);
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        platform: 'mobile',
        app_version: '1.0.3', // You can get this from app.json
      });
    }
  }, [isInitialized, posthog, isSignedIn, user]);

  // Reset on sign out
  useEffect(() => {
    if (isInitialized && posthog && !isSignedIn) {
      // console.log('[PostHog] Resetting user session');
      posthog.reset();
    }
  }, [isInitialized, posthog, isSignedIn]);

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (posthog && isInitialized) {
      // console.log('[PostHog] Manual identify:', userId);
      posthog.identify(userId, properties);
    }
  };

  const track = (event: string, properties?: Record<string, any>) => {
    if (posthog && isInitialized) {
      // console.log('[PostHog] Tracking event:', event, properties);
      posthog.capture(event, properties);
    }
  };

  const reset = () => {
    if (posthog && isInitialized) {
      // console.log('[PostHog] Manual reset');
      posthog.reset();
    }
  };

  const contextValue = {
    posthog,
    isInitialized,
    identify,
    track,
    reset,
  };

  return (
    <PostHogContext.Provider value={contextValue}>
      {children}
    </PostHogContext.Provider>
  );
}

export const usePostHog = () => {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within PostHogProvider');
  }
  return context;
};