import { MessageType, parseWebSocketMessage } from "@/api/services/web-socket-parser";
import { WssRoutes } from "@/api/types";
import { CurrencyPair } from "@/api/utils/currency-trade";
import { getWSSBaseUrl } from "@/api/services/api";
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react'
import { TradingPair } from "@/api/schema/trading-service";
import { useAccountDetails } from "./account-details";
import { getWsPriceRequest } from "@/utils/symbols";
import { useActiveSymbol } from "@/hooks/use-active-symbol";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

const CurrencySymbolContext = createContext<{
    currencySymbols: TradingPair[];
    findCurrencyPairBySymbol: (
        symbol: CurrencyPair | string,
    ) => TradingPair | undefined
} | null>(null);

function AuthenticatedCurrencySymbolProvider({ children }: PropsWithChildren) {
    const { accountDetails } = useAccountDetails();
    const [currencySymbols, setCurrencySymbols] = useState<TradingPair[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const [activeSymbol, setActiveSymbol] = useActiveSymbol();
    const searchParams = useGlobalSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        const symbolParam = searchParams.symbol as string;

        if (currencySymbols.length) {
            if (
                (!symbolParam && !activeSymbol) ||
                (symbolParam && !currencySymbols.find((pair) => pair.symbol === symbolParam))
            ) {
                setActiveSymbol(currencySymbols[0].symbol)
            }
        }
    }, [activeSymbol, currencySymbols, searchParams.symbol, setActiveSymbol])


    const connectWebSocket = useCallback(() => {
        if (!accountDetails) {
            return;
        }
        const { exchange, server } = accountDetails;
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            return;
        }

        socketRef.current = new WebSocket(
            getWSSBaseUrl() + WssRoutes.GET_ALL_PRICES,
        )

        socketRef.current.onopen = () => {
            if (
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
            ) {
                socketRef.current.send(getWsPriceRequest(exchange, server));
            }
        }

        socketRef.current.onmessage = (event) => {
            const symbols: TradingPair[] = parseWebSocketMessage<TradingPair[]>(
                event.data,
                MessageType.ALL_PRICES
            )
            setCurrencySymbols(symbols)
        }

        socketRef.current.onerror = (error) => {
            console.log('WebSocket error:', error);
            if (reconnectTimeout.current) return;
            reconnectTimeout.current = setTimeout(() => {
                console.log('Attempting to reconnect...');
                connectWebSocket();
                reconnectTimeout.current = null;
            }, 5000)
        }

        socketRef.current.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            if (!event.wasClean) {
                if (reconnectTimeout.current) return;
                reconnectTimeout.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connectWebSocket();
                    reconnectTimeout.current = null;
                }, 5000);
            }
        }

        return () => {
            socketRef.current?.close();
        }
    }, [accountDetails])

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
                reconnectTimeout.current = null;
            }
        }
    }, [connectWebSocket])


    const findCurrencyPairBySymbol = useCallback(
        (symbol: CurrencyPair | string): TradingPair | undefined => {
            return currencySymbols.find((pair) => pair.symbol === symbol)
        }, [currencySymbols])


    return (
        <CurrencySymbolContext.Provider
            value={{
                currencySymbols,
                findCurrencyPairBySymbol
            }}
        >
            {children}
        </CurrencySymbolContext.Provider>
    )
}

export function CurrencySymbolProvider({ children }: PropsWithChildren) {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded || !isSignedIn) {
        return (
            <CurrencySymbolContext.Provider
                value={{
                    currencySymbols: [],
                    findCurrencyPairBySymbol: () => undefined
                }}
            >
                {children}
            </CurrencySymbolContext.Provider>
        )
    }

    return (
        <AuthenticatedCurrencySymbolProvider>
            {children}
        </AuthenticatedCurrencySymbolProvider>
    )
}

export const useCurrencySymbol = () => {
    const context = useContext(CurrencySymbolContext);
    if (!context) {
        throw new Error(
            'useCurrencySymbol must be used within a CurrencySymbolProvide'
        )
    }
    return context;
}