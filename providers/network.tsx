import React, { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  hasNetworkError: boolean;
  retryConnection: () => Promise<boolean>;
  setNetworkError: (hasError: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  hasNetworkError: false,
  retryConnection: async () => true,
  setNetworkError: () => {},
});

export function NetworkProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  
  // Use ref to prevent multiple simultaneous checks
  const isCheckingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check network state
  const checkNetworkState = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) {
      console.log('[NetworkProvider] Already checking network, skipping');
      return !hasNetworkError;
    }

    isCheckingRef.current = true;

    try {
      const state = await NetInfo.fetch();
      console.log('[NetworkProvider] Network check result:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable;

      setIsConnected(connected);
      setIsInternetReachable(reachable);
      setConnectionType(state.type);

      // Determine if there's a network error
      const hasError = !connected || reachable === false;

      if (hasError) {
        console.log('[NetworkProvider] ❌ Network error detected');
        setHasNetworkError(true);
        return false;
      } else {
        console.log('[NetworkProvider] ✅ Network connection is good');
        setHasNetworkError(false);
        return true;
      }
    } catch (error) {
      console.error('[NetworkProvider] Error checking network:', error);
      setHasNetworkError(true);
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, [hasNetworkError]);

  // Debounced network check to prevent rapid state changes
  const debouncedNetworkCheck = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      checkNetworkState();
    }, 300); // 300ms debounce
  }, [checkNetworkState]);

  // Initial check on mount
  useEffect(() => {
    console.log('[NetworkProvider] Setting up network monitoring');
    checkNetworkState();
  }, [checkNetworkState]);

  // Monitor network connectivity with NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('[NetworkProvider] Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable;

      setIsConnected(connected);
      setIsInternetReachable(reachable);
      setConnectionType(state.type);

      // Update error state with debouncing to handle rapid changes
      if (!connected || reachable === false) {
        console.log('[NetworkProvider] Connection lost, setting network error');
        setHasNetworkError(true);
      } else if (connected && reachable === true) {
        // Connection restored - clear error immediately
        console.log('[NetworkProvider] Connection restored, clearing network error immediately');
        setHasNetworkError(false);
        
        // Clear any pending debounced checks
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      }
    });

    return () => {
      console.log('[NetworkProvider] Cleaning up network monitoring');
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      unsubscribe();
    };
  }, []);

  // Monitor app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('[NetworkProvider] App state changed:', appState, '->', nextAppState);
      
      // When app becomes active, recheck network status
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[NetworkProvider] App became active, rechecking network...');
        setTimeout(() => checkNetworkState(), 500);
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, checkNetworkState]);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    console.log('[NetworkProvider] Manual retry requested');
    
    // Wait a moment before checking
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await checkNetworkState();
    console.log('[NetworkProvider] Retry result:', result);
    return result;
  }, [checkNetworkState]);

  const setNetworkErrorManually = useCallback((hasError: boolean) => {
    console.log('[NetworkProvider] Manual network error state change:', hasError);
    setHasNetworkError(hasError);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: NetworkContextType = {
    isConnected,
    isInternetReachable,
    connectionType,
    hasNetworkError,
    retryConnection,
    setNetworkError: setNetworkErrorManually,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}