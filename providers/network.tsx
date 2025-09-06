// providers/network.tsx
import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  hasNetworkError: boolean;
  retryConnection: () => void;
  setNetworkError: (hasError: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  hasNetworkError: false,
  retryConnection: () => {},
  setNetworkError: () => {},
});

export function NetworkProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Monitor network connectivity
  useEffect(() => {
    console.log('[NetworkProvider] Setting up network monitoring');

    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('[NetworkProvider] Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details
      });

      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      // Clear network error when connection is restored
      if (state.isConnected && state.isInternetReachable) {
        console.log('[NetworkProvider] Connection restored, clearing network error');
        setHasNetworkError(false);
      } else if (!state.isConnected || state.isInternetReachable === false) {
        console.log('[NetworkProvider] Connection lost, setting network error');
        setHasNetworkError(true);
      }
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      console.log('[NetworkProvider] Initial network state:', state);
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      if (!state.isConnected || state.isInternetReachable === false) {
        setHasNetworkError(true);
      }
    });

    return () => {
      console.log('[NetworkProvider] Cleaning up network monitoring');
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
        NetInfo.fetch().then(state => {
          setIsConnected(state.isConnected ?? false);
          setIsInternetReachable(state.isInternetReachable);
          setConnectionType(state.type);

          if (state.isConnected && state.isInternetReachable) {
            setHasNetworkError(false);
          } else {
            setHasNetworkError(true);
          }
        });
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  const retryConnection = async () => {
    console.log('[NetworkProvider] Manual retry requested');
    
    try {
      const state = await NetInfo.fetch();
      console.log('[NetworkProvider] Retry - Network state:', state);
      
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      if (state.isConnected && state.isInternetReachable) {
        console.log('[NetworkProvider] Retry successful - connection restored');
        setHasNetworkError(false);
        return true;
      } else {
        console.log('[NetworkProvider] Retry failed - still no connection');
        setHasNetworkError(true);
        return false;
      }
    } catch (error) {
      console.error('[NetworkProvider] Error during retry:', error);
      setHasNetworkError(true);
      return false;
    }
  };

  const setNetworkError = (hasError: boolean) => {
    console.log('[NetworkProvider] Manual network error state change:', hasError);
    setHasNetworkError(hasError);
  };

  // Show error screen if:
  // 1. No network connection
  // 2. Network connected but no internet access
  // 3. Manual network error set by app components
  const shouldShowError = !isConnected || isInternetReachable === false || hasNetworkError;

  const contextValue: NetworkContextType = {
    isConnected,
    isInternetReachable,
    connectionType,
    hasNetworkError: shouldShowError,
    retryConnection,
    setNetworkError,
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