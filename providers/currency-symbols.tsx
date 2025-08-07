import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAccountDetails } from './account-details';
import { MessageType, parseWebSocketMessage } from '@/api/services/web-socket-parser';
import { TradingPair } from '@/api/schema/trading-service';
import { getWsPriceRequest } from '@/utils/symbols';
import { tokenManager } from '@/utils/websocket-token-manager';
import { CurrencyPair } from '@/api/utils/currency-trade';

interface CurrencySymbolContextType {
  currencySymbols: TradingPair[];
  findCurrencyPairBySymbol: (symbol: CurrencyPair | string) => TradingPair | undefined;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const CurrencySymbolContext = createContext<CurrencySymbolContextType>({
  currencySymbols: [],
  findCurrencyPairBySymbol: () => undefined, 
  isConnected: false,
  error: null,
  reconnect: () => { }
});

export function CurrencySymbolProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { accountDetails } = useAccountDetails();

  const [currencySymbols, setCurrencySymbols] = useState<TradingPair[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;

  const connectWebSocket = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !accountDetails || isConnectingRef.current) {
      return;
    }

    const { exchange, server } = accountDetails;
    if (!exchange || !server) return;

    if (socketRef.current) {
      socketRef.current.close(1000, 'Reconnecting');
      socketRef.current = null;
    }

    isConnectingRef.current = true;

    try {
      console.log('[CurrencySymbols] Getting WebSocket token...');
      const wsToken = await tokenManager.getToken(getToken);

      console.log('[CurrencySymbols] Connecting with new auth system...');
      console.log('wsToken', wsToken)

      const wsUrl = `wss://staging-server.propfirmone.com/all_prices?auth_key=${wsToken}`;
      const origin = 'https://staging.propfirmone.com';

      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      socketRef.current.onopen = () => {
        console.log('[CurrencySymbols] ✅ Connected with new auth!');
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0; 

        // Send subscription message
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const subscriptionMessage = getWsPriceRequest(exchange, server);
          // console.log('[CurrencySymbols] Sending subscription:', subscriptionMessage);
          socketRef.current.send(subscriptionMessage);
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const symbols = parseWebSocketMessage<TradingPair[]>(event.data, MessageType.ALL_PRICES);
          if (Array.isArray(symbols) && symbols.length > 0) {
            // console.log(`[CurrencySymbols] Received ${symbols.length} symbols`);
            setCurrencySymbols(symbols);
          }
        } catch (err) {
          console.error('[CurrencySymbols] Parse error:', err);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[CurrencySymbols] WebSocket error:', error);
        setIsConnected(false);
        setError(error.message || 'WebSocket connection failed');
        isConnectingRef.current = false;
      };

      socketRef.current.onclose = (event) => {
        console.log('[CurrencySymbols] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;

        // ✅ Only reconnect on unexpected closure AND if we haven't exceeded attempts
        if (!event.wasClean &&
          isSignedIn &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000) { // Don't reconnect on normal closure

          const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          console.log(`[CurrencySymbols] Scheduling reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('[CurrencySymbols] Max reconnection attempts reached');
          setError('Connection failed. Please try manual reconnect.');
        }
      };

    } catch (error) {
      console.error('[CurrencySymbols] Connection setup failed:', error);
      setError(error.message);
      setIsConnected(false);
      isConnectingRef.current = false;

      // ✅ Handle rate limiting with longer delay
      if (error.message.includes('429') || error.message.includes('Rate limited')) {
        console.log('[CurrencySymbols] Rate limited, waiting 60s before retry');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 60000);
      }
    }
  }, [isLoaded, isSignedIn, accountDetails, getToken]);

  const reconnect = useCallback(() => {
    console.log('[CurrencySymbols] Manual reconnection requested');
    reconnectAttemptsRef.current = 0;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    connectWebSocket();
  }, [connectWebSocket]);


  useEffect(() => {
    if (isLoaded && isSignedIn && accountDetails) {
      connectWebSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component cleanup');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isLoaded, isSignedIn, accountDetails?.id]); 

  // Clear state on sign out
  useEffect(() => {
    if (!isSignedIn) {
      setCurrencySymbols([]);
      setIsConnected(false);
      setError(null);
      reconnectAttemptsRef.current = 0;

      if (socketRef.current) {
        socketRef.current.close(1000, 'User signed out');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [isSignedIn]);


  const findCurrencyPairBySymbol = useCallback(
    (symbol: CurrencyPair | string): TradingPair | undefined => {
      return currencySymbols.find((pair) => pair.symbol === symbol);
    },
    [currencySymbols],
  );

  const value = {
    currencySymbols: isSignedIn ? currencySymbols : [],
    findCurrencyPairBySymbol,
    isConnected,
    error,
    reconnect
  };


  return (
    <CurrencySymbolContext.Provider value={value}>
      {children}
    </CurrencySymbolContext.Provider>
  );
}

export const useCurrencySymbol = () => useContext(CurrencySymbolContext);