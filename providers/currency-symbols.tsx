import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useState,
    useMemo
} from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { MessageType } from "@/api/services/web-socket-parser";
import { WssRoutes } from "@/api/types";
import { CurrencyPair } from "@/api/utils/currency-trade";
import { TradingPair } from "@/api/schema/trading-service";
import { useAccountDetails } from "@/providers/account-details";
import { getWsPriceRequest } from "@/utils/symbols";
import { useActiveSymbolAtom } from "../hooks/use-active-symbol";
import { WebSocketManager, ConnectionStatus } from "@/services/websocket-manager";

// Types
interface CurrencySymbolContextType {
    currencySymbols: TradingPair[];
    findCurrencyPairBySymbol: (symbol: CurrencyPair | string) => TradingPair | undefined;
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    reconnect: () => void;
    error: string | null;
}

// Default context value
const defaultContextValue: CurrencySymbolContextType = {
    currencySymbols: [],
    findCurrencyPairBySymbol: () => undefined,
    isConnected: false,
    connectionStatus: 'disconnected',
    reconnect: () => {},
    error: null
};

const CurrencySymbolContext = createContext<CurrencySymbolContextType>(defaultContextValue);

export const useCurrencySymbol = (): CurrencySymbolContextType => {
    const context = useContext(CurrencySymbolContext);
    
    if (!context) {
        console.warn('useCurrencySymbol used outside of provider, returning defaults');
        return defaultContextValue;
    }
    
    return context;
};

export function CurrencySymbolProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();
    const { accountDetails } = useAccountDetails();
    const [activeSymbol, setActiveSymbol] = useActiveSymbolAtom();

    // State
    const [currencySymbols, setCurrencySymbols] = useState<TradingPair[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    // WebSocket manager instance
    const wsManager = useMemo(() => WebSocketManager.getInstance(), []);
    
    // Connection ID for this provider
    const connectionId = 'currency-symbols';

    // Handle auth state changes - cleanup when user signs out
    useEffect(() => {
        if (!isSignedIn) {
            console.log('[CurrencySymbols] User signed out, cleaning up WebSocket');
            wsManager.closeConnection(connectionId);
            setCurrencySymbols([]);
            setError(null);
            setConnectionStatus('disconnected');
        }
    }, [isSignedIn, wsManager]);

    // Handle WebSocket connection based on account details
    useEffect(() => {
        if (!isLoaded || !isSignedIn || !accountDetails) {
            return;
        }

        const { exchange, server } = accountDetails;
        if (!exchange || !server) {
            console.warn('[CurrencySymbols] Missing exchange or server information');
            return;
        }

        const subscriptionMessage = getWsPriceRequest(exchange, server);

        console.log('[CurrencySymbols] Setting up WebSocket connection:', { exchange, server });

        // Create WebSocket connection using the manager
        wsManager.createConnection({
            id: connectionId,
            endpoint: WssRoutes.GET_ALL_PRICES,
            subscriptionMessage,
            messageType: MessageType.ALL_PRICES,
            onMessage: (symbols: TradingPair[]) => {
                console.log(`[CurrencySymbols] Received ${symbols?.length || 0} symbols`);
                setCurrencySymbols(symbols || []);
                setError(null);
            },
            onOpen: () => {
                console.log('[CurrencySymbols] WebSocket connection opened');
                setConnectionStatus('connected');
                setError(null);
            },
            onClose: () => {
                console.log('[CurrencySymbols] WebSocket connection closed');
                setConnectionStatus('disconnected');
            },
            onError: (errorMessage: string) => {
                console.error('[CurrencySymbols] WebSocket error:', errorMessage);
                setError(errorMessage);
                setConnectionStatus('error');
            },
            maxReconnectAttempts: 5
        });

        // Update connection status periodically
        const statusInterval = setInterval(() => {
            const status = wsManager.getConnectionStatus(connectionId);
            setConnectionStatus(status);
        }, 2000);

        return () => {
            clearInterval(statusInterval);
            wsManager.closeConnection(connectionId);
        };
    }, [isLoaded, isSignedIn, accountDetails, wsManager]);

    // Set default active symbol when symbols are loaded
    useEffect(() => {
        if (currencySymbols.length > 0 && !activeSymbol) {
            console.log('[CurrencySymbols] Setting default active symbol:', currencySymbols[0].symbol);
            setActiveSymbol(currencySymbols[0].symbol);
        }
    }, [currencySymbols, activeSymbol, setActiveSymbol]);

    // Find currency pair function
    const findCurrencyPairBySymbol = useCallback(
        (symbol: CurrencyPair | string): TradingPair | undefined => {
            return currencySymbols.find((pair) => pair.symbol === symbol);
        }, 
        [currencySymbols]
    );

    // Manual reconnection function
    const reconnect = useCallback(() => {
        console.log('[CurrencySymbols] Manual reconnection requested');
        wsManager.reconnectConnection(connectionId);
    }, [wsManager]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        currencySymbols: isSignedIn ? currencySymbols : [],
        findCurrencyPairBySymbol,
        isConnected: connectionStatus === 'connected',
        connectionStatus,
        reconnect,
        error
    }), [currencySymbols, isSignedIn, findCurrencyPairBySymbol, connectionStatus, reconnect, error]);

    return (
        <CurrencySymbolContext.Provider value={contextValue}>
            {children}
        </CurrencySymbolContext.Provider>
    );
}