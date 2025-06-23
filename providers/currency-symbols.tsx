import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    useMemo
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import { MessageType, parseWebSocketMessage } from "@/api/services/web-socket-parser";
import { WssRoutes } from "@/api/types";
import { CurrencyPair } from "@/api/utils/currency-trade";
import { getWSSBaseUrl } from "@/api/services/api";
import { TradingPair } from "@/api/schema/trading-service";
import { useAccountDetails } from "@/providers/account-details";
import { getWsPriceRequest } from "@/utils/symbols";
import { useActiveSymbolAtom } from "../hooks/use-active-symbol";

// Types
interface CurrencySymbolContextType {
    currencySymbols: TradingPair[];
    findCurrencyPairBySymbol: (symbol: CurrencyPair | string) => TradingPair | undefined;
    isConnected: boolean;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    reconnect: () => void;
    error: string | null;
}

// Default context value - provides safe defaults
const defaultContextValue: CurrencySymbolContextType = {
    currencySymbols: [],
    findCurrencyPairBySymbol: () => undefined,
    isConnected: false,
    connectionStatus: 'disconnected',
    reconnect: () => {},
    error: null
};

// Create context with default value (no null checking needed)
const CurrencySymbolContext = createContext<CurrencySymbolContextType>(defaultContextValue);

// Custom hook with better error handling
export const useCurrencySymbol = (): CurrencySymbolContextType => {
    const context = useContext(CurrencySymbolContext);
    
    // This should never happen with our setup, but keeping for safety
    if (!context) {
        console.warn('useCurrencySymbol used outside of provider, returning defaults');
        return defaultContextValue;
    }
    
    return context;
};

// Separate WebSocket manager class for better separation of concerns
class WebSocketManager {
    private ws: WebSocket | null = null;
    private url: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isManuallyDisconnected = false;

    private onOpenCallback?: () => void;
    private onMessageCallback?: (data: any) => void;
    private onErrorCallback?: (error: string) => void;
    private onCloseCallback?: () => void;
    private onStatusChangeCallback?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;

    connect(url: string, message: string) {
        this.url = url;
        this.isManuallyDisconnected = false;
        this.cleanup();
        this.establishConnection(message);
    }

