// providers/open-positions.tsx - FORCE CONNECTION DEBUG VERSION
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
    console.log('[OpenPositions] 🚀 PROVIDER MOUNTED');
    setDebug(prev => ({ ...prev, providerMounted: true }));
    
    return () => {
      console.log('[OpenPositions] 💀 PROVIDER UNMOUNTING');
    };
  }, []);

  // 🔧 DEBUG: Log all state changes
  useEffect(() => {
    const authState = `loaded:${isLoaded},signed:${isSignedIn},accountsLoading:${accountsLoading}`;
    console.log('[OpenPositions] 📊 STATE CHANGE:', {
      isLoaded,
      isSignedIn,
      accountsLoading,
      activeAccountId,
      authState
    });
    
    setDebug(prev => ({ 
      ...prev, 
      authState,
      accountId: activeAccountId || 0
    }));
  }, [isLoaded, isSignedIn, accountsLoading, activeAccountId]);

  const connectWebSocket = useCallback(async () => {
    console.log('[OpenPositions] 🔄 connectWebSocket called - ENTRY POINT');
    
    // 🔧 FORCE CONNECTION: Reduce conditions to minimum
    if (!activeAccountId || activeAccountId <= 0) {
      console.log('[OpenPositions] ❌ No account ID, cannot connect:', activeAccountId);
      return;
    }

    if (isConnectingRef.current) {
      console.log('[OpenPositions] ⏳ Already connecting, skipping');
      return;
    }

    console.log('[OpenPositions] ✅ All conditions met, proceeding with connection');

    // Close existing connection
    if (socketRef.current) {
      console.log('[OpenPositions] 🔄 Closing existing connection');
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
      console.log('[OpenPositions] 🔑 Getting WebSocket token for account:', activeAccountId);
      
      // Get token
      const wsToken = await tokenManager.getToken(getToken);
      console.log('[OpenPositions] ✅ Got WebSocket token:', wsToken ? 'YES' : 'NO');
      
      const wsUrl = `wss://staging-server.propfirmone.com/get_open_trades?auth_key=${wsToken}&account=${activeAccountId}`;
      const origin = 'https://staging.propfirmone.com';
      
      console.log('[OpenPositions] 🔗 Creating WebSocket connection...');
      console.log('[OpenPositions] 🔗 URL pattern: wss://staging-server.propfirmone.com/get_open_trades?auth_key=TOKEN&account=' + activeAccountId);
      
      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      console.log('[OpenPositions] 🔗 WebSocket created, setting up event handlers...');

      socketRef.current.onopen = () => {
        console.log('[OpenPositions] ✅ WebSocket OPENED SUCCESSFULLY for account:', activeAccountId);
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        console.log('[OpenPositions] 📨 MESSAGE RECEIVED:', event.data.substring(0, 200) + '...');
        
        setDebug(prev => ({
          ...prev,
          lastMessage: event.data.substring(0, 100)
        }));

        try {
          const result = parseWebSocketMessage<OpenTradesData>(event.data);
          console.log('[OpenPositions] 📊 PARSED RESULT:', {
            hasResult: !!result,
            resultType: typeof result,
            hasOpenTrades: result && 'open_trades' in result,
            accountInResult: result?.account,
            expectedAccount: activeAccountId,
            openTradesCount: result?.open_trades?.length || 0
          });
          
          if (result && typeof result === 'object' && 'open_trades' in result) {
            console.log('[OpenPositions] ✅ VALID DATA STRUCTURE RECEIVED');
            
            if (result.account === activeAccountId) {
              console.log('[OpenPositions] ✅ ACCOUNT MATCH - SETTING DATA');
              setData(result);
            } else {
              console.warn('[OpenPositions] ⚠️ ACCOUNT MISMATCH:', 
                'received:', result.account, 'expected:', activeAccountId);
              // Set data anyway for debugging
              console.log('[OpenPositions] 🔧 Setting data anyway for debugging purposes');
              setData(result);
            }
          } else {
            console.warn('[OpenPositions] ⚠️ INVALID DATA STRUCTURE');
          }
        } catch (parseError) {
          console.error('[OpenPositions] ❌ PARSE ERROR:', parseError);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[OpenPositions] ❌ WebSocket ERROR:', error);
        setIsConnected(false);
        setError(error.message || 'WebSocket connection failed');
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        console.log('[OpenPositions] 🔌 WebSocket CLOSED:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      console.log('[OpenPositions] ✅ WebSocket setup complete, waiting for connection...');

    } catch (error) {
      console.error('[OpenPositions] ❌ CONNECTION SETUP FAILED:', error);
      setError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [activeAccountId, getToken]);

  // 🔧 FORCE: Try connection immediately when account is available
  useEffect(() => {
    console.log('[OpenPositions] 🔄 MAIN CONNECTION EFFECT TRIGGERED:', {
      activeAccountId,
      hasAccount: !!activeAccountId && activeAccountId > 0
    });

    if (activeAccountId && activeAccountId > 0) {
      console.log('[OpenPositions] 🚀 FORCING CONNECTION ATTEMPT');
      
      // Small delay to ensure everything is ready
      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 2000);

      return () => {
        console.log('[OpenPositions] 🧹 Cleaning up connection timeout');
        clearTimeout(timeout);
      };
    } else {
      console.log('[OpenPositions] ⏸️ No account ID, not connecting');
    }
  }, [activeAccountId, connectWebSocket]);

  const reconnect = useCallback(() => {
    console.log('[OpenPositions] 🔄 MANUAL RECONNECT REQUESTED');
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
      console.log('[OpenPositions] 🧹 CLEANUP - Component unmounting');
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

  console.log('[OpenPositions] 🔄 PROVIDER RENDER:', {
    hasData: !!data,
    isConnected,
    error: !!error,
    debugInfo: debug
  });

  return (
    <OpenPositionsContext.Provider value={value}>
      {children}
    </OpenPositionsContext.Provider>
  );
}

export const useOpenPositionsWS = (): OpenPositionsContextType => {
  const context = useContext(OpenPositionsContext);
  if (!context) {
    console.warn('[OpenPositions] ⚠️ Hook used outside provider!');
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