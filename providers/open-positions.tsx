import { parseWebSocketMessage } from '../api/services/web-socket-parser';
import { WssRoutes } from '@/api/types';
import { getWSSBaseUrl } from '../api/services/api'
import {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from 'react'
import { OpenTradesData } from '@/api/schema/trading-service';
import { useAccounts } from '../providers/accounts';
import { every } from 'd3';

const OpenPositionsContext = createContext<{
    data: OpenTradesData | null;
    isConnected: boolean;
    reconnect: () => void;
} | null>(null);

export function OpenPositionsProvider({ children }: PropsWithChildren) {
    const [data, setData] = useState<OpenTradesData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxRexonnectAttempts = 5;
    const { selectedAccountId, selectedPreviewAccountId } = useAccounts();

    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
    }, [])

    const scheduleReconnect = useCallback(() => {
        clearReconnectTimeout();

        if (reconnectAttempts.current >= maxRexonnectAttempts) {
            console.log(`Max reconnection attempts (${maxRexonnectAttempts}) reached. Stopping reconnection attempts.`)
            return;
        }

        const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            3000,
        )
        reconnectAttempts.current++;

        console.log(`Scheduling reconnection attemo ${reconnectAttempts.current} in ${delay}ms`)

        reconnectTimeout.current = setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts.current}`);
            connectWebSocket();
            reconnectTimeout.current = null;
        }, delay)
    }, []);

    const connectWebSocket = useCallback(() => {
        //Don't connect if no account is selected
        if (!selectedAccountId && !selectedPreviewAccountId) {
            console.log('No account selected, skipping WebSocket connection');
            setIsConnected(false);
            return;
        }

        //Dont create new connection if already connection/connected
        if (
            socketRef.current?.readyState === WebSocket.CONNECTING ||
            socketRef.current?.readyState === WebSocket.OPEN
        ) {
            console.log('WebSocket already connecting/connected, skipping');
            return;
        }

        //Close existing connection if any
        if (socketRef.current) {
            console.log('Closing existing WebSocket connection');
            socketRef.current.close();
            socketRef.current = null;
        }

        const wsUrl = `${getWSSBaseUrl()}${WssRoutes.GET_OPEN_TRADES}?account=${selectedPreviewAccountId ?? selectedAccountId}`;
        console.log('Connecting to WebSocket:', wsUrl);

        try {
            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                console.log('WebSocket connection opened');
                setIsConnected(true);
                reconnectAttempts.current = 0;
                clearReconnectTimeout();
            };

            socketRef.current.onmessage = (event) => {
                try {
                    const result = parseWebSocketMessage<OpenTradesData>(event.data);

                    //Validate the received data sctructure
                    if (result && typeof result === 'object' && 'open_trades' in result) {
                        setData(result);
                    } else {
                        console.warn(
                            'Received invalid data structured from WebSocket:',
                            result,
                        )
                    }
                } catch (error) {
                    console.error(
                        'Failed to parse WebSocket message:',
                        error,
                        'Raw data:',
                        event.data
                    )
                }
            }

            socketRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);

                //
                if (!reconnectTimeout.current) {
                    scheduleReconnect();
                }
            }

            socketRef.current.onclose = (event) => {
                console.log('WebSocket connection closed: ', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                })

                setIsConnected(false);
                socketRef.current = null;

                if (!event.wasClean && !reconnectTimeout.current) {
                    scheduleReconnect();
                }
            }

        } catch (error) {
            console.log('Failed to create WebSocket connection:', error);
            setIsConnected(false);
            scheduleReconnect();
        }
    }, [
        selectedAccountId,
        selectedPreviewAccountId,
        scheduleReconnect,
        clearReconnectTimeout
    ])

    //Manual reconnect...
    const reconnect = useCallback(() => {
        console.log('Manual reconnection requested');
        reconnectAttempts.current = 0;
        clearReconnectTimeout();
        connectWebSocket();
    }, [connectWebSocket, clearReconnectTimeout]);


    useEffect(() => {
        connectWebSocket();

        return () => {
            console.log('Cleaning up WebSocket connection...');
            clearReconnectTimeout();

            if (socketRef.current) {
                // Set a flag to prevent reconnection on cleanup
                const socket = socketRef.current;
                socketRef.current = null;
                socket.close(1000, 'Component unmounting');
            }

            setIsConnected(false);
            setData(null);
        }
    }, [connectWebSocket, clearReconnectTimeout]);

    return (
        <OpenPositionsContext.Provider
            value={{
                data,
                isConnected,
                reconnect
            }}
        >
            {children}
        </OpenPositionsContext.Provider>
    )
}

export const useOpenPositionsWS = () => {
    const context = useContext(OpenPositionsContext);
    if (!context) {
        throw new Error(
            'useOpenPositions must be used within a OpenPositionsProvider',
        )
    }
    return context;
}