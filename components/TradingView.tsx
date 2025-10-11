import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, Alert, Switch } from 'react-native';
import {
    ChartingLibraryWidgetOptions,
    IDatafeedChartApi,
    IDatafeedQuotesApi,
    IExternalDatafeed,
    IChartingLibraryWidget,
    ResolutionString,
    StudyOverrides,
    IBasicDataFeed,
    ChartingLibraryFeatureset,
    PlusClickParams,
    Bar,
    IPositionLineAdapter,
    IOrderLineAdapter,
} from '../types/charting_library';
import {
    AccountDetails,
    OpenOrderDataSchemaType,
    OpenTradesData,
    UpdateOrderInput,
} from '../api/schema';
import { DatafeedChartApi } from '@/utils/trading-datafeed';
import { getAPIBaseUrl, StatusEnum } from '../api/services/api';
import { getTvLocalStorageKey } from '@/utils/trading-view-utils';
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

declare global {
    interface Window {
        TradingView: {
            widget: new (
                options: ChartingLibraryWidgetOptions,
            ) => IChartingLibraryWidget;
        };
        Datafeeds: {
            UDFCompatibleDatafeed: new (
                datafeedURL: string,
            ) =>
                | IBasicDataFeed
                | (IDatafeedChartApi & IExternalDatafeed & IDatafeedQuotesApi);
        };
    }
}

interface TradingViewChartProps {
    selectedAccountId: number;
    accountDetails: AccountDetails;
    userId: string;
    symbol: string;
    interval?: ResolutionString;
    datafeedUrl?: string;
    fullscreen?: boolean;
    autosize?: boolean;
    studies_overrides?: Partial<StudyOverrides>;
    className?: string;
}


const SL_COLOR = '#FF0000';
const TP_COLOR = '#12de1f';
const POSITION_COLOR = '#FFA500';
const LABEL_COLOR = '#000000';

