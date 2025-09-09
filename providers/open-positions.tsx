// 1. Fix in providers/open-positions.tsx
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAccounts } from './accounts';
import { parseWebSocketMessage } from '@/api/services/web-socket-parser';
import { OpenTradesData } from '@/api/schema/trading-service';
import { tokenManager } from '@/utils/websocket-token-manager';

interface OpenPositionsContextType {
  data: OpenTradesData | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  debug: {
    accountId: number;
    connectionAttempts: number;
    lastMessage: string | null;
    providerMounted: boolean;
    authState: string;
  };
}

const OpenPositionsContext = createContext<OpenPositionsContextType>({
  data: null,
  isConnected: false,
  error: null,
  reconnect: () => {},
  debug: { accountId: 0, connectionAttempts: 0, lastMessage: null, providerMounted: false, authState: 'unknown' }
});

export function OpenPositionsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { selectedAccountId, selectedPreviewAccountId, isLoading: accountsLoading } = useAccounts();
  
  const [data, setData] = useState<OpenTradesData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState({
    accountId: 0,
    connectionAttempts: 0,
    lastMessage: null as string | null,
    providerMounted: true,
    authState: 'unknown'
  });
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  
  // Current account ID to use
  const activeAccountId = selectedPreviewAccountId ?? selectedAccountId;

  // 🔧 FIX 1: Clear data when account changes
  useEffect(() => {
    // console.log('[OpenPositions] Account changed to:', activeAccountId);
    // Clear data when account changes to prevent showing stale data
    if (data && data.account !== activeAccountId) {
      // console.log('[OpenPositions] Clearing stale data for old account:', data.account);
      setData(null);
    }
    setError(null);
  }, [activeAccountId]);

  // 🔧 DEBUG: Log provider mount
  useEffect(() => {
    setDebug(prev => ({ ...prev, providerMounted: true }));
    
    return () => {
    };
  }, []);

  // 🔧 DEBUG: Log all state changes
  useEffect(() => {
    const authState = `loaded:${isLoaded},signed:${isSignedIn},accountsLoading:${accountsLoading}`;
    
    setDebug(prev => ({ 
      ...prev, 
      authState,
      accountId: activeAccountId || 0
    }));
  }, [isLoaded, isSignedIn, accountsLoading, activeAccountId]);

  const connectWebSocket = useCallback(async () => {
    
    // 🔧 FORCE CONNECTION: Reduce conditions to minimum
    if (!activeAccountId || activeAccountId <= 0) {
      return;
    }

    if (isConnectingRef.current) {
      return;
    }

    // 🔧 FIX 2: Properly close existing connection when switching accounts
    if (socketRef.current) {
      socketRef.current.close(1000, 'Account changed');
      socketRef.current = null;
    }

    // Reset connection state
    isConnectingRef.current = true;
    setIsConnected(false);
    setError(null);
    
    // Update debug info
    setDebug(prev => ({
      ...prev,
      accountId: activeAccountId,
      connectionAttempts: prev.connectionAttempts + 1
    }));

    try {
      
      // Get token
      const wsToken = await tokenManager.getToken(getToken);
      
      const wsUrl = `wss://staging-server.propfirmone.com/get_open_trades?auth_key=${wsToken}&account=${activeAccountId}`;
      const origin = 'https://staging.propfirmone.com';
      
      // console.log('[OpenPositions] Connecting to account:', activeAccountId);
      
      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      socketRef.current.onopen = () => {
        // console.log('[OpenPositions] ✅ Connected to account:', activeAccountId);
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        
        setDebug(prev => ({
          ...prev,
          lastMessage: event.data.substring(0, 100)
        }));

        try {
          const result = parseWebSocketMessage<OpenTradesData>(event.data);
          
          if (result && typeof result === 'object' && 'open_trades' in result) {
            // console.log('[OpenPositions] 📊 Received data for account:', result.account, 
            //   'expected:', activeAccountId, 'trades:', result.open_trades?.length || 0);
            
            // 🔧 FIX 3: Only update data if it's for the correct account
            if (result.account === activeAccountId) {
              setData(result);
            } else {
              console.warn('[OpenPositions] ⚠️ Received data for wrong account:', 
                result.account, 'expected:', activeAccountId);
            }
          }
        } catch (parseError) {
          // console.error('[OpenPositions] Parse error:', parseError);
        }
      };

      socketRef.current.onerror = (error) => {
        // console.error('[OpenPositions] WebSocket error for account', activeAccountId, ':', error);
        setIsConnected(false);
        setError(error.message || 'WebSocket connection failed');
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        // console.log('[OpenPositions] WebSocket closed for account', activeAccountId, 
        //   'code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

    } catch (error) {
      // console.error('[OpenPositions] Connection error for account', activeAccountId, ':', error);
      setError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [activeAccountId, getToken, data?.account]); // Added data?.account to dependencies

  // 🔧 FIX 4: Improved connection trigger
  useEffect(() => {
    if (activeAccountId && activeAccountId > 0) {
      // console.log('[OpenPositions] Triggering connection for account:', activeAccountId);
      
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Small delay to ensure everything is ready, but shorter delay
      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 500); // Reduced from 2000ms to 500ms

      return () => {
        clearTimeout(timeout);
      };
    } else {
      // console.log('[OpenPositions] No valid account ID, clearing data');
      setData(null);
      setError(null);
      setIsConnected(false);
    }
  }, [connectWebSocket]); // Only depend on connectWebSocket

  const reconnect = useCallback(() => {
    // console.log('[OpenPositions] Manual reconnect requested for account:', activeAccountId);
    reconnectAttemptsRef.current = 0;
    setError(null);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmount');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    data: data,  // Return data regardless of sign-in status for debugging
    isConnected,
    error,
    reconnect,
    debug
  };

  return (
    <OpenPositionsContext.Provider value={value}>
      {children}
    </OpenPositionsContext.Provider>
  );
}

export const useOpenPositionsWS = (): OpenPositionsContextType => {
  const context = useContext(OpenPositionsContext);
  if (!context) {
    return {
      data: null,
      isConnected: false,
      error: 'Hook used outside provider',
      reconnect: () => {},
      debug: { accountId: 0, connectionAttempts: 0, lastMessage: null, providerMounted: false, authState: 'no-context' }
    };
  }
  return context;
};