    private establishConnection(message: string) {
        if (this.isManuallyDisconnected || !this.url) return;

        this.onStatusChangeCallback?.('connecting');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[CurrencySymbols] WebSocket connected');
                this.reconnectAttempts = 0;
                this.onStatusChangeCallback?.('connected');
                this.onOpenCallback?.();
                
                // Send subscription message
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(message);
                }
            };

            this.ws.onmessage = (event: MessageEvent) => {
                try {
                    const symbols: TradingPair[] = parseWebSocketMessage<TradingPair[]>(
                        event.data,
                        MessageType.ALL_PRICES
                    );
                    this.onMessageCallback?.(symbols);
                } catch (error) {
                    console.error('[CurrencySymbols] Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error: Event) => {
                console.error('[CurrencySymbols] WebSocket error:', error);
                this.onStatusChangeCallback?.('error');
                this.onErrorCallback?.('WebSocket connection error');
            };

            this.ws.onclose = (event: CloseEvent) => {
                console.log('[CurrencySymbols] WebSocket closed:', event.code, event.reason);
                this.onStatusChangeCallback?.('disconnected');
                this.onCloseCallback?.();
                
                // Only attempt reconnection if not manually disconnected
                if (!this.isManuallyDisconnected && !event.wasClean) {
                    this.scheduleReconnect(message);
                }
            };

        } catch (error) {
            console.error('[CurrencySymbols] Failed to create WebSocket:', error);
            this.onStatusChangeCallback?.('error');
            this.onErrorCallback?.('Failed to create WebSocket connection');
            this.scheduleReconnect(message);
        }
    }

    private scheduleReconnect(message: string) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isManuallyDisconnected) {
            console.log('[CurrencySymbols] Max reconnection attempts reached or manually disconnected');
            this.onErrorCallback?.('Connection failed after maximum retry attempts');
            return;
        }

        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        console.log(`[CurrencySymbols] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        this.reconnectTimeout = setTimeout(() => {
            this.establishConnection(message);
        }, delay);
    }

    disconnect() {
        this.isManuallyDisconnected = true;
        this.cleanup();
    }

    private cleanup() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            // Remove event listeners to prevent callbacks
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close(1000, 'Component cleanup');
            }
            this.ws = null;
        }
    }

    manualReconnect(message: string) {
        console.log('[CurrencySymbols] Manual reconnection requested');
        this.reconnectAttempts = 0;
        this.isManuallyDisconnected = false;
        this.cleanup();
        if (this.url) {
            this.establishConnection(message);
        }
    }

    // Event handlers
    onOpen(callback: () => void) {
        this.onOpenCallback = callback;
    }

    onMessage(callback: (data: any) => void) {
        this.onMessageCallback = callback;
    }

    onError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    onClose(callback: () => void) {
        this.onCloseCallback = callback;
    }

    onStatusChange(callback: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void) {
        this.onStatusChangeCallback = callback;
    }

    getConnectionState(): 'disconnected' | 'connecting' | 'connected' | 'error' {
        if (!this.ws) return 'disconnected';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSED:
            case WebSocket.CLOSING:
                return 'disconnected';
            default:
                return 'error';
        }
    }
}

// Main Provider Component
export function CurrencySymbolProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();
    const { accountDetails } = useAccountDetails();
    const [activeSymbol, setActiveSymbol] = useActiveSymbolAtom();

    // State
    const [currencySymbols, setCurrencySymbols] = useState<TradingPair[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    const [error, setError] = useState<string | null>(null);

    // Refs
    const wsManagerRef = useRef<WebSocketManager | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Initialize WebSocket manager
    useEffect(() => {
        wsManagerRef.current = new WebSocketManager();
        const wsManager = wsManagerRef.current;

        wsManager.onMessage((symbols: TradingPair[]) => {
            setCurrencySymbols(symbols);
            setError(null);
        });

        wsManager.onStatusChange((status) => {
            setConnectionStatus(status);
        });

        wsManager.onError((errorMessage) => {
            setError(errorMessage);
        });

        return () => {
            wsManager.disconnect();
        };
    }, []);

    // Handle auth state changes - cleanup when user signs out
    useEffect(() => {
        if (!isSignedIn && wsManagerRef.current) {
            console.log('[CurrencySymbols] User signed out, cleaning up WebSocket');
            wsManagerRef.current.disconnect();
            setCurrencySymbols([]);
            setError(null);
            setConnectionStatus('disconnected');
        }
    }, [isSignedIn]);

    // Handle WebSocket connection based on account details
    useEffect(() => {
        const wsManager = wsManagerRef.current;
        
        if (!wsManager || !isLoaded || !isSignedIn || !accountDetails) {
            return;
        }

        const { exchange, server } = accountDetails;
        const wsUrl = getWSSBaseUrl() + WssRoutes.GET_ALL_PRICES;
        const subscriptionMessage = getWsPriceRequest(exchange, server);

        console.log('[CurrencySymbols] Connecting to WebSocket:', { exchange, server });
        wsManager.connect(wsUrl, subscriptionMessage);

        return () => {
            wsManager.disconnect();
        };
    }, [isLoaded, isSignedIn, accountDetails]);

    // Handle app state changes (foreground/background)
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            const wsManager = wsManagerRef.current;
            
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground
                console.log('[CurrencySymbols] App came to foreground, checking connection');
                if (wsManager && accountDetails && isSignedIn) {
                    const { exchange, server } = accountDetails;
                    const subscriptionMessage = getWsPriceRequest(exchange, server);
                    wsManager.manualReconnect(subscriptionMessage);
                }
            } else if (nextAppState.match(/inactive|background/)) {
                // App went to background
                console.log('[CurrencySymbols] App went to background');
                // Note: We don't disconnect on background to maintain real-time data
                // The WebSocket will handle reconnection when needed
            }
            
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        
        return () => {
            subscription?.remove();
        };
    }, [accountDetails, isSignedIn]);

    // Set default active symbol when symbols are loaded
    useEffect(() => {
        if (currencySymbols.length > 0 && !activeSymbol) {
            console.log('[CurrencySymbols] Setting default active symbol');
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
        const wsManager = wsManagerRef.current;
        if (wsManager && accountDetails && isSignedIn) {
            console.log('[CurrencySymbols] Manual reconnection requested');
            const { exchange, server } = accountDetails;
            const subscriptionMessage = getWsPriceRequest(exchange, server);
            wsManager.manualReconnect(subscriptionMessage);
        }
    }, [accountDetails, isSignedIn]);

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