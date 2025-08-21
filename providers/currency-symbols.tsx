// providers/currency-symbols.tsx - Fixed with Live Price Updates
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useAccountDetails } from './account-details';
import { MessageType, parseWebSocketMessage } from '@/api/services/web-socket-parser';
import { TradingPair } from '@/api/schema/trading-service';
import { getWsPriceRequest } from '@/utils/symbols';
import { tokenManager } from '@/utils/websocket-token-manager';
import { CurrencyPair } from '@/api/utils/currency-trade';

interface CurrencySymbolContextType {
  // Core symbols that are always available
  coreSymbols: TradingPair[];
  // All symbols (loaded on demand)
  allSymbols: TradingPair[];
  // Loading states
  isLoadingCore: boolean;
  isLoadingAll: boolean;
  // Functions
  findCurrencyPairBySymbol: (symbol: CurrencyPair | string) => TradingPair | undefined;
  loadAllSymbols: () => void;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const CurrencySymbolContext = createContext<CurrencySymbolContextType>({
  coreSymbols: [],
  allSymbols: [],
  isLoadingCore: true,
  isLoadingAll: false,
  findCurrencyPairBySymbol: () => undefined,
  loadAllSymbols: () => {},
  isConnected: false,
  error: null,
  reconnect: () => {}
});

// Define core symbols that should be loaded immediately
const CORE_SYMBOLS = ['BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'ETHUSD'];

export function CurrencySymbolProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { accountDetails } = useAccountDetails();

  // Symbol states with live updates
  const [allSymbols, setAllSymbols] = useState<TradingPair[]>([]);
  const [isLoadingCore, setIsLoadingCore] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [allSymbolsLoaded, setAllSymbolsLoaded] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  
  // Use Map for faster symbol lookups and updates
  const symbolsMapRef = useRef<Map<string, TradingPair>>(new Map());

  // Derived core symbols from all symbols
  const coreSymbols = useMemo(() => {
    return allSymbols.filter(symbol => CORE_SYMBOLS.includes(symbol.symbol));
  }, [allSymbols]);

  // Optimized symbol lookup with Map for O(1) performance
  const findCurrencyPairBySymbol = useCallback(
    (symbol: CurrencyPair | string): TradingPair | undefined => {
      return symbolsMapRef.current.get(symbol);
    },
    [],
  );

  // Function to update a single symbol's price (for live updates)
  const updateSymbolPrice = useCallback((symbol: string, newPrice: number, bid?: number, ask?: number) => {
    const existingSymbol = symbolsMapRef.current.get(symbol);
    if (existingSymbol) {
      const updatedSymbol = {
        ...existingSymbol,
        marketPrice: newPrice,
        bid: bid ?? existingSymbol.bid,
        ask: ask ?? existingSymbol.ask,
      };
      
      symbolsMapRef.current.set(symbol, updatedSymbol);
      
      // Update the arrays
      setAllSymbols(prev => 
        prev.map(s => s.symbol === symbol ? updatedSymbol : s)
      );
    }
  }, []);

  // Function to load all symbols (called on demand)
  const loadAllSymbols = useCallback(() => {
    console.log('[CurrencySymbols] loadAllSymbols called - symbols already available');
    setAllSymbolsLoaded(true);
    setIsLoadingAll(false);
  }, []);

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

      const wsUrl = `wss://staging-server.propfirmone.com/all_prices?auth_key=${wsToken}`;
      const origin = 'https://staging.propfirmone.com';

      socketRef.current = new WebSocket(wsUrl, undefined, {
        headers: { 'Origin': origin }
      });

      socketRef.current.onopen = () => {
        console.log('[CurrencySymbols] ✅ Connected with live price updates!');
        setIsConnected(true);
        setError(null);
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;

        // Send subscription message
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          const subscriptionMessage = getWsPriceRequest(exchange, server);
          socketRef.current.send(subscriptionMessage);
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const symbols = parseWebSocketMessage<TradingPair[]>(event.data, MessageType.ALL_PRICES);
          if (Array.isArray(symbols) && symbols.length > 0) {
            // Update the symbols map for O(1) lookups
            symbols.forEach(symbol => {
              symbolsMapRef.current.set(symbol.symbol, symbol);
            });
            
            // Update all symbols state (this triggers live updates)
            setAllSymbols(symbols);
            setIsLoadingCore(false);
            setIsLoadingAll(false);
            
            if (symbols.length > 0) {
              // console.log(`[CurrencySymbols] Live update: ${symbols.length} symbols with latest prices`);
            }
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

        if (!event.wasClean &&
          isSignedIn &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          event.code !== 1000) {

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

  useEffect(() => {
    if (!isSignedIn) {
      setAllSymbols([]);
      setIsConnected(false);
      setError(null);
      setIsLoadingCore(true);
      setIsLoadingAll(false);
      setAllSymbolsLoaded(false);
      reconnectAttemptsRef.current = 0;
      symbolsMapRef.current.clear();

      if (socketRef.current) {
        socketRef.current.close(1000, 'User signed out');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [isSignedIn]);

  const value = useMemo(() => ({
    coreSymbols: isSignedIn ? coreSymbols : [],
    allSymbols: isSignedIn ? allSymbols : [],
    isLoadingCore,
    isLoadingAll,
    findCurrencyPairBySymbol,
    loadAllSymbols,
    isConnected,
    error,
    reconnect
  }), [
    isSignedIn,
    coreSymbols,
    allSymbols,
    isLoadingCore,
    isLoadingAll,
    findCurrencyPairBySymbol,
    loadAllSymbols,
    isConnected,
    error,
    reconnect
  ]);

  return (
    <CurrencySymbolContext.Provider value={value}>
      {children}
    </CurrencySymbolContext.Provider>
  );
}

export const useCurrencySymbol = () => useContext(CurrencySymbolContext);