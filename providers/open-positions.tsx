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

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close(1000, 'Reconnecting');
      socketRef.current = null;
    }

    isConnectingRef.current = true;
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
      
      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      socketRef.current.onopen = () => {
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
            
            if (result.account === activeAccountId) {
              setData(result);
            } else {
              // Set data anyway for debugging
              setData(result);
            }
          } else {
          }
        } catch (parseError) {
        }
      };

      socketRef.current.onerror = (error) => {
        setIsConnected(false);
        setError(error.message || 'WebSocket connection failed');
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        
        setIsConnected(false);
        isConnectingRef.current = false;
      };

    } catch (error) {
      setError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [activeAccountId, getToken]);

  // 🔧 FORCE: Try connection immediately when account is available
  useEffect(() => {

    if (activeAccountId && activeAccountId > 0) {
      
      // Small delay to ensure everything is ready
      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 2000);

      return () => {
        clearTimeout(timeout);
      };
    } else {
    }
  }, [activeAccountId, connectWebSocket]);

  const reconnect = useCallback(() => {
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