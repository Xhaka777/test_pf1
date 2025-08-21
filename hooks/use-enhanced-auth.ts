import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState, useCallback } from 'react';
import { clerkTokenManager } from '@/utils/clerk-token-manager';

export function useEnhancedAuth() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isTokenManagerReady, setIsTokenManagerReady] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>('loading');

  // Initialize token manager
  useEffect(() => {
    clerkTokenManager.initialize().then(() => {
      console.log('[EnhancedAuth] Token manager initialized');
      setIsTokenManagerReady(true);
    }).catch((error) => {
      console.error('[EnhancedAuth] Token manager initialization error:', error);
      setIsTokenManagerReady(true); // Don't block the app
    });
  }, []);

  // Monitor Clerk state and token status
  useEffect(() => {
    if (isLoaded && isSignedIn && isTokenManagerReady) {
      // Check if we have a valid cached token
      const tokenInfo = clerkTokenManager.getTokenInfo();
      
      if (tokenInfo.hasToken && tokenInfo.isValid) {
        setTokenStatus('valid');
        console.log('[EnhancedAuth] Using cached token, expires in:', tokenInfo.expiresIn, 'minutes');
      } else {
        // Need to refresh token
        refreshTokenStatus();
      }
    } else if (isLoaded && !isSignedIn) {
      setTokenStatus('invalid');
      clerkTokenManager.clearCache(); // Clear cache when signed out
    }
  }, [isLoaded, isSignedIn, isTokenManagerReady]);

  const refreshTokenStatus = useCallback(async () => {
    if (!isSignedIn || !isLoaded || !isTokenManagerReady) {
      setTokenStatus('invalid');
      return;
    }

    try {
      setTokenStatus('loading');
      const token = await clerkTokenManager.getToken(getToken);
      
      if (token) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('invalid');
      }
    } catch (error) {
      console.error('[EnhancedAuth] Error refreshing token:', error);
      setTokenStatus('error');
    }
  }, [isSignedIn, isLoaded, isTokenManagerReady, getToken]);

  // Force refresh token
  const forceRefresh = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn || !isLoaded || !isTokenManagerReady) {
      return null;
    }

    try {
      setTokenStatus('loading');
      const token = await clerkTokenManager.forceRefresh(getToken);
      setTokenStatus(token ? 'valid' : 'invalid');
      return token;
    } catch (error) {
      console.error('[EnhancedAuth] Error force refreshing token:', error);
      setTokenStatus('error');
      return null;
    }
  }, [isSignedIn, isLoaded, isTokenManagerReady, getToken]);

  return {
    isLoaded,
    isSignedIn,
    isReady: isLoaded && isTokenManagerReady,
    tokenStatus,
    forceRefresh,
    refreshTokenStatus,
    // Token info for debugging
    getTokenInfo: clerkTokenManager.getTokenInfo.bind(clerkTokenManager),
  };
}