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
}

const OpenPositionsContext = createContext<OpenPositionsContextType>({
  data: null,
  isConnected: false,
  error: null,
  reconnect: () => {}
});

export function OpenPositionsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { selectedAccountId, selectedPreviewAccountId, isLoading: accountsLoading } = useAccounts();
  
  const [data, setData] = useState<OpenTradesData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3; // ✅ Reduced attempts
  
  // Current account ID to use
  const activeAccountId = selectedPreviewAccountId ?? selectedAccountId;

  const connectWebSocket = useCallback(async () => {
    if (!isLoaded || !isSignedIn || accountsLoading || isConnectingRef.current) {
      console.log('[OpenPositions] Not ready for connection:', { 
        isLoaded, 
        isSignedIn, 
        accountsLoading,
        isConnecting: isConnectingRef.current 
      });
      return;
    }

    const accountId = activeAccountId;
    
    // Don't connect if no account is selected
    if (!accountId || accountId <= 0) {
      console.log('[OpenPositions] No account selected, skipping connection');
      setIsConnected(false);
      setData(null);
      return;
    }

    // Close existing connection gracefully
    if (socketRef.current) {
      console.log('[OpenPositions] Closing existing connection');
      socketRef.current.close(1000, 'Reconnecting');
      socketRef.current = null;
    }

    isConnectingRef.current = true;

    try {
      console.log('[OpenPositions] Getting WebSocket token for account:', accountId);
      const wsToken = await tokenManager.getToken(getToken);
      
      console.log('[OpenPositions] Connecting with cached/new token...');
      
      
      const wsUrl = `wss://staging-server.propfirmone.com/get_open_trades?auth_key=${wsToken}&account=${accountId}`;
      const origin = 'https://staging.propfirmone.com';
      
      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      socketRef.current.onopen = () => {
        console.log('[OpenPositions] ✅ Connected with token for account:', accountId);
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      socketRef.current.onmessage = (event) => {
        try {
          const result = parseWebSocketMessage<OpenTradesData>(event.data);
          
          if (result && typeof result === 'object' && 'open_trades' in result) {
            if (result.account === accountId) {
              console.log(`[OpenPositions] Received data for account ${accountId}:`, {
                openTrades: result.open_trades?.length || 0,
                openOrders: result.open_orders?.length || 0,
                otherOpenTrades: result.other_open_trades?.length || 0,
                otherOpenOrders: result.other_open_orders?.length || 0
              });
              setData(result);
            } else {
              console.warn('[OpenPositions] Received data for different account:', 
                result.account, 'Expected:', accountId);
            }
          } else {
            console.warn('[OpenPositions] Received invalid data structure:', result);
          }
        } catch (parseError) {
          console.error('[OpenPositions] Parse error:', parseError);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[OpenPositions] WebSocket error:', error);
        setIsConnected(false);
        
        // ✅ Better error handling for HTTP 200
        if (error.message.includes('200')) {
          setError('Server returned HTTP 200 instead of WebSocket upgrade. This endpoint might not support WebSocket connections.');
        } else {
          setError(error.message || 'WebSocket connection failed');
        }
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        console.log('[OpenPositions] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // ✅ Don't reconnect if we get HTTP 200 error (endpoint issue)
        const isEndpointIssue = event.reason?.includes('200') || error?.includes('200');
        
        if (!event.wasClean && 
            isSignedIn && 
            accountId > 0 &&
            reconnectAttemptsRef.current < maxReconnectAttempts &&
            !isEndpointIssue &&
            event.code !== 1000) {
          
          const delay = Math.min(10000 * Math.pow(2, reconnectAttemptsRef.current), 60000); // Longer delays
          reconnectAttemptsRef.current++;
          
          console.log(`[OpenPositions] Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (isEndpointIssue) {
          console.log('[OpenPositions] HTTP 200 error - endpoint might not support WebSocket connections');
          setError('This endpoint might not support WebSocket connections. Please check with backend team.');
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('[OpenPositions] Max reconnection attempts reached');
          setError('Max reconnection attempts reached. Please try manual reconnect.');
        }
      };

    } catch (error) {
      console.error('[OpenPositions] Connection setup failed:', error);
      setError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;
      
      // Handle rate limiting
      if (error.message.includes('429') || error.message.includes('Rate limited')) {
        console.log('[OpenPositions] Rate limited, waiting 60s before retry');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 60000);
      }
    }
  }, [isLoaded, isSignedIn, accountsLoading, activeAccountId, getToken, error]);

  const reconnect = useCallback(() => {
    console.log('[OpenPositions] Manual reconnection requested');
    reconnectAttemptsRef.current = 0;
    setError(null); // Clear previous errors
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);

  // ✅ Only connect when account actually changes
  const previousAccountIdRef = useRef<number>(0);
  
  useEffect(() => {
    if (activeAccountId !== previousAccountIdRef.current) {
      console.log('[OpenPositions] Account changed from', previousAccountIdRef.current, 'to', activeAccountId);
      previousAccountIdRef.current = activeAccountId;
      
      setData(null);
      setIsConnected(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      
      if (socketRef.current) {
        socketRef.current.close(1000, 'Account change');
      }
      
      // Small delay to prevent rapid connections
      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 2000); // ✅ 2 second delay

      return () => clearTimeout(timeout);
    }
  }, [activeAccountId, connectWebSocket]);

  // Clear state on sign out
  useEffect(() => {
    if (!isSignedIn) {
      console.log('[OpenPositions] User signed out, cleaning up');
      setData(null);
      setIsConnected(false);
      setError(null);
      reconnectAttemptsRef.current = 0;
      previousAccountIdRef.current = 0;
      
      if (socketRef.current) {
        socketRef.current.close(1000, 'User signed out');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [isSignedIn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[OpenPositions] Component unmounting, cleaning up');
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmount');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    data: isSignedIn ? data : null,
    isConnected,
    error,
    reconnect
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
    console.warn('useOpenPositions must be used within a OpenPositionsProvider');
    return {
      data: null,
      isConnected: false,
      error: null,
      reconnect: () => {}
    };
  }
  return context;
};