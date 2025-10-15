import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import {
    AccountDetails,
    OpenOrderDataSchemaType,
    OpenTradesData,
    UpdateOrderInput,
} from '../api/schema';
import { getAPIBaseUrl, StatusEnum } from '../api/services/api';
import { atomStore, onChartTradingEnabledAtom, oneClickTradingEnabledAtom, updateOrderCheckboxAtom } from '@/atoms';
import { useAtom, useAtomValue } from 'jotai';
import {
    useCancelOrderMutation,
    useUpdateOrderMutation,
    useUpdateSlMutation,
    useUpdateTpMutation
} from '@/api/hooks/trade-service';
import { useOpenTradesManager } from '@/api/hooks/use-open-trades-manager';
import { OrderTypeEnum, PositionTypeEnum, TakeProfitSlTypeEnum } from '@/shared/enums';
import { useOpenPositionsWS } from '@/providers/open-positions';
import { useChartTradingDialog } from './ChartTradingDialogProvider';
import { useConfirmationDialog } from '@/hooks/use-confitmation-dialog';
import EditPositionBottomSheet from './EditPositionBottomSheet';
import ClosePositionBottomSheet from './ClosePositionBottomSheet';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-expo';
import { tokenManager } from '@/utils/websocket-token-manager';
import * as FileSystem from 'expo-file-system';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Asset } from 'expo-asset';


interface TradingViewChartProps {
    selectedAccountId: number;
    accountDetails: AccountDetails;
    userId: string;
    symbol: string;
    interval?: string;
    datafeedUrl?: string;
    fullscreen?: boolean;
    autosize?: boolean;
    className?: string;
}

interface WebViewMessage {
    type: string;
    data?: any;
}

const SL_COLOR = '#FF0000';
const TP_COLOR = '#49c596';
const POSITION_COLOR = '#582c11';