const TradingViewChart = memo(function TradingViewChart(
    props: TradingViewChartProps,
) {
    const { t } = useTranslation();
    const [onChartTradingEnabled, setOnChartTradingEnabled] = useAtom(
        onChartTradingEnabledAtom,
    );
    const oneClickTradingEnabled = useAtomValue(oneClickTradingEnabledAtom);
    const { requestPosition, setIsOpen, setIsLoading } = useChartTradingDialog();
    const { question } = useConfirmationDialog();
    // const isMobile = useIsMobile();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
    const symbolRef = useRef<string>(props.symbol);
    const shapesListRef = useRef<(IPositionLineAdapter | IOrderLineAdapter)[]>(
        [],
    );
    const lastBarRef = useRef<Bar | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [closePositionDialogVisible, setClosePositionDialogVisible] =
        useState(false);
    const [editPositionDialogVisible, setEditPositionDialogVisible] =
        useState(false);
    const [currentPosition, setCurrentPosition] = useState<
        OpenTradesData['open_trades'][number] | null
    >(null);

    const [editOrderDialogVisible, setEditOrderDialogVisible] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<
        OpenTradesData['open_orders'][number] | null
    >(null);

    const { data: openTrades, refetch: refetchOpenTrades } = useOpenTradesManager(
        {
            account: props.selectedAccountId,
        },
    );
    const { data: wsData } = useOpenPositionsWS();
    const { mutateAsync: cancelOrder } = useCancelOrderMutation();
    const { mutateAsync: updateOrder } = useUpdateOrderMutation();
    const { mutateAsync: updateTp } = useUpdateTpMutation();
    const { mutateAsync: updateSl } = useUpdateSlMutation();

    const currency = props.accountDetails.currency ?? 'USD';

    // Helper function to safely get active chart
    const getSafeActiveChart = useCallback(() => {
        try {
            const widget = tvWidgetRef.current;
            if (!widget || !isReady) {
                return null;
            }
            const chart = widget.activeChart();
            return chart || null;
        } catch (error) {
            console.warn('Failed to get active chart:', error);
            return null;
        }
    }, [isReady]);

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

            // Always return a positive value for TP, as it represents profit
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
            console.log(currentPrice, entryPrice, currentSl, value);
            const diff = Math.abs(currentSl - entryPrice);
            const newVal = Math.abs(currentPrice - entryPrice);

            if (diff === 0) return 0; // avoid divide by zero

            // Determine if the SL move results in a profit or loss
            const isProfit =
                positionType === PositionTypeEnum.LONG
                    ? currentPrice > entryPrice
                    : currentPrice < entryPrice;

            const multiplier = isProfit ? 1 : -1;

            return multiplier * Math.round((newVal / diff) * Math.abs(value));
        },
        [],
    );

    const clearShapes = useCallback(() => {
        shapesListRef.current.forEach((element) => {
            try {
                element.remove();
            } catch (error: unknown) {
                console.error('Error removing shape:', error);
            }
        });
        shapesListRef.current = [];
    }, []);

    const appendShape = useCallback(
        (newShape: IPositionLineAdapter | IOrderLineAdapter) => {
            shapesListRef.current.push(newShape);
        },
        [],
    );

    const addPositionLinesToChart = useCallback(() => {
        clearShapes();

        const chart = getSafeActiveChart();
        if (!chart) {
            return;
        }

        const symbol = chart.symbolExt();
        if (!symbol) {
            return;
        }

        openTrades?.open_trades.forEach((openTrade) => {
            if (symbol.name !== openTrade.symbol) {
                return;
            }

            const createPositionLine = () => {
                const line = tvWidgetRef.current
                    ?.activeChart()
                    .createOrderLine()
                    .onCancel(() => {
                        setCurrentPosition(openTrade);
                        setTimeout(() => setClosePositionDialogVisible(true), 100);
                    })
                    .onModify(() => {
                        setCurrentPosition(openTrade);
                        setTimeout(() => setEditPositionDialogVisible(true), 100);
                    })
                    .setModifyTooltip(t('Click to add SL / TP'))
                    .setPrice(openTrade.entry)
                    .setQuantity(
                        openTrade.quantity.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                        }),
                    )
                    .setText(
                        `${openTrade.position_type.toUpperCase()} ${openTrade.entry}`,
                    )
                    .setCancelTooltip(t('Close position'))
                    .setLineColor(POSITION_COLOR)
                    .setBodyBorderColor(POSITION_COLOR)
                    .setQuantityBorderColor(POSITION_COLOR)
                    .setQuantityBackgroundColor(POSITION_COLOR)
                    .setCancelButtonBorderColor(POSITION_COLOR)
                    .setCancelButtonIconColor(POSITION_COLOR)
                    .setBodyTextColor(LABEL_COLOR);

                if (!line) {
                    throw new Error();
                }

                return line;
            };

            const createSLline = () => {
                return (
                    tvWidgetRef.current
                        ?.activeChart()
                        .createOrderLine()
                        .setPrice(openTrade.sl)
                        .setQuantity(
                            parseFloat(openTrade.trade_loss.toString()).toLocaleString(
                                'en-US',
                                {
                                    style: 'currency',
                                    currency: currency,
                                },
                            ),
                        )
                        .setText(
                            `SL ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                        )
                        // .setCancelTooltip(t('Cancel SL'))
                        .setLineColor(SL_COLOR)
                        .setBodyBorderColor(SL_COLOR)
                        .setQuantityBorderColor(SL_COLOR)
                        .setQuantityBackgroundColor(SL_COLOR)
                        .setBodyTextColor(LABEL_COLOR)
                );
            };

            const createTPline = () => {
                return (
                    tvWidgetRef.current
                        ?.activeChart()
                        .createOrderLine()
                        .setPrice(openTrade.tp)
                        .setQuantity(
                            parseFloat(openTrade.trade_profit.toString()).toLocaleString(
                                'en-US',
                                {
                                    style: 'currency',
                                    currency: currency,
                                },
                            ),
                        )
                        .setText(
                            `TP ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                        )
                        // .setCancelTooltip(t('Cancel TP'))
                        .setLineColor(TP_COLOR)
                        .setBodyBorderColor(TP_COLOR)
                        .setQuantityBorderColor(TP_COLOR)
                        .setQuantityBackgroundColor(TP_COLOR)
                        .setBodyTextColor(LABEL_COLOR)
                );
            };

            let SLline: IOrderLineAdapter | undefined;
            if (openTrade.sl) {
                SLline = createSLline();
                SLline?.onMove(async () => {
                    if (!SLline) {
                        return;
                    }
                    const price = SLline.getPrice();
                    if (!price) {
                        return;
                    }
                    if (!oneClickTradingEnabled) {
                        const answer = await question({
                            description: t('You are about to move SL to {{price}}', {
                                price,
                            }),
                        });
                        if (!answer) {
                            SLline.setPrice(openTrade.sl).setQuantity(
                                openTrade.trade_loss.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: currency,
                                }),
                            );
                            return;
                        }
                    }

                    try {
                        const result = await onUpdateSl(price, openTrade);
                        if (result.status !== StatusEnum.SUCCESS) {
                            Alert.alert(
                                t('Failed to update SL'),
                                result.message,
                                [{ text: t('OK') }],
                            );
                        } else {
                            Alert.alert(
                                t('SL updated'),
                            );
                        }
                    } catch (e: unknown) {
                        Alert.alert(
                            t('Failed to update SL'),
                            (e as { message: string })?.message ?? undefined,
                            [{ text: t('OK') }],
                        );
                        SLline.setPrice(openTrade.sl).setQuantity(
                            openTrade.trade_loss.toLocaleString('en-US', {
                                style: 'currency',
                                currency: currency,
                            }),
                        );
                    }
                }).onMoving(() => {
                    if (!SLline) {
                        return;
                    }
                    const currentPrice = SLline.getPrice();
                    if (!currentPrice) {
                        return;
                    }
                    const loss = calculateSl(
                        currentPrice,
                        openTrade.entry,
                        openTrade.sl,
                        openTrade.trade_loss,
                        openTrade.position_type,
                    );
                    SLline?.setQuantity(
                        loss.toLocaleString('en-US', {
                            style: 'currency',
                            currency: currency,
                        }),
                    );
                });

                if (SLline) {
                    appendShape(SLline);
                }
            }

            let TPline: IOrderLineAdapter | undefined;
            if (openTrade.tp) {
                TPline = createTPline();
                TPline?.onMove(async () => {
                    if (!TPline) {
                        return;
                    }
                    const price = TPline.getPrice();
                    if (!price) {
                        return;
                    }
                    if (!oneClickTradingEnabled) {
                        const answer = await question({
                            description: t('You are about to move TP to {{price}}', {
                                price,
                            }),
                        });
                        if (!answer) {
                            TPline.setPrice(openTrade.tp).setQuantity(
                                openTrade.trade_profit.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: currency,
                                }),
                            );
                            return;
                        }
                    }

                    try {
                        const result = await onUpdateTp(price, openTrade);
                        if (result.status !== StatusEnum.SUCCESS) {
                            Alert.alert(
                                t('Failed to update TP'),
                                result.message,
                                [{ text: t('OK') }],
                            );
                        } else {
                            Alert.alert(
                                t('TP updated'),
                            );
                        }
                    } catch (e: unknown) {
                        Alert.alert(
                            t('Failed to update TP'),
                            (e as { message: string })?.message ?? undefined,
                            [{ text: t('OK') }],
                        );
                        TPline.setPrice(openTrade.tp).setQuantity(
                            openTrade.trade_profit.toLocaleString('en-US', {
                                style: 'currency',
                                currency: currency,
                            }),
                        );
                    }
                }).onMoving(async () => {
                    if (!TPline) {
                        return;
                    }
                    const price = TPline.getPrice();
                    if (!price) {
                        return;
                    }
                    const profit = calculateTp(
                        price,
                        openTrade.entry,
                        openTrade.tp,
                        openTrade.trade_profit,
                    );
                    TPline?.setQuantity(
                        profit.toLocaleString('en-US', {
                            style: 'currency',
                            currency: currency,
                        }),
                    );
                });
    
                if (TPline) {
                    appendShape(TPline);
                }
            }

            const setMoveHandlersForPositionLine = (line: IOrderLineAdapter) => {
                line
                    .onMoving(() => {
                        if (!positionLine) {
                            return;
                        }

                        if (!placeholderPositionLine) {
                            placeholderPositionLine = createPositionLine();
                            if (placeholderPositionLine) {
                                appendShape(placeholderPositionLine);
                            }
                        }

                        if (positionLine.getPrice() > openTrade.entry) {
                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.LONG /* && !openTrade.tp */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                const profit = calculateTp(
                                    price,
                                    openTrade.entry,
                                    openTrade.tp,
                                    openTrade.trade_profit,
                                );
                                positionLine?.setQuantity(
                                    profit.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }),
                                );

                                positionLine
                                    .setText(
                                        `TP ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                                    )
                                    .setLineColor(TP_COLOR)
                                    .setBodyBorderColor(TP_COLOR)
                                    .setQuantityBorderColor(TP_COLOR)
                                    .setQuantityBackgroundColor(TP_COLOR)
                                    .setBodyTextColor(LABEL_COLOR);
                            }

                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.SHORT /* && !openTrade.sl */
                            ) {
                                const currentPrice = positionLine.getPrice();
                                if (!currentPrice) {
                                    return;
                                }
                                const loss = calculateSl(
                                    currentPrice,
                                    openTrade.entry,
                                    openTrade.sl,
                                    openTrade.trade_loss,
                                    openTrade.position_type,
                                );
                                positionLine.setQuantity(
                                    loss.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }),
                                );

                                positionLine
                                    .setText(
                                        `SL ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                                    )
                                    .setLineColor(SL_COLOR)
                                    .setBodyBorderColor(SL_COLOR)
                                    .setQuantityBorderColor(SL_COLOR)
                                    .setQuantityBackgroundColor(SL_COLOR)
                                    .setBodyTextColor(LABEL_COLOR);
                            }
                        } else {
                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.LONG /* && !openTrade.sl */
                            ) {
                                const currentPrice = positionLine.getPrice();
                                if (!currentPrice) {
                                    return;
                                }
                                const loss = calculateSl(
                                    currentPrice,
                                    openTrade.entry,
                                    openTrade.sl,
                                    openTrade.trade_loss,
                                    openTrade.position_type,
                                );
                                positionLine.setQuantity(
                                    loss.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }),
                                );

                                positionLine
                                    .setText(
                                        `SL ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                                    )
                                    .setLineColor(SL_COLOR)
                                    .setBodyBorderColor(SL_COLOR)
                                    .setQuantityBorderColor(SL_COLOR)
                                    .setQuantityBackgroundColor(SL_COLOR)
                                    .setBodyTextColor(LABEL_COLOR);
                            }

                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.SHORT /* && !openTrade.tp */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                const profit = calculateTp(
                                    price,
                                    openTrade.entry,
                                    openTrade.tp,
                                    openTrade.trade_profit,
                                );
                                positionLine.setQuantity(
                                    profit.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }),
                                );

                                positionLine
                                    .setText(
                                        `TP ${openTrade.position_type.toUpperCase()} ${openTrade.entry} [${openTrade.quantity}]`,
                                    )
                                    .setLineColor(TP_COLOR)
                                    .setBodyBorderColor(TP_COLOR)
                                    .setQuantityBorderColor(TP_COLOR)
                                    .setQuantityBackgroundColor(TP_COLOR)
                                    .setBodyTextColor(LABEL_COLOR);
                            }
                        }
                    })
                    .onMove(async () => {
                        if (!positionLine) {
                            return;
                        }
                        if (positionLine.getPrice() > openTrade.entry) {
                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.LONG /* && !openTrade.tp */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                if (!oneClickTradingEnabled) {
                                    const answer = await question({
                                        description: t('You are about to move TP to {{price}}', {
                                            price,
                                        }),
                                    });
                                    if (!answer) {
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                        return;
                                    }
                                }

                                try {
                                    const result = await onUpdateTp(price, openTrade);
                                    if (result.status !== StatusEnum.SUCCESS) {
                                        Alert.alert(
                                            t('Failed to update TP'),
                                            result.message,
                                            [{ text: t('OK') }],
                                        );
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                    } else {
                                        Alert.alert(
                                            t('TP updated'),
                                        );
                                    }
                                } catch (e: unknown) {
                                    Alert.alert(
                                        t('Failed to update TP'),
                                        (e as { message: string })?.message ?? undefined,
                                    );
                                    positionLine.remove();
                                    if (placeholderPositionLine) {
                                        positionLine = placeholderPositionLine;
                                        placeholderPositionLine = undefined;
                                        setMoveHandlersForPositionLine(positionLine);
                                    }
                                }
                            }

                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.SHORT /* && !openTrade.sl */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                if (!oneClickTradingEnabled) {
                                    const answer = await question({
                                        description: t('You are about to move SL to {{price}}', {
                                            price,
                                        }),
                                    });
                                    if (!answer) {
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                        return;
                                    }
                                }

                                try {
                                    const result = await onUpdateSl(price, openTrade);
                                    if (result.status !== StatusEnum.SUCCESS) {
                                        Alert.alert(
                                            t('Failed to update SL'),
                                            result.message,
                                            [{ text: t('OK') }],
                                        );
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                    } else {
                                        Alert.alert(
                                            t('SL updated'),
                                        );
                                    }
                                } catch (e: unknown) {
                                    Alert.alert(
                                        t('Failed to update SL'),
                                        (e as { message: string })?.message ?? undefined,
                                    );
                                    positionLine.remove();
                                    if (placeholderPositionLine) {
                                        positionLine = placeholderPositionLine;
                                        placeholderPositionLine = undefined;
                                        setMoveHandlersForPositionLine(positionLine);
                                    }
                                }
                            }
                        } else {
                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.LONG /* && !openTrade.sl */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                if (!oneClickTradingEnabled) {
                                    const answer = await question({
                                        description: t('You are about to move SL to {{price}}', {
                                            price,
                                        }),
                                    });
                                    if (!answer) {
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                        return;
                                    }
                                }

                                try {
                                    const result = await onUpdateSl(price, openTrade);
                                    if (result.status !== StatusEnum.SUCCESS) {
                                        Alert.alert(
                                            t('Failed to update SL'),
                                            result.message,
                                        );
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                    } else {
                                        Alert.alert(
                                            t('SL updated'),
                                        );
                                    }
                                } catch (e: unknown) {
                                    Alert.alert(
                                        t('Failed to update SL'),
                                        (e as { message: string })?.message ?? undefined,
                                    );
                                    positionLine.remove();
                                    if (placeholderPositionLine) {
                                        positionLine = placeholderPositionLine;
                                        placeholderPositionLine = undefined;
                                        setMoveHandlersForPositionLine(positionLine);
                                    }
                                }
                            }

                            if (
                                openTrade.position_type ===
                                PositionTypeEnum.SHORT /* && !openTrade.tp */
                            ) {
                                const price = positionLine.getPrice();
                                if (!price) {
                                    return;
                                }
                                if (!oneClickTradingEnabled) {
                                    const answer = await question({
                                        description: t('You are about to move TP to {{price}}', {
                                            price,
                                        }),
                                    });
                                    if (!answer) {
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                        return;
                                    }
                                }

                                try {
                                    const result = await onUpdateTp(price, openTrade);
                                    if (result.status !== StatusEnum.SUCCESS) {
                                        Alert.alert(
                                            t('Failed to update TP'),
                                            result.message,
                                        );
                                        positionLine.remove();
                                        if (placeholderPositionLine) {
                                            positionLine = placeholderPositionLine;
                                            placeholderPositionLine = undefined;
                                            setMoveHandlersForPositionLine(positionLine);
                                        }
                                    } else {
                                        Alert.alert(
                                            t('TP updated'),
                                        );
                                    }
                                } catch (e: unknown) {
                                    Alert.alert(
                                        t('Failed to update TP'),
                                        (e as { message: string })?.message ?? undefined,
                                    );
                                    positionLine.remove();
                                    if (placeholderPositionLine) {
                                        positionLine = placeholderPositionLine;
                                        placeholderPositionLine = undefined;
                                        setMoveHandlersForPositionLine(positionLine);
                                    }
                                }
                            }
                        }
                    });
            };

            let placeholderPositionLine: IOrderLineAdapter | undefined;
            let positionLine = createPositionLine();
            setMoveHandlersForPositionLine(positionLine);

            if (positionLine) {
                appendShape(positionLine);
            }
        });

        openTrades?.open_orders.forEach((openOrder) => {
            if (symbol.name !== openOrder.symbol) {
                return;
            }
            const createSLline = () => {
                const line = tvWidgetRef.current
                    ?.activeChart()
                    .createOrderLine()
                    .setPrice(openOrder.sl)
                    // .setQuantity(
                    //   parseFloat(openOrder.trade_loss.toString()).toLocaleString(
                    //     'en-US',
                    //     {
                    //       style: 'currency',
                    //       currency: currency,
                    //     },
                    //   ),
                    // )
                    .setText(
                        `SL ${openOrder.order_type} ${openOrder.price} [${openOrder.quantity}]`,
                    );

                setLineColor(line!, SL_COLOR);

                return line;
            };

            const createTPline = () => {
                const line = tvWidgetRef.current
                    ?.activeChart()
                    .createOrderLine()
                    .setPrice(openOrder.tp)
                    // .setQuantity(
                    //   parseFloat(openOrder.trade_profit.toString()).toLocaleString(
                    //     'en-US',
                    //     {
                    //       style: 'currency',
                    //       currency: currency,
                    //     },
                    //   ),
                    // )
                    .setText(
                        `TP ${openOrder.order_type} ${openOrder.price} [${openOrder.quantity}]`,
                    );

                setLineColor(line!, TP_COLOR);

                return line;
            };

            const setLineColor = (line: IOrderLineAdapter, color: string): void => {
                line
                    .setLineColor(color)
                    .setBodyBorderColor(color)
                    .setQuantityBorderColor(color)
                    .setQuantityBackgroundColor(color)
                    .setCancelButtonBorderColor(color)
                    .setCancelButtonIconColor(color);
            };

            let SLline: IOrderLineAdapter | undefined;
            if (openOrder.sl) {
                SLline = createSLline();
                SLline?.onMove(async () => {
                    if (!SLline) {
                        return;
                    }
                    const price = SLline.getPrice();
                    if (!price) {
                        return;
                    }
                    if (!oneClickTradingEnabled) {
                        const answer = await question({
                            description: t('You are about to move SL to {{price}}', {
                                price,
                            }),
                        });
                        if (!answer) {
                            // SLline.setPrice(openOrder.sl).setQuantity(
                            //   openOrder.trade_loss.toLocaleString('en-US', {
                            //     style: 'currency',
                            //     currency: currency,
                            //   }),
                            // );
                            return;
                        }
                    }

                    try {
                        const result = await onUpdateOrderTpSl(openOrder, { sl: price });
                        if (result.status !== StatusEnum.SUCCESS) {
                            Alert.alert(
                                t('Failed to update SL'),
                                result.message,
                                [{ text: t('OK') }],
                            );
                        } else {
                            Alert.alert(
                                t('SL updated'),
                            );
                        }
                    } catch (e: unknown) {
                        Alert.alert(
                            t('Failed to update SL'),
                            (e as { message: string })?.message ?? undefined,
                            [{ text: t('OK') }],
                        );
                        // SLline.setPrice(openOrder.sl).setQuantity(
                        //   openOrder.trade_loss.toLocaleString('en-US', {
                        //     style: 'currency',
                        //     currency: currency,
                        //   }),
                        // );
                    }
                })
                    .onMoving(() => {
                        if (!SLline) {
                            return;
                        }
                        const currentPrice = SLline.getPrice();
                        if (!currentPrice) {
                            return;
                        }
                        // const loss = calculateTpSl(
                        //   currentPrice,
                        //   openOrder.entry,
                        //   openOrder.sl,
                        //   openOrder.trade_loss,
                        // );
                        // SLline?.setQuantity(
                        //   loss.toLocaleString('en-US', {
                        //     style: 'currency',
                        //     currency: currency,
                        //   }),
                        // );
                    })
                    .onCancel(async () => {
                        if (!SLline) {
                            return;
                        }
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to cancel SL'),
                            });
                            if (!answer) {
                                // TPline.setPrice(openOrder.tp).setQuantity(
                                //   openOrder.trade_profit.toLocaleString('en-US', {
                                //     style: 'currency',
                                //     currency: currency,
                                //   }),
                                // );
                                return;
                            }
                        }

                        try {
                            const result = await onUpdateOrderTpSl(openOrder, { sl: null });
                            if (result.status !== StatusEnum.SUCCESS) {
                                Alert.alert(
                                    t('Failed to update SL'),
                                    result.message,
                                    [{ text: t('OK') }]
                                );
                            } else {
                                Alert.alert(
                                    t('SL updated'),
                                );
                            }
                        } catch (e: unknown) {
                            Alert.alert(
                                t('Failed to update SL'),
                                (e as { message: string })?.message ?? undefined,
                            );
                            // TPline.setPrice(openOrder.tp).setQuantity(
                            //   openOrder.trade_profit.toLocaleString('en-US', {
                            //     style: 'currency',
                            //     currency: currency,
                            //   }),
                            // );
                        }
                    });

                if (SLline) {
                    appendShape(SLline);
                }
            }

            let TPline: IOrderLineAdapter | undefined;
            if (openOrder.tp) {
                TPline = createTPline();
                TPline?.onMove(async () => {
                    if (!TPline) {
                        return;
                    }
                    const price = TPline.getPrice();
                    if (!price) {
                        return;
                    }
                    if (!oneClickTradingEnabled) {
                        const answer = await question({
                            description: t('You are about to move TP to {{price}}', {
                                price,
                            }),
                        });
                        if (!answer) {
                            // TPline.setPrice(openOrder.tp).setQuantity(
                            //   openOrder.trade_profit.toLocaleString('en-US', {
                            //     style: 'currency',
                            //     currency: currency,
                            //   }),
                            // );
                            return;
                        }
                    }

                    try {
                        const result = await onUpdateOrderTpSl(openOrder, { tp: price });
                        if (result.status !== StatusEnum.SUCCESS) {
                            Alert.alert(
                                t('Failed to update TP'),
                                result.message,
                                [{ text: t('OK') }]
                            );
                        } else {
                            Alert.alert(
                                t('TP updated'),
                            );
                        }
                    } catch (e: unknown) {
                        Alert.alert(
                            t('Failed to update TP'),
                            (e as { message: string })?.message ?? undefined,
                            [{ text: t('OK') }]
                        );
                        // TPline.setPrice(openOrder.tp).setQuantity(
                        //   openOrder.trade_profit.toLocaleString('en-US', {
                        //     style: 'currency',
                        //     currency: currency,
                        //   }),
                        // );
                    }
                })
                    .onMoving(async () => {
                        if (!TPline) {
                            return;
                        }
                        const price = TPline.getPrice();
                        if (!price) {
                            return;
                        }
                    })
                    .onCancel(async () => {
                        if (!TPline) {
                            return;
                        }
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to cancel TP'),
                            });
                            if (!answer) {
                                // TPline.setPrice(openOrder.tp).setQuantity(
                                //   openOrder.trade_profit.toLocaleString('en-US', {
                                //     style: 'currency',
                                //     currency: currency,
                                //   }),
                                // );
                                return;
                            }
                        }

                        try {
                            const result = await onUpdateOrderTpSl(openOrder, { tp: null });
                            if (result.status !== StatusEnum.SUCCESS) {
                                Alert.alert(
                                    t('Failed to update TP'),
                                    result.message,
                                    [{ text: t('OK') }]
                                );
                            } else {
                                Alert.alert(
                                    t('TP updated'),
                                );
                            }
                        } catch (e: unknown) {
                            Alert.alert(
                                t('Failed to update TP'),
                                (e as { message: string })?.message ?? undefined,
                            );
                        }
                    });

                if (TPline) {
                    appendShape(TPline);
                }
            }

            const initialColor =
                openOrder.position_type == 'long' ? TP_COLOR : SL_COLOR;

            const orderLine = tvWidgetRef.current
                ?.activeChart()
                .createOrderLine()
                .onModify(() => {
                    setCurrentOrder(openOrder);
                    setTimeout(() => setEditOrderDialogVisible(true), 100);
                })
                .setModifyTooltip(t('Click to edit Order'))
                .onMoving(() => {
                    if (!orderLine) {
                        return;
                    }
                    const price = orderLine.getPrice();
                    const currentPrice = lastBarRef.current?.close;
                    if (!price || !currentPrice) {
                        return;
                    }

                    if (currentPrice < price) {
                        if (openOrder.order_type === OrderTypeEnum.LIMIT) {
                            setLineColor(orderLine, SL_COLOR);
                        }
                        if (openOrder.order_type === OrderTypeEnum.STOP) {
                            setLineColor(orderLine, TP_COLOR);
                        }
                    } else {
                        if (openOrder.order_type === OrderTypeEnum.LIMIT) {
                            setLineColor(orderLine, TP_COLOR);
                        }
                        if (openOrder.order_type === OrderTypeEnum.STOP) {
                            setLineColor(orderLine, SL_COLOR);
                        }
                    }
                })
                .onMove(async () => {
                    if (!orderLine) {
                        return;
                    }
                    const price = orderLine.getPrice();
                    const currentPrice = lastBarRef.current?.close;
                    if (!price || !currentPrice) {
                        return;
                    }
                    let updateOrderQuantity = false;
                    if (!oneClickTradingEnabled) {
                        const answer = await question({
                            description: t('You are about to move Order to {{price}}', {
                                price,
                            }),
                            // children: <UpdateQuantitySetting />,
                        });
                        if (!answer) {
                            orderLine.setPrice(openOrder.price);
                            return;
                        }
                        updateOrderQuantity = atomStore.get(updateOrderCheckboxAtom);
                    }

                    try {
                        let positionType = openOrder.position_type;

                        if (currentPrice < price) {
                            if (openOrder.order_type === OrderTypeEnum.LIMIT) {
                                positionType = PositionTypeEnum.SHORT;
                            }
                            if (openOrder.order_type === OrderTypeEnum.STOP) {
                                positionType = PositionTypeEnum.LONG;
                            }
                        } else {
                            if (openOrder.order_type === OrderTypeEnum.LIMIT) {
                                positionType = PositionTypeEnum.LONG;
                            }
                            if (openOrder.order_type === OrderTypeEnum.STOP) {
                                positionType = PositionTypeEnum.SHORT;
                            }
                        }

                        const result = await onUpdateOrder(
                            {
                                ...openOrder,
                                position_type: positionType,
                            },
                            price,
                            updateOrderQuantity,
                        );
                        if (result.status === StatusEnum.SUCCESS) {
                            Alert.alert(
                                t('Order updated'),
                            );
                        } else {
                            Alert.alert(
                                t('Failed to update order'),
                                result.message,
                                [{ text: t('OK') }]
                            );
                        }
                    } catch (e: unknown) {
                        Alert.alert(
                            t('Failed to update order'),
                            (e as { message: string })?.message ?? undefined,
                            [{ text: t('OK') }]
                        );
                        orderLine.setPrice(openOrder.price);
                    }
                })
                .onCancel(() => {
                    const cancel = async (
                        order: OpenTradesData['open_orders'][number],
                    ) => {
                        if (!orderLine) {
                            return;
                        }
                        if (!oneClickTradingEnabled) {
                            const answer = await question({
                                description: t('You are about to cancel an order'),
                            });
                            if (!answer) {
                                return;
                            }
                        }
                        try {
                            const result = await cancelOrder({
                                symbol: order.symbol,
                                account: props.selectedAccountId,
                                order_id: order.order_id,
                            });
                            if (result.status === StatusEnum.SUCCESS) {
                                Alert.alert(
                                    t('Order "{{id}}" canceled', {
                                        id: order.order_id,
                                    }),
                                );
                            } else {
                                Alert.alert(
                                    t('Failed to cancel order "{{id}}"', {
                                        id: order.order_id,
                                    }),
                                    result.message,
                                    [{ text: t('OK') }],
                                );
                            }
                        } catch (e: unknown) {
                            Alert.alert(
                                 t('Failed to cancel order "{{id}}"', {
                                    id: order.order_id,
                                }),
                                (e as { message: string })?.message ?? undefined,
                                [{ text: t('OK') }],
                            );
                            orderLine.setPrice(openOrder.price);
                        }
                    };

                    void cancel(openOrder);
                })
                .setPrice(openOrder.price)
                .setQuantity(openOrder.quantity.toString())
                .setText(`${openOrder.order_type} ${openOrder.price}`)
                .setBodyTextColor(LABEL_COLOR)
                .setExtendLeft(false)
                .setLineLength(50);

            setLineColor(orderLine!, initialColor);

            if (orderLine) {
                appendShape(orderLine);
            }
        });
    }, [
        appendShape,
        calculateSl,
        calculateTp,
        cancelOrder,
        clearShapes,
        currency,
        getSafeActiveChart,
        onUpdateOrder,
        onUpdateOrderTpSl,
        onUpdateSl,
        onUpdateTp,
        oneClickTradingEnabled,
        openTrades?.open_orders,
        openTrades?.open_trades,
        props.selectedAccountId,
        question,
        t,
    ]);

    const symbolPrefix = useMemo(() => {
        const { exchange, server } = props.accountDetails;
        return `${exchange}:${server}:`;
    }, [props.accountDetails]);

    const askLineRef = useRef<IPositionLineAdapter | null>(null);

    const onBidAskUpdate = useCallback(
        (
            bid: number | null,
            ask: number | null,
            symbolName: string,
            resolution: ResolutionString,
        ) => {
            const chart = tvWidgetRef.current?.activeChart();
            if (!chart) {
                return;
            }
            const symbol = chart.symbolExt();
            if (symbol?.name !== symbolName || resolution !== chart.resolution()) {
                return;
            }
            if (!bid || !ask) {
                return;
            }

            if (askLineRef.current) {
                askLineRef.current.remove();
                askLineRef.current = null;
            }

            askLineRef.current = chart
                .createPositionLine()
                .setText('')
                .setQuantity('')
                .setLineStyle(1)
                .setLineWidth(1)
                .setPrice(ask)
                .setLineColor(SL_COLOR);
        },
        [],
    );

    const initTradingViewWidget = useCallback(() => {
        if (
            typeof window.TradingView === 'undefined' ||
            typeof window.Datafeeds === 'undefined'
        ) {
            throw new Error('TradingView scripts not loaded');
        }

        if (!chartContainerRef.current) {
            throw new Error('Missing container to bootstrap TradingView');
        }

        if (
            !symbolRef.current ||
            !symbolPrefix ||
            tvWidgetRef.current?.activeChart()
        ) {
            return;
        }

        const bg = '#100E0F';

        const widgetOptions: ChartingLibraryWidgetOptions = {
            theme: 'dark',
            symbol: `${symbolPrefix}${symbolRef.current}`,
            interval:
                props.interval ??
                (localStorage.getItem(
                    getTvLocalStorageKey('lastInterval'),
                ) as ResolutionString) ??
                ('D' as ResolutionString),
            container: chartContainerRef.current,
            datafeed: new DatafeedChartApi(onBidAskUpdate),
            locale: 'en',
            disabled_features: [
                'use_localstorage_for_settings',
                'legend_widget',
                'symbol_search_hot_key',
                'popup_hints',
                'header_compare',
                'header_symbol_search',
                'left_toolbar',
                // isMobile ? 'left_toolbar' : 'use_localstorage_for_settings',
            ],
            enabled_features: [
                'chart_crosshair_menu',
                'snapshot_trading_drawings',
                'header_in_fullscreen_mode',
                'side_toolbar_in_fullscreen_mode',
            ] as ChartingLibraryFeatureset[],
            library_path: '/charting_library/',
            charts_storage_url: getAPIBaseUrl(),
            charts_storage_api_version: '1.1',
            client_id: 'Curo Labs',
            user_id: props.userId,
            fullscreen: props.fullscreen || false,
            autosize: props.autosize || true,
            studies_overrides: props.studies_overrides || {},
            timezone: 'Etc/UTC',
            auto_save_delay: 60,
            loading_screen: {
                backgroundColor: bg,
            },
            overrides: {
                'paneProperties.background': bg,
                'paneProperties.backgroundType': 'solid',
                'paneProperties.topMargin': 1,
                'paneProperties.bottomMargin': 1,
            },
            custom_css_url: './themed.css',
            load_last_chart: true,
        };

        const tvWidget = new window.TradingView.widget(widgetOptions);
        tvWidgetRef.current = tvWidget;

        tvWidget.onChartReady(() => {
            setIsReady(true);
        });
    }, [
        symbolPrefix,
        props.interval,
        props.userId,
        props.fullscreen,
        props.autosize,
        props.studies_overrides,
        onBidAskUpdate,
        // isMobile,
    ]);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        const chart = tvWidgetRef.current?.activeChart();
        const handleIntervalChange = (interval: string) => {
            localStorage.setItem(getTvLocalStorageKey('lastInterval'), interval);
        };

        chart?.onIntervalChanged().subscribe(null, handleIntervalChange);

        return () => {
            chart?.onIntervalChanged().unsubscribe(null, handleIntervalChange);
        };
    }, [isReady]);

    const loadScript = useCallback((src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                resolve();
            };
            script.onerror = (err) => {
                reject(err);
            };
            document.body.appendChild(script);
        });
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadScriptsAndInit = async () => {
            try {
                await loadScript('/charting_library/charting_library.js');
                await loadScript('/charting_library/datafeeds/udf/bundle.js');
                await new Promise((res) => setTimeout(res, 100));

                if (isMounted) {
                    initTradingViewWidget();
                }
            } catch (error) {
                console.error('Failed to load TradingView scripts:', error);
                throw error;
            }
        };

        void loadScriptsAndInit();

        return () => {
            isMounted = false;
            if (tvWidgetRef.current) {
                tvWidgetRef.current.remove();
                tvWidgetRef.current = null;
            }
        };
    }, [initTradingViewWidget, loadScript]);

    useEffect(() => {
        if (props.symbol && isReady && symbolPrefix) {
            const widget = tvWidgetRef.current;
            if (!widget) return;

            let currentResolution;
            try {
                const activeChart = widget.activeChart();
                if (!activeChart) return;
                currentResolution = activeChart.resolution();
            } catch (error) {
                console.warn('TradingView widget not ready for symbol change:', error);
                return;
            }

            if (!currentResolution) return;

            try {
                widget.setSymbol(
                    `${symbolPrefix}${props.symbol}`,
                    currentResolution,
                    () => {
                        addPositionLinesToChart();
                    },
                );
            } catch (error) {
                console.warn('Failed to set symbol on TradingView widget:', error);
            }
        }
    }, [
        addPositionLinesToChart,
        isReady,
        openTrades,
        props.symbol,
        symbolPrefix,
    ]);

    // Detect changes in position/order counts via WebSocket and trigger API refetch
    // This ensures chart gets updated when positions are closed (TP/SL hit) without constant re-renders
    useEffect(() => {
        if (!wsData || !openTrades || wsData.account !== props.selectedAccountId) {
            return;
        }

        const wsTradesCount = wsData.open_trades?.length ?? 0;
        const wsOrdersCount = wsData.open_orders?.length ?? 0;
        const apiTradesCount = openTrades.open_trades?.length ?? 0;
        const apiOrdersCount = openTrades.open_orders?.length ?? 0;

        // If counts differ, it means positions/orders have changed (like TP/SL hit)
        if (wsTradesCount !== apiTradesCount || wsOrdersCount !== apiOrdersCount) {
            console.log(
                'Chart: Position/order count mismatch detected - refreshing API data',
                `WS: ${wsTradesCount} trades, ${wsOrdersCount} orders`,
                `API: ${apiTradesCount} trades, ${apiOrdersCount} orders`,
            );
            void refetchOpenTrades();
        }
    }, [wsData, openTrades, props.selectedAccountId, refetchOpenTrades]);

    useEffect(() => {
        if (isReady && openTrades) {
            addPositionLinesToChart();
        }
    }, [addPositionLinesToChart, isReady, openTrades]);

    useEffect(() => {
        if (!isReady) return;

        // A variable to hold the bound callback reference
        let boundGetLastBar: ((tick: Bar) => Promise<void>) | undefined;

        const getLastBar = async (price: number, symbol: string, tick: Bar) => {
            setIsLoading?.(false);
            await requestPosition({
                orderPrice: price,
                marketPrice: tick.close,
                symbol,
            });
            // Unsubscribe using the same function reference
            if (boundGetLastBar) {
                tvWidgetRef.current?.unsubscribe('onTick', boundGetLastBar);
                boundGetLastBar = undefined;
            }
        };

        const onPlusClickHandler = async (event: PlusClickParams) => {
            if (!onChartTradingEnabled) {
                const answer = await question({
                    title: t('Chart trading'),
                    description: t(
                        'You must toggle on chart trading to open a position via the chart.',
                    ),
                    children: <OnChartTradingConfig />,
                });
                if (!answer) {
                    setOnChartTradingEnabled(false);
                }
                return;
            }

            const price = event.price;
            const chart = getSafeActiveChart();
            if (!chart) return;

            const symbolObj = chart.symbolExt();
            if (!symbolObj?.name || !symbolObj?.exchange) return;
            const server = symbolObj.exchange.split(':')[1];
            if (!server) return;

            setIsOpen?.(true);
            setIsLoading?.(true);
            // Bind getLastBar and store the reference
            boundGetLastBar = getLastBar.bind(null, price, symbolObj.name);
            tvWidgetRef.current?.subscribe('onTick', boundGetLastBar);
        };

        tvWidgetRef.current?.subscribe('onPlusClick', onPlusClickHandler);

        return () => {
            tvWidgetRef.current?.unsubscribe('onPlusClick', onPlusClickHandler);
            if (boundGetLastBar) {
                tvWidgetRef.current?.unsubscribe('onTick', boundGetLastBar);
            }
        };
    }, [
        getSafeActiveChart,
        isReady,
        onChartTradingEnabled,
        question,
        requestPosition,
        setIsLoading,
        setIsOpen,
        setOnChartTradingEnabled,
        t,
    ]);

    useEffect(() => {
        if (!isReady) return;

        const getLastBar = async (tick: Bar) => {
            lastBarRef.current = tick;
        };

        const chart = getSafeActiveChart();
        if (!chart) return;

        const symbolObj = chart.symbolExt();
        if (!symbolObj?.name || !symbolObj?.exchange) return;
        const server = symbolObj.exchange.split(':')[1];
        if (!server) return;

        tvWidgetRef.current?.subscribe('onTick', getLastBar);

        return () => {
            tvWidgetRef.current?.unsubscribe('onTick', getLastBar);
        };
    }, [getSafeActiveChart, isReady]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isReady) {
                const chart = getSafeActiveChart();
                chart?.resetData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [getSafeActiveChart, isReady]);

    return (
        <>
            <View
                className={cn('tv-chart-container', props.className)}
                ref={chartContainerRef}
            />
            {currentPosition ? (
                <>
                    <ClosePositionBottomSheet
                        isOpen={closePositionDialogVisible}
                        onClose={() => {
                            setClosePositionDialogVisible(false);
                            setTimeout(() => setCurrentPosition(null), 100);
                        }}
                        openTrade={currentPosition}
                    />
                    <EditPositionBottomSheet
                        isOpen={editPositionDialogVisible}
                        onClose={() => {
                            setEditPositionDialogVisible(false);
                            setTimeout(() => setCurrentPosition(null), 100);
                        }}
                        openTrade={currentPosition}
                    />
                </>
            ) : null}

            {/* {currentOrder && (
                <EditOrderDialog
                    isOpen={editOrderDialogVisible}
                    onClose={() => {
                        setEditOrderDialogVisible(false);
                        setTimeout(() => setCurrentOrder(null), 100);
                    }}
                    openOrder={currentOrder}
                />
            )} */}
        </>
    );
});

function OnChartTradingConfig() {
    const [onChartTradingEnabled, setOnChartTradingEnabled] = useAtom(
        onChartTradingEnabledAtom,
    );
    const { t } = useTranslation();

    return (
        <View className="mt-4">
            <View
                className="text-base font-semibold"
                label={t('Chart Trading')}
                value={
                    <Switch
                        checked={onChartTradingEnabled}
                        onCheckedChange={setOnChartTradingEnabled}
                    />
                }
            />
        </View>
    );
}

// function UpdateQuantitySetting() {
//     const [isChecked, setIsChecked] = useAtom(updateOrderCheckboxAtom);
//     const { t } = useTranslation();

//     return (
//         <div className="flex items-center space-x-2 mt-4">
//             <Checkbox
//                 id="confirm-delete"
//                 checked={isChecked}
//                 onCheckedChange={(checked) => setIsChecked(checked as boolean)}
//             />
//             <Label htmlFor="confirm-delete">
//                 {t(
//                     'Update quantity with risk settings? (Only applicable if SL is present)',
//                 )}
//             </Label>
//         </div>
//     );
// }

export default TradingViewChart;