const TradingChart = memo(function TradingViewChart(
    props: TradingViewChartProps,
) {

    const { isSignedIn, isLoaded, getToken } = useAuth();
    const { t } = useTranslation();
    const [onChartTradingEnabled, setOnChartTradingEnabled] = useAtom(
        onChartTradingEnabledAtom,
    );
    const oneClickTradingEnabled = useAtomValue(oneClickTradingEnabledAtom);
    const { requestPosition, setIsOpen, setIsLoading } = useChartTradingDialog();
    const { question } = useConfirmationDialog();

    const webViewRef = useRef<WebView>(null);
    const baseUrl = `${FileSystem.bundleDirectory}charting_assets/`;
    const [isReady, setIsReady] = useState(false);
    const [closePositionDialogVisible, setClosePositionDialogVisible] = useState(false);
    const [editPositionDialogVisible, setEditPositionDialogVisible] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<
        OpenTradesData['open_trades'][number] | null
    >(null);

    const [editOrderDialogVisible, setEditOrderDialogVisible] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<
        OpenTradesData['open_orders'][number] | null
    >(null);

    //for close position bottom sheet
    const closePositionBottomSheetRef = useRef<BottomSheetModal>(null);
    const [closePositionDialogLoading, setClosePositionDialogLoading] = useState(false);

    // Send WebSocket token when ready
    useEffect(() => {
        if (isReady) {
            // You need to get the token from your token manager
            // This is a placeholder - replace with your actual token retrieval
            const sendToken = async () => {
                try {
                    // Replace this with your actual token retrieval logic
                    // For example: const token = await tokenManager.getToken(getToken);
                    // const token = getToken(); 
                    const token = await tokenManager.getToken(getToken);

                    sendToWebView({
                        type: 'SET_WS_TOKEN',
                        data: { token }
                    });
                } catch (error) {
                    console.error('Failed to get token:', error);
                }
            };

            sendToken();
        }
    }, [isReady, sendToWebView]);

    const { data: openTrades, refetch: refetchOpenTrades } = useOpenTradesManager({
        account: props.selectedAccountId,
    });
    const { data: wsData } = useOpenPositionsWS();
    const { mutateAsync: cancelOrder } = useCancelOrderMutation();
    const { mutateAsync: updateOrder } = useUpdateOrderMutation();
    const { mutateAsync: updateTp } = useUpdateTpMutation();
    const { mutateAsync: updateSl } = useUpdateSlMutation();

    const currency = props.accountDetails?.currency;

    // Helper to send messages to WebView
    const sendToWebView = useCallback((message: WebViewMessage) => {
        webViewRef.current?.postMessage(JSON.stringify(message));
    }, []);

    const onUpdateTp = useCallback(
        async (
            tp: number | null,
            tradeItem: OpenTradesData['open_trades'][number],
        ) => {
            return await updateTp({
                account: props.selectedAccountId,
                tp: tp ? tp.toFixed(5) : null,
                position: tradeItem.position_type,
                trade_id: tradeItem.order_id.toString(),
                symbol: tradeItem.symbol,
            });
        },
        [props.selectedAccountId, updateTp],
    );

    const onUpdateSl = useCallback(
        async (
            sl: number | null,
            tradeItem: OpenTradesData['open_trades'][number],
        ) => {
            return await updateSl({
                account: props.selectedAccountId,
                sl: sl ? sl.toFixed(5) : null,
                position: tradeItem.position_type,
                trade_id: tradeItem.order_id.toString(),
                symbol: tradeItem.symbol,
            });
        },
        [props.selectedAccountId, updateSl],
    );

    const onUpdateOrder = useCallback(
        async (
            openOrder: OpenOrderDataSchemaType,
            price: number,
            updateOrderQuantity: boolean,
        ) => {
            const requestPayload: UpdateOrderInput = {
                account: props.selectedAccountId,
                symbol: openOrder.symbol,
                order_type: openOrder.order_type,
                position: openOrder.position_type,
                price: price.toFixed(5),
                order_id: openOrder.order_id,
            };
            if (!updateOrderQuantity || openOrder.sl === 0) {
                requestPayload.quantity = openOrder.quantity.toString();
            }
            if (openOrder.sl !== 0) {
                requestPayload.sl = openOrder.sl.toFixed(5);
                requestPayload.sl_type = TakeProfitSlTypeEnum.PRICE;
            }
            if (openOrder.tp !== 0) {
                requestPayload.tp = openOrder.tp.toFixed(5);
                requestPayload.tp_type = TakeProfitSlTypeEnum.PRICE;
            }
            return await updateOrder(requestPayload);
        },
        [props.selectedAccountId, updateOrder],
    );

    const onUpdateOrderTpSl = useCallback(
        async (
            openOrder: OpenOrderDataSchemaType,
            options: {
                tp?: number | null;
                sl?: number | null;
            },
        ) => {
            const requestPayload: UpdateOrderInput = {
                account: props.selectedAccountId,
                symbol: openOrder.symbol,
                order_type: openOrder.order_type,
                position: openOrder.position_type,
                price: openOrder.price.toFixed(5),
                order_id: openOrder.order_id,
                quantity: openOrder.quantity.toString(),
            };
            if (openOrder.sl !== 0) {
                requestPayload.sl = openOrder.sl.toFixed(5);
                requestPayload.sl_type = TakeProfitSlTypeEnum.PRICE;
            }
            if (openOrder.tp !== 0) {
                requestPayload.tp = openOrder.tp.toFixed(5);
                requestPayload.tp_type = TakeProfitSlTypeEnum.PRICE;
            }
            if (typeof options.sl === 'number') {
                requestPayload.sl = options.sl.toFixed(5);
                requestPayload.sl_type = TakeProfitSlTypeEnum.PRICE;
            }
            if (typeof options.tp === 'number') {
                requestPayload.tp = options.tp.toFixed(5);
                requestPayload.tp_type = TakeProfitSlTypeEnum.PRICE;
            }
            if (options.sl === null) {
                requestPayload.sl = null;
            }
            if (options.tp === null) {
                requestPayload.tp = null;
            }
            return await updateOrder(requestPayload);
        },
        [props.selectedAccountId, updateOrder],
    );

    const calculateTp = useCallback(
        (
            currentPrice: number,
            entry: number,
            initialPrice: number,
            value: number,
        ) => {
            const diff = Math.abs(initialPrice - entry);
            const new_val = Math.abs(currentPrice - entry);
            return Math.abs(Math.round((new_val / diff) * value));
        },
        [],
    );

    const calculateSl = useCallback(
        (
            currentPrice: number,
            entryPrice: number,
            currentSl: number,
            value: number,
            positionType: PositionTypeEnum,
        ) => {
            const diff = Math.abs(currentSl - entryPrice);
            const newVal = Math.abs(currentPrice - entryPrice);

            if (diff === 0) return 0;

            const isProfit =
                positionType === PositionTypeEnum.LONG
                    ? currentPrice > entryPrice
                    : currentPrice < entryPrice;

            const multiplier = isProfit ? 1 : -1;

            return multiplier * Math.round((newVal / diff) * Math.abs(value));
        },
        [],
    );

    // Handle messages from WebView
    const handleWebViewMessage = useCallback(async (event: any) => {
        try {
            const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

            switch (message.type) {
                case 'CHART_READY':
                    setIsReady(true);
                    break;

                case 'CLOSE_POSITION':
                    const closeData = message.data;
                    const closePosition = openTrades?.open_trades.find(
                        t => t.order_id === closeData.orderId
                    );
                    if (closePosition) {
                        setCurrentPosition(closePosition);
                        setClosePositionDialogVisible(true);
                        // Present the bottom sheet
                        setTimeout(() => {
                            closePositionBottomSheetRef.current?.present();
                        }, 100);
                    }
                    break;
                case 'EDIT_POSITION':
                    const editData = message.data;
                    const editPosition = openTrades?.open_trades.find(
                        t => t.order_id === editData.orderId
                    );
                    if (editPosition) {
                        setCurrentPosition(editPosition);
                        setTimeout(() => setEditPositionDialogVisible(true), 100);
                    }
                    break;

                case 'UPDATE_TP':
                    const tpData = message.data;
                    const tpPosition = openTrades?.open_trades.find(
                        t => t.order_id === tpData.orderId
                    );
                    if (tpPosition) {
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to move TP to {{price}}', {
                                    price: tpData.price,
                                }),
                            });
                            if (!answer) {
                                sendToWebView({
                                    type: 'REVERT_TP',
                                    data: { orderId: tpData.orderId }
                                });
                                return;
                            }
                        }

                        try {
                            const result = await onUpdateTp(tpData.price, tpPosition);
                            if (result.status !== StatusEnum.SUCCESS) {
                                Alert.alert(t('Failed to update TP'), result.message);
                                sendToWebView({
                                    type: 'REVERT_TP',
                                    data: { orderId: tpData.orderId }
                                });
                            } else {
                                Alert.alert(t('TP updated'));
                            }
                        } catch (e: any) {
                            Alert.alert(t('Failed to update TP'), e?.message);
                            sendToWebView({
                                type: 'REVERT_TP',
                                data: { orderId: tpData.orderId }
                            });
                        }
                    }
                    break;

                case 'UPDATE_SL':
                    const slData = message.data;
                    const slPosition = openTrades?.open_trades.find(
                        t => t.order_id === slData.orderId
                    );
                    if (slPosition) {
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to move SL to {{price}}', {
                                    price: slData.price,
                                }),
                            });
                            if (!answer) {
                                sendToWebView({
                                    type: 'REVERT_SL',
                                    data: { orderId: slData.orderId }
                                });
                                return;
                            }
                        }

                        try {
                            const result = await onUpdateSl(slData.price, slPosition);
                            if (result.status !== StatusEnum.SUCCESS) {
                                Alert.alert(t('Failed to update SL'), result.message);
                                sendToWebView({
                                    type: 'REVERT_SL',
                                    data: { orderId: slData.orderId }
                                });
                            } else {
                                Alert.alert(t('SL updated'));
                            }
                        } catch (e: any) {
                            Alert.alert(t('Failed to update SL'), e?.message);
                            sendToWebView({
                                type: 'REVERT_SL',
                                data: { orderId: slData.orderId }
                            });
                        }
                    }
                    break;

                case 'UPDATE_ORDER':
                    const orderData = message.data;
                    const order = openTrades?.open_orders.find(
                        o => o.order_id === orderData.orderId
                    );
                    if (order) {
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to move Order to {{price}}', {
                                    price: orderData.price,
                                }),
                            });
                            if (!answer) {
                                sendToWebView({
                                    type: 'REVERT_ORDER',
                                    data: { orderId: orderData.orderId }
                                });
                                return;
                            }
                        }

                        try {
                            const result = await onUpdateOrder(
                                { ...order, position_type: orderData.positionType },
                                orderData.price,
                                orderData.updateQuantity || false
                            );
                            if (result.status === StatusEnum.SUCCESS) {
                                Alert.alert(t('Order updated'));
                            } else {
                                Alert.alert(t('Failed to update order'), result.message);
                                sendToWebView({
                                    type: 'REVERT_ORDER',
                                    data: { orderId: orderData.orderId }
                                });
                            }
                        } catch (e: any) {
                            Alert.alert(t('Failed to update order'), e?.message);
                            sendToWebView({
                                type: 'REVERT_ORDER',
                                data: { orderId: orderData.orderId }
                            });
                        }
                    }
                    break;

                case 'CANCEL_ORDER':
                    const cancelData = message.data;
                    const cancelOrder_item = openTrades?.open_orders.find(
                        o => o.order_id === cancelData.orderId
                    );
                    if (cancelOrder_item) {
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to cancel an order'),
                            });
                            if (!answer) return;
                        }

                        try {
                            const result = await cancelOrder({
                                symbol: cancelOrder_item.symbol,
                                account: props.selectedAccountId,
                                order_id: cancelOrder_item.order_id,
                            });
                            if (result.status === StatusEnum.SUCCESS) {
                                Alert.alert(
                                    t('Order "{{id}}" canceled', {
                                        id: cancelOrder_item.order_id,
                                    })
                                );
                            } else {
                                Alert.alert(
                                    t('Failed to cancel order "{{id}}"', {
                                        id: cancelOrder_item.order_id,
                                    }),
                                    result.message
                                );
                            }
                        } catch (e: any) {
                            Alert.alert(
                                t('Failed to cancel order "{{id}}"', {
                                    id: cancelOrder_item.order_id,
                                }),
                                e?.message
                            );
                        }
                    }
                    break;

                case 'PLUS_CLICK':
                    if (!onChartTradingEnabled) {
                        const answer = await question({
                            title: t('Chart trading'),
                            description: t(
                                'You must toggle on chart trading to open a position via the chart.',
                            ),
                        });
                        if (!answer) {
                            setOnChartTradingEnabled(false);
                        }
                        return;
                    }

                    const plusData = message.data;
                    setIsOpen?.(true);
                    setIsLoading?.(true);

                    await requestPosition({
                        orderPrice: plusData.price,
                        marketPrice: plusData.marketPrice,
                        symbol: plusData.symbol,
                    });

                    setIsLoading?.(false);
                    break;

                case 'CALCULATE_TP':
                    const tpCalcData = message.data;
                    const tpResult = calculateTp(
                        tpCalcData.currentPrice,
                        tpCalcData.entry,
                        tpCalcData.initialPrice,
                        tpCalcData.value
                    );
                    sendToWebView({
                        type: 'TP_CALCULATED',
                        data: {
                            id: tpCalcData.id,
                            result: tpResult
                        }
                    });
                    break;

                case 'CALCULATE_SL':
                    const slCalcData = message.data;
                    const slResult = calculateSl(
                        slCalcData.currentPrice,
                        slCalcData.entryPrice,
                        slCalcData.currentSl,
                        slCalcData.value,
                        slCalcData.positionType
                    );
                    sendToWebView({
                        type: 'SL_CALCULATED',
                        data: {
                            id: slCalcData.id,
                            result: slResult
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('Error handling WebView message:', error);
        }
    }, [
        openTrades,
        oneClickTradingEnabled,
        onUpdateTp,
        onUpdateSl,
        onUpdateOrder,
        cancelOrder,
        calculateTp,
        calculateSl,
        question,
        requestPosition,
        setIsOpen,
        setIsLoading,
        onChartTradingEnabled,
        setOnChartTradingEnabled,
        sendToWebView,
        props.selectedAccountId,
        t,
    ]);

    const symbolPrefix = useMemo(() => {
        const { exchange, server } = props?.accountDetails;
        return `${exchange}:${server}:`;
    }, [props.accountDetails]);

    // Add this useEffect
    useEffect(() => {
        if (openTrades) {
            console.log('===== FULL OPEN TRADES RESPONSE =====');
            console.log('Account:', openTrades.account);
            console.log('Open trades count:', openTrades.open_trades?.length);
            console.log('Open trades:', JSON.stringify(openTrades.open_trades, null, 2));
            console.log('Open orders count:', openTrades.open_orders?.length);
        }
    }, [openTrades]);

    // Send open trades/orders to WebView when they change
    useEffect(() => {
        if (isReady && openTrades) {
            console.log('===== SENDING TRADES TO WEBVIEW =====');
            console.log('Open trades:', openTrades.open_trades);
            console.log('First trade symbol:', openTrades.open_trades[0]?.symbol);
            console.log('Current chart symbol (props.symbol):', props.symbol);
            console.log('Symbol with prefix:', `${symbolPrefix}${props.symbol}`);

            sendToWebView({
                type: 'UPDATE_TRADES',
                data: {
                    openTrades: openTrades.open_trades,
                    openOrders: openTrades.open_orders,
                    currency,
                    colors: {
                        sl: SL_COLOR,
                        tp: TP_COLOR,
                        position: POSITION_COLOR,
                    }
                }
            });
        }
    }, [isReady, openTrades, currency, sendToWebView]);

    // Add this NEW useEffect to convert and send positions
    useEffect(() => {
        if (isReady && openTrades) {
            const currentSymbol = props.symbol;

            const positions = openTrades.open_trades
                .filter(trade => trade.symbol === currentSymbol)
                .map(trade => ({
                    id: trade.order_id,
                    symbol: trade.symbol,
                    qty: trade.position_type === 'long' ? trade.quantity : -trade.quantity,
                    side: trade.position_type === 'long' ? 1 : -1,
                    avgPrice: trade.entry,
                    profit: trade.pl,
                    last: trade.entry, // This should ideally be current market price
                    price: trade.entry,
                    type: 2, // Position type
                }));

            console.log('[TradingChart] Sending positions to broker:', positions);

            sendToWebView({
                type: 'SET_POSITIONS',
                data: { positions }
            });
        }
    }, [isReady, openTrades, props.symbol, sendToWebView]);

    // Send symbol changes to WebView
    useEffect(() => {
        if (isReady && props.symbol && symbolPrefix) {
            sendToWebView({
                type: 'CHANGE_SYMBOL',
                data: {
                    symbol: `${symbolPrefix}${props.symbol}`,
                }
            });
        }
    }, [isReady, props.symbol, symbolPrefix, sendToWebView]);

    // Detect changes in position/order counts via WebSocket
    useEffect(() => {
        if (!wsData || !openTrades || wsData.account !== props.selectedAccountId) {
            return;
        }

        const wsTradesCount = wsData.open_trades?.length ?? 0;
        const wsOrdersCount = wsData.open_orders?.length ?? 0;
        const apiTradesCount = openTrades.open_trades?.length ?? 0;
        const apiOrdersCount = openTrades.open_orders?.length ?? 0;

        if (wsTradesCount !== apiTradesCount || wsOrdersCount !== apiOrdersCount) {
            console.log(
                'Chart: Position/order count mismatch detected - refreshing API data'
            );
            void refetchOpenTrades();
        }
    }, [wsData, openTrades, props.selectedAccountId, refetchOpenTrades]);

    // Generate HTML for WebView
    const htmlContent = useMemo(() => {
        const config = {
            symbol: `${symbolPrefix}${props.symbol}`,
            interval: props.interval || 'D',
            userId: props.userId,
            apiBaseUrl: getAPIBaseUrl(),
            fullscreen: props.fullscreen || false,
            autosize: props.autosize || true,
        };

        const configJson = JSON.stringify(config).replace(/</g, '\\u003c');
        const apiBaseUrl = getAPIBaseUrl();
        const wssBaseUrl = apiBaseUrl?.replace(/^http/, 'ws');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #tv_chart_container { height: 100vh; width: 100vw; }

        /* ⭐ THEME CSS FROM WEB TEAM - Adapted for React Native */
        .theme-dark:root {
            --tv-color-platform-background: hsl(330 6.7% 5.9%);
            --tv-color-pane-background: hsl(330 6.7% 5.9%);
        }

        .layout__area--top {
            border-bottom: 1px solid hsl(340 3.3% 17.8%);
        }

        .layout__area--left {
            border-right: 1px solid hsl(340 3.3% 17.8%);
            top: 39px !important;
        }

        #header-toolbar-symbol-search {
            pointer-events: none;
            width: auto;
        }

        #header-toolbar-symbol-search svg {
            display: none;
        }

        /* ⭐ ADDITIONAL STYLING TO ENSURE #100E0F BACKGROUND */
        /* Your color #100E0F is equivalent to hsl(330 6.7% 5.9%) */
        
        /* Header (top toolbar) */
        .header-widget, .chart-controls-bar {
            background-color: #100E0F !important;
            color: #fff !important;
        }

        /* Timeframes toolbar */
        .timeframes-toolbar, 
        .timeframe-group, 
        .apply-common-tooltip {
            background-color: #100E0F !important;
            color: #fff !important;
        }

        /* Bottom toolbar (date range area) */
        .layout__area--bottom {
            background-color: #100E0F !important;
        }

        /* Buttons */
        .button, .apply-common-tooltip {
            color: #fff !important;
        }

        /* Time scale background */
        div[class*="timescale"] {
            background-color: #100E0F !important;
        }

        /* Any remaining toolbar elements */
        div[class*="toolbar-"] {
            background-color: #100E0F !important;
        }
        
        /* Target all potential header areas */
        div[class*="header-"], div[class*="top-"] {
            background-color: #100E0F !important;
        }
    </style>
</head>
<body>
    <div id="tv_chart_container"></div>
    <script>
        window.chartConfig = ${configJson};
        window.API_BASE_URL = '${apiBaseUrl}';
        window.WSS_BASE_URL = '${wssBaseUrl}';
        window.WS_TOKEN = null;
        window.currentPositions = []; // Store positions
    </script>
    <script type="text/javascript" src="charting_library/charting_library.standalone.js"></script>
    <script type="text/javascript" src="datafeeds/udf/dist/bundle.js"></script>
    <script>

(function() {
    var API_ROUTES = {
        GET_SYMBOLS: '/get_symbols',
        GET_PRICES: '/get_prices'
    };
    
    var WSS_ROUTES = {
        GET_PRICES: '/prices'
    };

    var supportedResolutions = ['1', '3', '5', '15', '30', '60', '240', '1D', '1W', '1M'];
    
    var symbolTypes = [
        { name: 'Crypto', value: 'Crypto' },
        { name: 'Forex', value: 'Forex' }
    ];

    function DatafeedChartApi() {
        this.lastBarsCache = new Map();
        this.resetCache = new Map();
        this.subscribers = new Map();
        this.symbols = new Map();
        this.configurationData = {
            supported_resolutions: supportedResolutions,
            exchanges: [],
            symbols_types: symbolTypes
        };
        this.lastBid = null;
        this.lastAsk = null;
        this.askLineRef = null;
    }

    DatafeedChartApi.prototype.onReady = function(callback) {
        console.log('[onReady]: Method call');
        var self = this;
        setTimeout(function() {
            callback(self.configurationData);
        }, 0);
    };

    DatafeedChartApi.prototype.getAllSymbols = function() {
        var self = this;
        if (this.symbols.size > 0) {
            return Promise.resolve(this.symbols);
        }

        return fetch(window.API_BASE_URL + API_ROUTES.GET_SYMBOLS)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                var temporaryMap = new Map();
                
                for (var i = 0; i < data.exchange.length; i++) {
                    var exchangeParts = data.exchange[i].split('_');
                    var exchangeName = exchangeParts[0];
                    var serverName = exchangeParts[1];
                    
                    for (var j = 0; j < data.symbols[i].length; j++) {
                        var symbol = data.symbols[i][j];
                        var fullName = exchangeName + ':' + serverName + ':' + symbol;
                        var isCryptoSymbol = /BTC|ETH|DOT|ADA|XRP|LTC|NEO|XMR|DOG|DAS/.test(symbol.slice(0, 3));
                        var symbolType = (['MT5', 'DXTrade', 'CTrader'].indexOf(exchangeName) !== -1 && !isCryptoSymbol) ? 'Forex' : 'Crypto';
                        var pricescale = /BTC|ETH/.test(symbol.slice(0, 3)) ? 100 : 100000;

                        var symbolInfo = {
                            symbol: symbol,
                            ticker: fullName,
                            full_name: fullName,
                            name: symbol,
                            description: symbol,
                            exchange: exchangeName + ':' + serverName,
                            listed_exchange: exchangeName,
                            type: symbolType,
                            session: symbolType === 'Forex' ? '2200-0000:1|0000-0000:2345|0000-2100:6' : '24x7',
                            timezone: 'Etc/UTC',
                            minmov: 1,
                            pricescale: pricescale,
                            has_intraday: true,
                            intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
                            has_weekly_and_monthly: false,
                            format: 'price',
                            supported_resolutions: self.configurationData.supported_resolutions,
                            volume_precision: 8,
                            data_status: 'streaming',
                            visible_plots_set: 'ohlcv'
                        };

                        temporaryMap.set(symbolInfo.full_name, symbolInfo);
                    }
                }
                
                self.symbols = temporaryMap;
                return self.symbols;
            });
    };

    DatafeedChartApi.prototype.searchSymbols = function(userInput, exchange, symbolType, onResultReadyCallback) {
        console.log('[searchSymbols]: Method call');
        this.getAllSymbols().then(function(symbols) {
            var symbolsArray = [];
            symbols.forEach(function(symbol) {
                symbolsArray.push(symbol);
            });
            
            var newSymbols = symbolsArray.filter(function(symbol) {
                var isExchangeValid = symbolType === symbol.type;
                var isFullSymbolContainsInput = symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1;
                return isExchangeValid && isFullSymbolContainsInput;
            });
            
            onResultReadyCallback(newSymbols);
        });
    };

    DatafeedChartApi.prototype.resolveSymbol = function(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
        console.log('[resolveSymbol]: Method call', symbolName);
        this.getAllSymbols().then(function(symbols) {
            var symbolItem = symbols.get(symbolName);
            if (!symbolItem) {
                console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
                onResolveErrorCallback('Cannot resolve symbol');
                return;
            }
            console.log('[resolveSymbol]: Symbol resolved', symbolName);
            onSymbolResolvedCallback(symbolItem);
        });
    };

    DatafeedChartApi.prototype.getBars = function(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        var from = periodParams.from;
        var to = periodParams.to;
        var firstDataRequest = periodParams.firstDataRequest;
        var countBack = periodParams.countBack;
        
        console.log('[getBars]: Method call', symbolInfo, resolution, from, to);

        var urlParameters = {
            symbol: symbolInfo.name,
            exchange: symbolInfo.exchange.split(':')[0],
            server: symbolInfo.exchange.split(':')[1],
            tf: resolution,
            from: (from * 1000).toString(),
            to: (to * 1000).toString(),
            limit: '2000'
        };

        if (countBack !== undefined) {
            urlParameters.requestedBars = countBack.toString();
        }

        var query = Object.keys(urlParameters)
            .map(function(name) {
                return name + '=' + encodeURIComponent(urlParameters[name]);
            })
            .join('&');

        var self = this;
        fetch(window.API_BASE_URL + API_ROUTES.GET_PRICES + '?' + query)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if ((data.status && data.status === 'error') || data.Data.length === 0) {
                    onHistoryCallback([], { noData: true });
                    return;
                }
                
                var bars = data.Data.map(function(bar) {
                    return {
                        time: bar.time * 1000,
                        low: bar.low,
                        high: bar.high,
                        open: bar.open,
                        close: bar.close,
                        volume: bar.volume
                    };
                });

                if (firstDataRequest) {
                    self.lastBarsCache.set(symbolInfo.full_name + '_' + resolution, bars[bars.length - 1]);
                }
                
                console.log('[getBars]: returned ' + bars.length + ' bar(s)');
                onHistoryCallback(bars, { noData: bars.length === 0 });
            })
            .catch(function(error) {
                console.log('[getBars]: Get error', error);
                onErrorCallback(error.message);
            });
    };

    DatafeedChartApi.prototype.subscribeBars = function(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
        console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
        
        var self = this;
        this.resetCache.set(symbolInfo.full_name + '_' + resolution, onResetCacheNeededCallback);

        if (!window.WS_TOKEN) {
            console.error('No WS_TOKEN available for WebSocket connection');
            return;
        }

        var wsUrl = window.WSS_BASE_URL + WSS_ROUTES.GET_PRICES + '?auth_key=' + window.WS_TOKEN;
        var socket = new WebSocket(wsUrl);

        socket.onopen = function() {
            console.log('WebSocket connection opened for', subscriberUID);
            var parts = symbolInfo.full_name.split(':');
            var exchange = parts[0];
            var server = parts[1];
            var name = parts[2];
            var subscribeMessage = 'SubAdd:0~' + exchange + '~' + server + '~' + name;
            socket.send(subscribeMessage);
        };

        socket.onmessage = function(event) {
            try {
                var data = event.data;
                if (typeof data !== 'string' || data.indexOf('~') === -1) {
                    return;
                }

                var parts = data.split('~');
                if (parts.length < 6) {
                    return;
                }

                var bid = parseFloat(parts[4]);
                var ask = parseFloat(parts[5]);
                var marketPrice = (ask + bid) / 2;

                var symbolData = {
                    exchange: parts[0],
                    server: parts[1],
                    symbol: parts[2],
                    time: parseInt(parts[3]) || Date.now(),
                    bid: bid,
                    ask: ask,
                    marketPrice: marketPrice
                };

                if (!symbolData.bid || !symbolData.ask) return;

                var lastBar = self.lastBarsCache.get(symbolInfo.full_name + '_' + resolution);
                
                self.lastBid = symbolData.bid || self.lastBid;
                self.lastAsk = symbolData.ask || self.lastAsk;
                var tradeTime = symbolData.time || Date.now();

                var nextBarTime;
                if (resolution === '1D') {
                    nextBarTime = self.getNextDailyBarTime(lastBar ? lastBar.time : tradeTime);
                } else if (parseInt(resolution) >= 60) {
                    nextBarTime = self.getNextHourlyBarTime(lastBar ? lastBar.time : tradeTime, parseInt(resolution) / 60);
                } else {
                    nextBarTime = self.getNextMinutesBarTime(lastBar ? lastBar.time : tradeTime, parseInt(resolution));
                }

                var bar;
                if (tradeTime >= nextBarTime) {
                    bar = {
                        time: nextBarTime,
                        open: symbolData.bid,
                        high: symbolData.bid,
                        low: symbolData.bid,
                        close: symbolData.bid
                    };
                    console.log('[subscribeBars]: Generate new bar', bar);
                } else {
                    if (!lastBar) {
                        bar = {
                            time: nextBarTime,
                            open: symbolData.bid,
                            high: symbolData.bid,
                            low: symbolData.bid,
                            close: symbolData.bid
                        };
                    } else {
                        bar = {
                            time: lastBar.time,
                            open: lastBar.open,
                            high: Math.max(lastBar.high, symbolData.bid),
                            low: Math.min(lastBar.low, symbolData.bid),
                            close: symbolData.bid
                        };
                    }
                }

                onRealtimeCallback(bar);
                self.lastBarsCache.set(symbolInfo.full_name + '_' + resolution, bar);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };

        socket.onclose = function() {
            console.log('WebSocket closed for', subscriberUID);
        };

        this.subscribers.set(subscriberUID, socket);
    };

    DatafeedChartApi.prototype.unsubscribeBars = function(subscriberUID) {
        console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
        var socket = this.subscribers.get(subscriberUID);
        if (socket) {
            socket.close();
            this.subscribers.delete(subscriberUID);
        }
    };

    DatafeedChartApi.prototype.getNextDailyBarTime = function(barTime) {
        var date = new Date(barTime);
        date.setUTCDate(date.getUTCDate() + 1);
        date.setUTCHours(0, 0, 0, 0);
        return date.getTime();
    };

    DatafeedChartApi.prototype.getNextHourlyBarTime = function(barTime, intervalHours) {
        var date = new Date(barTime);
        var hoursToAdd = this.hoursToAdd(date.getUTCHours(), intervalHours);
        date.setUTCHours(date.getUTCHours() + hoursToAdd);
        date.setUTCMinutes(0, 0, 0);
        return date.getTime();
    };

    DatafeedChartApi.prototype.getNextMinutesBarTime = function(barTime, intervalMinutes) {
        var date = new Date(barTime);
        var minutesToAdd = this.minutesToAdd(date.getUTCMinutes(), intervalMinutes);
        date.setUTCMinutes(date.getUTCMinutes() + minutesToAdd);
        date.setUTCSeconds(0, 0);
        return date.getTime();
    };

    DatafeedChartApi.prototype.minutesToAdd = function(currentMinute, interval) {
        var remainder = currentMinute % interval;
        return remainder === 0 ? interval : interval - remainder;
    };

    DatafeedChartApi.prototype.hoursToAdd = function(currentHour, interval) {
        var remainder = currentHour % interval;
        return remainder === 0 ? interval : interval - remainder;
    };

class CustomBroker {
    constructor(host) {
        this.host = host;
        console.log('[CustomBroker] Initialized');
    }

    positions() {
        console.log('[CustomBroker] positions() called, returning:', window.currentPositions);
        return Promise.resolve(window.currentPositions || []);
    }

    orders() {
        console.log('[CustomBroker] orders() called');
        return Promise.resolve([]);
    }

    chartContextMenuActions() {
        return Promise.resolve([]);
    }

    isTradable() {
        return Promise.resolve(false); // Disable trading UI
    }

    accountManagerInfo() {
        return Promise.resolve({
            accountTitle: 'Trading Account',
        });
    }
}

    var tvWidget = null;
    var shapesMap = new Map();
    var lastBar = null;
    var config = null;
    var currentTrades = [];
    var currentOrders = [];
    var colors = {};
    var currency = 'USD';
    var askLine = null;
    var datafeed = null;

    function sendMessage(type, data) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
        }
    }

    function receiveMessage(event) {
        try {
            var message = JSON.parse(event.data);
            handleMessage(message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    function handleMessage(message) {
        switch (message.type) {
            case 'SET_WS_TOKEN':
                window.WS_TOKEN = message.data.token;
                console.log('WS_TOKEN set');
                break;

            case 'UPDATE_TRADES':
                currentTrades = message.data.openTrades || [];
                currentOrders = message.data.openOrders || [];
                currency = message.data.currency || 'USD';
                colors = message.data.colors || {};
                updateChartLines();
                break;

            case 'CHANGE_SYMBOL':
                if (tvWidget && message.data.symbol) {
                    var currentResolution = tvWidget.activeChart().resolution();
                    tvWidget.setSymbol(message.data.symbol, currentResolution, function() {
                        console.log('Symbol changed to:', message.data.symbol);
                    });
                }
                break;

            case 'SET_POSITIONS':
                console.log('[handleMessage] SET_POSITIONS received:', message.data.positions);
                window.currentPositions = message.data.positions || [];
                
                // Force broker to refresh positions
                if (tvWidget && tvWidget.chart) {
                    try {
                        var chart = tvWidget.chart();
                        // Trigger a refresh by calling the internal update
                        console.log('[handleMessage] Triggering position refresh');
                        
                        // The broker API will automatically query positions() again
                        // We just need to ensure the widget knows data has changed
                    } catch (e) {
                        console.error('[handleMessage] Error refreshing positions:', e);
                    }
                }
                break;

            case 'REVERT_TP':
            case 'REVERT_SL':
            case 'REVERT_ORDER':
                updateChartLines();
                break;

            case 'TP_CALCULATED':
            case 'SL_CALCULATED':
                break;
        }
    }

    function requestCalculation(type, data) {
        return new Promise(function(resolve) {
            var id = Math.random().toString(36).substr(2, 9);
            var handler = function(event) {
                try {
                    var message = JSON.parse(event.data);
                    if (message.type === type + '_CALCULATED' && message.data.id === id) {
                        window.removeEventListener('message', handler);
                        resolve(message.data.result);
                    }
                } catch (error) {
                    console.error('Error in calculation handler:', error);
                }
            };
            window.addEventListener('message', handler);
            sendMessage(type, Object.assign({}, data, { id: id }));
        });
    }

    function formatCurrency(value, curr) {
        return parseFloat(value).toLocaleString('en-US', {
            style: 'currency',
            currency: curr || currency,
        });
    }

    function clearShapes() {
        shapesMap.forEach(function(shape) {
            try {
                shape.remove();
            } catch (error) {
                console.error('Error removing shape:', error);
            }
        });
        shapesMap.clear();
    }

function updateChartLines() {
    if (!tvWidget) return;

    clearShapes();

    var chart = tvWidget.activeChart();
    if (!chart) return;

    var symbol = chart.symbolExt();
    if (!symbol) return;

    // Extract just the symbol name (last part after ':')
    var symbolParts = symbol.name.split(':');
    var chartSymbol = symbolParts[symbolParts.length - 1]; // e.g., "BTCUSD"

    currentTrades.forEach(function(openTrade) {
        // Compare just the symbol names, not the full exchange:server:symbol
        if (chartSymbol !== openTrade.symbol) return;

            var positionLine = chart
                .createOrderLine()
                .onCancel(function() {
                    sendMessage('CLOSE_POSITION', { orderId: openTrade.order_id });
                })
                .onModify(function() {
                    sendMessage('EDIT_POSITION', { orderId: openTrade.order_id });
                })
                .setPrice(openTrade.entry)
                .setQuantity(openTrade.quantity.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                }))
                .setText(openTrade.position_type.toUpperCase() + ' ' + openTrade.entry)
                .setLineColor(colors.position || '#FFA500')
                .setBodyBorderColor(colors.position || '#FFA500')
                .setQuantityBorderColor(colors.position || '#FFA500')
                .setQuantityBackgroundColor(colors.position || '#FFA500')
                .setCancelButtonBorderColor(colors.position || '#FFA500')
                .setCancelButtonIconColor(colors.position || '#FFA500')
                .setBodyTextColor('#000000');

            shapesMap.set('position_' + openTrade.order_id, positionLine);

            if (openTrade.sl) {
                var slLine = chart
                    .createOrderLine()
                    .setPrice(openTrade.sl)
                    .setQuantity(formatCurrency(openTrade.trade_loss, currency))
                    .setText('SL ' + openTrade.position_type.toUpperCase() + ' ' + openTrade.entry + ' [' + openTrade.quantity + ']')
                    .setLineColor(colors.sl || '#FF0000')
                    .setBodyBorderColor(colors.sl || '#FF0000')
                    .setQuantityBorderColor(colors.sl || '#FF0000')
                    .setQuantityBackgroundColor(colors.sl || '#FF0000')
                    .setBodyTextColor('#000000')
                    .onMove(function() {
                        var price = slLine.getPrice();
                        if (price) {
                            sendMessage('UPDATE_SL', {
                                orderId: openTrade.order_id,
                                price: price,
                            });
                        }
                    })
                    .onMoving(function() {
                        var currentPrice = slLine.getPrice();
                        if (currentPrice) {
                            requestCalculation('CALCULATE_SL', {
                                currentPrice: currentPrice,
                                entryPrice: openTrade.entry,
                                currentSl: openTrade.sl,
                                value: openTrade.trade_loss,
                                positionType: openTrade.position_type,
                            }).then(function(loss) {
                                slLine.setQuantity(formatCurrency(loss, currency));
                            });
                        }
                    });

                shapesMap.set('sl_' + openTrade.order_id, slLine);
            }

            if (openTrade.tp) {
                var tpLine = chart
                    .createOrderLine()
                    .setPrice(openTrade.tp)
                    .setQuantity(formatCurrency(openTrade.trade_profit, currency))
                    .setText('TP ' + openTrade.position_type.toUpperCase() + ' ' + openTrade.entry + ' [' + openTrade.quantity + ']')
                    .setLineColor(colors.tp || '#49c596')
                    .setBodyBorderColor(colors.tp || '#49c596')
                    .setQuantityBorderColor(colors.tp || '#49c596')
                    .setQuantityBackgroundColor(colors.tp || '#49c596')
                    .setBodyTextColor('#000000')
                    .onMove(function() {
                        var price = tpLine.getPrice();
                        if (price) {
                            sendMessage('UPDATE_TP', {
                                orderId: openTrade.order_id,
                                price: price,
                            });
                        }
                    })
                    .onMoving(function() {
                        var currentPrice = tpLine.getPrice();
                        if (currentPrice) {
                            requestCalculation('CALCULATE_TP', {
                                currentPrice: currentPrice,
                                entry: openTrade.entry,
                                initialPrice: openTrade.tp,
                                value: openTrade.trade_profit,
                            }).then(function(profit) {
                                tpLine.setQuantity(formatCurrency(profit, currency));
                            });
                        }
                    });

                shapesMap.set('tp_' + openTrade.order_id, tpLine);
            }
        });

        currentOrders.forEach(function(openOrder) {
            if (symbol.name !== openOrder.symbol) return;

            function setLineColor(line, color) {
                line
                    .setLineColor(color)
                    .setBodyBorderColor(color)
                    .setQuantityBorderColor(color)
                    .setQuantityBackgroundColor(color)
                    .setCancelButtonBorderColor(color)
                    .setCancelButtonIconColor(color);
            }

            if (openOrder.sl) {
                var orderSlLine = chart
                    .createOrderLine()
                    .setPrice(openOrder.sl)
                    .setText('SL ' + openOrder.order_type + ' ' + openOrder.price + ' [' + openOrder.quantity + ']')
                    .onMove(function() {
                        var price = orderSlLine.getPrice();
                        if (price) {
                            sendMessage('UPDATE_ORDER', {
                                orderId: openOrder.order_id,
                                price: price,
                                type: 'sl',
                            });
                        }
                    })
                    .onCancel(function() {
                        sendMessage('UPDATE_ORDER', {
                            orderId: openOrder.order_id,
                            sl: null,
                        });
                    });

                setLineColor(orderSlLine, colors.sl || '#FF0000');
                shapesMap.set('order_sl_' + openOrder.order_id, orderSlLine);
            }

            if (openOrder.tp) {
                var orderTpLine = chart
                    .createOrderLine()
                    .setPrice(openOrder.tp)
                    .setText('TP ' + openOrder.order_type + ' ' + openOrder.price + ' [' + openOrder.quantity + ']')
                    .onMove(function() {
                        var price = orderTpLine.getPrice();
                        if (price) {
                            sendMessage('UPDATE_ORDER', {
                                orderId: openOrder.order_id,
                                price: price,
                                type: 'tp',
                            });
                        }
                    })
                    .onCancel(function() {
                        sendMessage('UPDATE_ORDER', {
                            orderId: openOrder.order_id,
                            tp: null,
                        });
                    });

                setLineColor(orderTpLine, colors.tp || '#12de1f');
                shapesMap.set('order_tp_' + openOrder.order_id, orderTpLine);
            }

            var initialColor = openOrder.position_type === 'long' 
                ? (colors.tp || '#12de1f') 
                : (colors.sl || '#FF0000');

            var orderLine = chart
                .createOrderLine()
                .setPrice(openOrder.price)
                .setQuantity(openOrder.quantity.toString())
                .setText(openOrder.order_type + ' ' + openOrder.price)
                .setBodyTextColor('#000000')
                .setExtendLeft(false)
                .setLineLength(50)
                .onModify(function() {
                    sendMessage('EDIT_ORDER', { orderId: openOrder.order_id });
                })
                .onMoving(function() {
                    if (!orderLine || !lastBar) return;
                    
                    var price = orderLine.getPrice();
                    var currentPrice = lastBar.close;
                    if (!price || !currentPrice) return;

                    var newColor;
                    if (currentPrice < price) {
                        newColor = openOrder.order_type === 'LIMIT' 
                            ? (colors.sl || '#FF0000') 
                            : (colors.tp || '#12de1f');
                    } else {
                        newColor = openOrder.order_type === 'LIMIT' 
                            ? (colors.tp || '#12de1f') 
                            : (colors.sl || '#FF0000');
                    }
                    setLineColor(orderLine, newColor);
                })
                .onMove(function() {
                    if (!orderLine || !lastBar) return;
                    
                    var price = orderLine.getPrice();
                    var currentPrice = lastBar.close;
                    if (!price || !currentPrice) return;

                    var positionType = openOrder.position_type;
                    if (currentPrice < price) {
                        positionType = openOrder.order_type === 'LIMIT' ? 'SHORT' : 'LONG';
                    } else {
                        positionType = openOrder.order_type === 'LIMIT' ? 'LONG' : 'SHORT';
                    }

                    sendMessage('UPDATE_ORDER', {
                        orderId: openOrder.order_id,
                        price: price,
                        positionType: positionType,
                        updateQuantity: false,
                    });
                })
                .onCancel(function() {
                    sendMessage('CANCEL_ORDER', { orderId: openOrder.order_id });
                });

            setLineColor(orderLine, initialColor);
            shapesMap.set('order_' + openOrder.order_id, orderLine);
        });
    }

    function initTradingView(widgetConfig) {
        if (!window.TradingView) {
            console.error('TradingView not loaded');
            setTimeout(function() {
                initTradingView(widgetConfig);
            }, 500);
            return;
        }

        var bg = '#100E0F';
        var datafeed = new DatafeedChartApi();

        var widgetOptions = {
            theme: 'dark',
            symbol: widgetConfig.symbol,
            interval: widgetConfig.interval || 'D',
            container: 'tv_chart_container',
            datafeed: datafeed,
            locale: 'en',
            disabled_features: [
                'use_localstorage_for_settings',
                'legend_widget',
                'symbol_search_hot_key',
                'popup_hints',
                'header_compare',
                'header_symbol_search',
                'left_toolbar',
            ],
            enabled_features: [
                'chart_crosshair_menu',
                'snapshot_trading_drawings',
                'header_in_fullscreen_mode',
                'side_toolbar_in_fullscreen_mode',
            ],
            broker_factory: function(host) {
                    return new CustomBroker(host);
            },
            broker_config: {
                configFlags: {
                    supportPositions: true,
                    supportOrders: false,
                    supportClosePosition: false,
                    supportPLUpdate: true,
                },
            },
            library_path: 'charting_library/',
            charts_storage_url: widgetConfig.apiBaseUrl,
            charts_storage_api_version: '1.1',
            client_id: 'Curo Labs',
            user_id: widgetConfig.userId,
            fullscreen: widgetConfig.fullscreen || false,
            autosize: widgetConfig.autosize !== false,
            timezone: 'Etc/UTC',
            auto_save_delay: 60,
            loading_screen: {
                backgroundColor: bg,
            },
            trading_customization: {
                    position: {
                        lineBuyColor: '#49c596', // Green for long
                        lineSellColor: '#EF4444', // Red for short
                        lineWidth: 2,
                        quantityTextColor: '#FFFFFF',
                    },
            },
            overrides: {
                'paneProperties.background': bg,
                'paneProperties.backgroundType': 'solid',
                'paneProperties.topMargin': 1,
                'paneProperties.bottomMargin': 1,
            },
         load_last_chart: true,
        };

        tvWidget = new window.TradingView.widget(widgetOptions);

tvWidget.onChartReady(function() {
    console.log('TradingView chart ready');

                // ⭐ ADD THIS: Set custom CSS properties for theme
            try {
                // Your custom color #100E0F converted to RGB
                var customBg = 'rgb(16, 14, 15)'; // #100E0F
                var customBorder = 'rgb(68, 63, 66)'; // hsl(340 3.3% 17.8%)
                
                // Platform and pane background
                tvWidget.setCSSCustomProperty('--tv-color-platform-background', customBg);
                tvWidget.setCSSCustomProperty('--tv-color-pane-background', customBg);
                
                // Toolbar colors
                tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text', '#ffffff');
                tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-text-hover', '#ffffff');
                tvWidget.setCSSCustomProperty('--tv-color-toolbar-button-background-hover', 'rgba(255, 255, 255, 0.1)');
                
                // Pop-up menu colors
                tvWidget.setCSSCustomProperty('--tv-color-popup-background', customBg);
                tvWidget.setCSSCustomProperty('--tv-color-popup-element-text', '#ffffff');
                tvWidget.setCSSCustomProperty('--tv-color-popup-element-text-hover', '#ffffff');
                tvWidget.setCSSCustomProperty('--tv-color-popup-element-background-hover', 'rgba(255, 255, 255, 0.1)');
                
                // Toolbar divider
                tvWidget.setCSSCustomProperty('--tv-color-toolbar-divider-background', customBorder);
                
                console.log('✅ Custom CSS properties applied successfully');
            } catch (error) {
                console.error('❌ Error setting CSS properties:', error);
            }

    sendMessage('CHART_READY', {});

    tvWidget.subscribe('onPlusClick', function(event) {
        var chart = tvWidget.activeChart();
        var symbolObj = chart.symbolExt();
        
        sendMessage('PLUS_CLICK', {
            price: event.price,
            marketPrice: lastBar ? lastBar.close : event.price,
            symbol: symbolObj ? symbolObj.name : '',
        });
    });

    tvWidget.subscribe('onTick', function(tick) {
        lastBar = tick;
        
        if (askLine) {
            try {
                askLine.remove();
            } catch (e) {}
        }
        
        var chart = tvWidget.activeChart();
        if (chart && tick.close) {
            askLine = chart
                .createPositionLine()
                .setText('')
                .setQuantity('')
                .setLineStyle(1)
                .setLineWidth(1)
                .setPrice(tick.close)
                .setLineColor(colors.sl || '#FF0000');
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            var chart = tvWidget.activeChart();
            if (chart) {
                chart.resetData();
            }
        }
    });
});
    }

    window.addEventListener('message', receiveMessage);
    document.addEventListener('message', receiveMessage);

    function waitForConfig() {
        if (window.chartConfig) {
            config = window.chartConfig;
            initTradingView(config);
        } else {
            setTimeout(waitForConfig, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForConfig);
    } else {
        waitForConfig();
    }
})();
    </script>
</body>
</html>`;
    }, [symbolPrefix, props.symbol, props.interval, props.userId, props.fullscreen, props.autosize]);

    return (
        <>
            <View style={styles.container}>
                <WebView
                    ref={webViewRef}
                    source={{ html: htmlContent, baseUrl: baseUrl }}
                    onMessage={handleWebViewMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    mixedContentMode="compatibility"
                    allowFileAccess={true}
                    allowUniversalAccessFromFileURLs={true}
                />
            </View>

            {currentPosition && (
                <ClosePositionBottomSheet
                    ref={closePositionBottomSheetRef}
                    isOpen={closePositionDialogVisible}
                    onClose={() => {
                        setClosePositionDialogVisible(false);
                        closePositionBottomSheetRef.current?.dismiss();
                        setTimeout(() => setCurrentPosition(null), 100);
                    }}
                    openTrade={currentPosition}
                    onLoadingChange={setClosePositionDialogLoading}
                />
            )}

        </>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default TradingChart;