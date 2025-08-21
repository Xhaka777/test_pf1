import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { TrendingUp, Plus, Minus, X, Loader } from 'lucide-react-native';
import { useOpenPositionsWS } from '@/providers/open-positions';
import { useCurrencySymbol } from '@/providers/currency-symbols';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTradeMutation } from '@/api/hooks/trade-service';
import { useAccounts } from '@/providers/accounts';
import { OpenTradeInput } from '@/api/schema';
import { OrderTypeEnum, PositionTypeEnum } from '@/shared/enums';
import { StatusEnum } from '@/api/services/api';

interface TradingViewChartProps {
  symbol: string;
  selectedAccountId: number;
  accountDetails: any;
  userId: string;
}

// Colors matching your web teammates' implementation
const SL_COLOR = '#FF0000';
const TP_COLOR = '#12de1f';
const POSITION_COLOR = '#FFA500';
const LABEL_COLOR = '#000000';

export type ChartTradingDialogRequestOptions = {
  orderPrice: number;
  marketPrice: number;
  symbol: string;
};

export type ChartTradingDialogResponse = {
  submitted: boolean;
  type?: OrderTypeEnum;
  status?: StatusEnum;
};

const getLimitOrderSchema = () => {
  return z.object({
    quantity: z.coerce.number().positive(),
  });
};

type LimitOrderSchemaType = z.infer<ReturnType<typeof getLimitOrderSchema>>;

export default function TradingViewChart({
  symbol,
  selectedAccountId,
  accountDetails,
  userId
}: TradingViewChartProps) {
  const { findCurrencyPairBySymbol } = useCurrencySymbol();
  const { data: openTradesData } = useOpenPositionsWS();
  const [webViewRef, setWebViewRef] = useState<any>(null);
  const [plusButtonPosition, setPlusButtonPosition] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Provider-like state management (but kept in component)
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderMode, setOrderMode] = useState<boolean>(false);
  const [orderType, setOrderType] = useState<OrderTypeEnum | null>(null);
  const [position, setPosition] = useState<PositionTypeEnum | null>(null);
  const [options, setOptions] = useState<ChartTradingDialogRequestOptions>({
    orderPrice: 0,
    marketPrice: 0,
    symbol: '',
  });

  // Import and use the real mutation hooks (like your web teammates)
  const { mutateAsync: createTradeMutation, isPending: isCreationPending } = useCreateTradeMutation();
  const { selectedAccountId: contextSelectedAccountId } = useAccounts();
  const resolveRef = useRef<(value: ChartTradingDialogResponse) => void>();

  const form = useForm<LimitOrderSchemaType>({
    resolver: zodResolver(getLimitOrderSchema()),
    defaultValues: {
      quantity: accountDetails?.default_lots ?? 0.01,
    },
  });

  useEffect(() => {
    form.setValue('quantity', accountDetails?.default_lots ?? 0.01);
  }, [accountDetails, form]);

  // Use the passed symbol or fallback to BTCUSD
  const chartSymbol = symbol || 'BTCUSD';
  const currency = accountDetails?.currency || 'USD';

  // Filter trades and orders for current symbol
  const relevantTrades = useMemo(() => {
    if (!openTradesData?.open_trades || !chartSymbol) return [];
    return openTradesData.open_trades.filter(trade => trade.symbol === chartSymbol);
  }, [openTradesData?.open_trades, chartSymbol]);

  const relevantOrders = useMemo(() => {
    if (!openTradesData?.open_orders || !chartSymbol) return [];
    return openTradesData.open_orders.filter(order => order.symbol === chartSymbol);
  }, [openTradesData?.open_orders, chartSymbol]);

  // Provider-like functions (adapted from web code)
  const clearDialogState = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setOrderMode(false);
    setOrderType(null);
    setPosition(null);
    setOptions({
      orderPrice: 0,
      marketPrice: 0,
      symbol: '',
    });
    form.reset();
  }, [form]);

  const requestPosition = useCallback(
    (config: ChartTradingDialogRequestOptions) => {
      setOptions(config);
      setIsOpen(true); // Open the dialog immediately
      return new Promise<ChartTradingDialogResponse>((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [],
  );

  const onFormSubmit = useCallback(
    async (formData: LimitOrderSchemaType) => {
      if (!orderType) {
        Alert.alert('Error', 'An error occurred while opening the order.');
        return;
      }

      const tradeData = {
        account: selectedAccountId,
        symbol: options.symbol,
        order_type: orderType,
        position: position,
        risk_multiplier: null,
        quantity: formData.quantity.toString(),
        price: options.orderPrice.toString(),
        limit_price: options.orderPrice.toString(),
      };

      try {
        const response = await createTradeMutation(
          tradeData as unknown as OpenTradeInput,
        );
        if (response.status === StatusEnum.SUCCESS) {
          Alert.alert('Success', 'Position has been successfully opened');
          clearDialogState();
          resolveRef.current?.({
            submitted: true,
            type: orderType,
            status: response.status,
          });
        } else {
          Alert.alert('Failed to open a position', response.message);
        }
      } catch (error) {
        console.error('Error opening limit order:', error);
        Alert.alert('Error', 'An error occurred while opening the limit order.');
      }
    },
    [
      clearDialogState,
      createTradeMutation,
      options.orderPrice,
      options.symbol,
      orderType,
      position,
      selectedAccountId,
    ],
  );

  const handleCancel = useCallback(() => {
    clearDialogState();
    resolveRef.current?.({ submitted: false });
  }, [clearDialogState]);

  // Handle plus button press - using provider-like logic
  const handlePlusPress = async () => {
    if (!currentPrice) return;

    // Get current market price (you might need to get this from your price feed)
    const marketPrice = 118900; // This should come from your real-time price feed

    // Use the provider-like requestPosition function
    try {
      const response = await requestPosition({
        orderPrice: currentPrice,
        marketPrice: marketPrice,
        symbol: chartSymbol,
      });

      console.log('Position request completed:', response);
    } catch (error) {
      console.error('Error requesting position:', error);
    }
  };

  // Handle touch events on the chart
  // const handleChartTouch = (event: any) => {
  //   const { locationX, locationY, pageX, pageY } = event.nativeEvent;

  //   // Show the plus button at the new touch Y position and stick to the right side
  //   setPlusButtonPosition({
  //     x: locationX, // We'll override this to stick to the right
  //     y: locationY,
  //     visible: true
  //   });

  //   // Close any open dialog when moving to a new level
  //   if (isOpen && !orderMode) {
  //     setIsOpen(false);
  //   }

  //   // Inject JavaScript to get the price at this Y position
  //   if (webViewRef) {
  //     const script = `
  //       (function() {
  //         try {
  //           // Get chart container
  //           const chartContainer = document.querySelector('#tradingview_chart');
  //           if (!chartContainer) return null;

  //           const rect = chartContainer.getBoundingClientRect();
  //           const relativeY = ${locationY};

  //           // Calculate price based on Y position (this is a simplified calculation)
  //           // In a real implementation, you'd need to access TradingView's price scale API
  //           const chartHeight = rect.height;
  //           const priceRange = 1000; // Approximate price range visible on chart
  //           const midPrice = 118900; // Current approximate price (you'd get this dynamically)

  //           // Calculate estimated price at this Y position
  //           const priceOffset = ((chartHeight / 2) - relativeY) / chartHeight * priceRange;
  //           const estimatedPrice = midPrice + priceOffset;

  //           window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
  //             type: 'priceAtPosition',
  //             price: estimatedPrice.toFixed(2)
  //           }));

  //           return estimatedPrice;
  //         } catch (error) {
  //           console.error('Error calculating price:', error);
  //           return null;
  //         }
  //       })();
  //       true;
  //     `;

  //     webViewRef.injectJavaScript(script);
  //   }
  // };

  // Function to inject position lines into the chart
  const injectPositionLines = useCallback(() => {
    if (!webViewRef || (!relevantTrades.length && !relevantOrders.length)) return;

    const trades = relevantTrades;
    const orders = relevantOrders;

    const injectionScript = `
      (function() {
        // Remove existing position lines
        const existingLines = document.querySelectorAll('.custom-position-line');
        existingLines.forEach(line => line.remove());

        // Function to create position line
        function createPositionLine(price, text, color, type = 'position') {
          const line = document.createElement('div');
          line.className = 'custom-position-line';
          line.style.cssText = \`
            position: absolute;
            width: 100%;
            height: 2px;
            background-color: \${color};
            z-index: 1000;
            pointer-events: none;
            border-top: 2px solid \${color};
          \`;

          const label = document.createElement('div');
          label.style.cssText = \`
            position: absolute;
            right: 10px;
            top: -12px;
            background-color: \${color};
            color: \${type === 'position' ? '${LABEL_COLOR}' : '#ffffff'};
            padding: 2px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            white-space: nowrap;
          \`;
          label.textContent = text;
          line.appendChild(label);

          return line;
        }

        // Function to get price position (simplified - assumes linear scale)
        function getPricePosition(price) {
          // This is a simplified calculation - real implementation would need
          // to get the actual chart scale and viewport
          const chartContainer = document.querySelector('#tradingview_chart, .tv-lightweight-charts, [class*="chart"]');
          if (!chartContainer) return null;
          
          const rect = chartContainer.getBoundingClientRect();
          // This is a rough estimation - you'd need actual price scale
          const relativePosition = 0.5; // Middle of chart for demo
          return rect.top + (rect.height * relativePosition);
        }

        // Add position lines for trades
        ${JSON.stringify(trades)}.forEach(trade => {
          const container = document.querySelector('#tradingview_chart') || document.body;
          
          // Position line
          const positionPrice = parseFloat(trade.entry);
          const positionText = \`\${trade.position_type.toUpperCase()} \${positionPrice}\`;
          const positionLine = createPositionLine(positionPrice, positionText, '${POSITION_COLOR}');
          
          // Calculate position - this is simplified
          const yPosition = getPricePosition(positionPrice);
          if (yPosition) {
            positionLine.style.top = yPosition + 'px';
            container.appendChild(positionLine);
          }

          // SL line
          if (trade.sl && trade.sl > 0) {
            const slPrice = parseFloat(trade.sl);
            const slAmount = parseFloat(trade.trade_loss || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: '${currency}'
            });
            const slText = \`SL \${trade.position_type.toUpperCase()} \${trade.entry} [\${trade.quantity}] \${slAmount}\`;
            const slLine = createPositionLine(slPrice, slText, '${SL_COLOR}', 'sl');
            
            const slYPosition = getPricePosition(slPrice);
            if (slYPosition) {
              slLine.style.top = slYPosition + 'px';
              container.appendChild(slLine);
            }
          }

          // TP line
          if (trade.tp && trade.tp > 0) {
            const tpPrice = parseFloat(trade.tp);
            const tpAmount = parseFloat(trade.trade_profit || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: '${currency}'
            });
            const tpText = \`TP \${trade.position_type.toUpperCase()} \${trade.entry} [\${trade.quantity}] \${tpAmount}\`;
            const tpLine = createPositionLine(tpPrice, tpText, '${TP_COLOR}', 'tp');
            
            const tpYPosition = getPricePosition(tpPrice);
            if (tpYPosition) {
              tpLine.style.top = tpYPosition + 'px';
              container.appendChild(tpLine);
            }
          }
        });

        // Add order lines
        ${JSON.stringify(orders)}.forEach(order => {
          const container = document.querySelector('#tradingview_chart') || document.body;
          
          const orderPrice = parseFloat(order.price);
          const orderText = \`\${order.order_type} \${orderPrice}\`;
          const orderColor = order.position_type === 'long' ? '${TP_COLOR}' : '${SL_COLOR}';
          const orderLine = createPositionLine(orderPrice, orderText, orderColor, 'order');
          
          const yPosition = getPricePosition(orderPrice);
          if (yPosition) {
            orderLine.style.top = yPosition + 'px';
            container.appendChild(orderLine);
          }

          // Order SL line
          if (order.sl && order.sl > 0) {
            const slPrice = parseFloat(order.sl);
            const slText = \`SL \${order.order_type} \${order.price} [\${order.quantity}]\`;
            const slLine = createPositionLine(slPrice, slText, '${SL_COLOR}', 'order-sl');
            
            const slYPosition = getPricePosition(slPrice);
            if (slYPosition) {
              slLine.style.top = slYPosition + 'px';
              container.appendChild(slLine);
            }
          }

          // Order TP line
          if (order.tp && order.tp > 0) {
            const tpPrice = parseFloat(order.tp);
            const tpText = \`TP \${order.order_type} \${order.price} [\${order.quantity}]\`;
            const tpLine = createPositionLine(tpPrice, tpText, '${TP_COLOR}', 'order-tp');
            
            const tpYPosition = getPricePosition(tpPrice);
            if (tpYPosition) {
              tpLine.style.top = tpYPosition + 'px';
              container.appendChild(tpLine);
            }
          }
        });

        // Re-inject lines when chart updates
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              // Delay to allow chart to render
              setTimeout(() => {
                if (document.querySelectorAll('.custom-position-line').length === 0) {
                  // Lines were cleared, re-inject them
                  arguments.callee();
                }
              }, 1000);
            }
          });
        });

        const chartContainer = document.querySelector('#tradingview_chart');
        if (chartContainer) {
          observer.observe(chartContainer, { childList: true, subtree: true });
        }
      })();
      true; // Return true to indicate successful injection
    `;

    webViewRef.injectJavaScript(injectionScript);
  }, [webViewRef, relevantTrades, relevantOrders, currency]);

  // Inject position lines when data changes
  useEffect(() => {
    if (webViewRef && (relevantTrades.length > 0 || relevantOrders.length > 0)) {
      // Delay injection to ensure chart is loaded
      const timer = setTimeout(() => {
        injectPositionLines();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [injectPositionLines, relevantTrades, relevantOrders]);

  const getTradingViewHTML = (symbol: string) => `
  <!DOCTYPE html>
  <html style="height: 100%; margin: 0; padding: 0;">
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          html, body {
              height: 100%;
              width: 100%;
              overflow: hidden;
              background-color: #0f0f0f;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .tradingview-widget-container {
              height: 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
          }
          #tradingview_chart {
              height: 100% !important;
              width: 100% !important;
              position: relative;
          }
          /* Styles for custom position lines */
          .custom-position-line {
              position: absolute !important;
              z-index: 1000 !important;
              pointer-events: none !important;
          }
          /* Hide symbol info elements */
          .chart-markup-table.pane {
              display: none !important;
          }
          .layout__area--center .pane-legend {
              display: none !important;
          }
          [data-name="legend"] {
              display: none !important;
          }
          /* Fix for loading spinner */
          .loading-spinner {
              width: 32px;
              height: 32px;
              border: 2px solid #6b7280;
              border-top: 2px solid #ffffff;
              border-radius: 50%;
              animation: spin 1s linear infinite;
          }
          @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
      </style>
  </head>
  <body>
      <div class="tradingview-widget-container">
          <div id="tradingview_chart"></div>
      </div>
      <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
      <script type="text/javascript">
          let chartWidget = null;
          
          function initChart() {
              chartWidget = new TradingView.widget({
                  "width": "100%",
                  "height": "100%",
                  "symbol": "${symbol}",
                  "timezone": "Etc/UTC",
                  "theme": "dark",
                  "style": "1",
                  "locale": "en",
                  "toolbar_bg": "#1a1a1a",
                  "enable_publishing": false,
                  "backgroundColor": "#0f0f0f",
                  "gridColor": "#2a2a2a",
                  "hide_top_toolbar": false,
                  "hide_legend": true,
                  "save_image": false,
                  "container_id": "tradingview_chart",
                  "autosize": true,
                  "disabled_features": [
                      "symbol_info",
                      "display_market_status"
                  ],
                  "overrides": {
                      "paneProperties.background": "#0f0f0f",
                      "paneProperties.backgroundType": "solid",
                      "paneProperties.backgroundGradientStartColor": "#0f0f0f",
                      "paneProperties.backgroundGradientEndColor": "#0f0f0f",
                      "paneProperties.vertGridProperties.color": "#2a2a2a",
                      "paneProperties.horzGridProperties.color": "#2a2a2a",
                      "symbolWatermarkProperties.transparency": 100,
                      "scalesProperties.textColor": "#9ca3af",
                      "scalesProperties.backgroundColor": "#1a1a1a"
                  }
              });

              // Notify React Native when chart is ready
              chartWidget.onChartReady(() => {
                  // Hide symbol info elements after chart loads
                  setTimeout(() => {
                      const symbolElements = document.querySelectorAll([
                          '.chart-markup-table',
                          '.pane-legend',
                          '[data-name="legend"]',
                          '.legend-source-item'
                      ].join(', '));
                      
                      symbolElements.forEach(el => {
                          if (el) el.style.display = 'none';
                      });

                      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'chartReady'
                      }));
                  }, 1000);
              });
          }
          
          if (typeof TradingView !== 'undefined') {
              initChart();
          } else {
              window.addEventListener('load', initChart);
          }

          // Function to be called by React Native to update symbol
          window.updateSymbol = function(newSymbol) {
              if (chartWidget && chartWidget.setSymbol) {
                  chartWidget.setSymbol(newSymbol, chartWidget.activeChart().resolution());
              }
          };
      </script>
  </body>
  </html>
`;

  // Handle messages from WebView
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'chartReady') {
        // Chart is ready, inject position lines after a delay
        setTimeout(() => {
          injectPositionLines();
        }, 1000);
      } else if (data.type === 'priceAtPosition') {
        // Update the current price from the chart calculation
        setCurrentPrice(parseFloat(data.price));
      }
    } catch (error) {
      console.log('WebView message parse error:', error);
    }
  };

  // Loading state component
  if (!accountDetails || !selectedAccountId) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f0f0f] gap-3">
        <TrendingUp size={32} color="#00d4aa" />
        <Text className="text-base text-gray-400 font-medium">Loading account details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      {/* Chart container - takes full space */}
      <View className="flex-1 bg-[#1a1a1a]">
        {/* <View
          className="flex-1"
          onTouchStart={handleChartTouch}
          onTouchMove={handleChartTouch}
        > */}
        <WebView
          ref={setWebViewRef}
          key={chartSymbol} // Force re-render when symbol changes
          source={{ html: getTradingViewHTML(chartSymbol) }}
          className="flex-1 bg-[#0f0f0f]"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onMessage={onMessage}
          renderLoading={() => (
            <View className="absolute inset-0 justify-center items-center bg-[#0f0f0f] gap-3">
              <TrendingUp size={32} color="#00d4aa" />
              <Text className="text-base text-gray-400 font-medium">
                Loading {chartSymbol} chart...
              </Text>
            </View>
          )}
          onError={(error) => {
            console.log('WebView error:', error);
          }}
        />
        {/* </View> */}

        {/* {plusButtonPosition.visible && (
          <View
            className="absolute flex-row items-center"
            style={{
              right: 65, // Position close to price scale, not at very edge
              top: Math.max(10, Math.min(plusButtonPosition.y - 12, 600)),
            }}
          >
            <TouchableOpacity
              onPress={handlePlusPress}
              className="bg-black/80 rounded-full p-1.5 border border-gray-600 mr-2"
              style={{
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 3,
              }}
            >
              <Plus size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {isOpen && (
          <Modal
            visible={isOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancel}
          >
            <View className="flex-1 justify-center items-center bg-black/50 px-4">
              <View className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-gray-700">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-white text-xl font-semibold">Chart trading</Text>
                  <TouchableOpacity onPress={handleCancel}>
                    <X size={24} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <View className="mb-6">
                  {isLoading ? (
                    <View className="flex justify-center items-center h-24">
                      <Loader size={32} color="#ffffff" />
                    </View>
                  ) : (
                    <View>
                      {orderType ? (
                        <View>
                          <Text className="text-gray-400 text-base mb-4">
                            Do you want to open a{' '}
                            <Text className="text-white font-medium">{orderType}</Text>{' '}
                            <Text className={`font-medium uppercase ${position === PositionTypeEnum.SHORT ? 'text-red-500' : 'text-green-500'
                              }`}>
                              {position}
                            </Text>{' '}
                            order at{' '}
                            <Text className="text-white font-medium">
                              {options.orderPrice.toLocaleString('en-US', { maximumFractionDigits: 5 })}
                            </Text>{' '}
                            on{' '}
                            <Text className="text-white font-medium">{options.symbol}</Text>?
                          </Text>

                          {orderMode && (
                            <View className="mb-4">
                              <Text className="text-white text-sm font-medium mb-2">Position size</Text>
                              <View className="flex-row items-center bg-[#2a2a2a] rounded-lg border border-gray-600">
                                <TouchableOpacity
                                  onPress={() => {
                                    const currentValue = form.getValues('quantity');
                                    form.setValue('quantity', Math.max(0.01, currentValue - 0.01));
                                  }}
                                  className="p-3"
                                >
                                  <Minus size={20} color="#9ca3af" />
                                </TouchableOpacity>

                                <View className="flex-1 px-2">
                                  <TextInput
                                    value={form.watch('quantity').toFixed(2)}
                                    onChangeText={(text) => {
                                      const value = parseFloat(text) || 0.01;
                                      form.setValue('quantity', Math.max(0.01, Math.min(100, value)));
                                    }}
                                    className="text-white text-center text-lg font-medium"
                                    keyboardType="numeric"
                                    placeholder="0.01"
                                    placeholderTextColor="#9ca3af"
                                  />
                                </View>

                                <TouchableOpacity
                                  onPress={() => {
                                    const currentValue = form.getValues('quantity');
                                    form.setValue('quantity', Math.min(100, currentValue + 0.01));
                                  }}
                                  className="p-3"
                                >
                                  <Plus size={20} color="#9ca3af" />
                                </TouchableOpacity>
                              </View>
                              <Text className="text-gray-500 text-xs mt-1">Enter custom position size</Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View>
                          <Text className="text-gray-400 text-base">
                            Please select an Order type to open: Limit or Stop
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View className={`flex-row gap-3 ${orderMode ? '' : 'grid-cols-3'}`}>
                  <TouchableOpacity
                    onPress={handleCancel}
                    className="flex-1 bg-transparent border border-gray-600 py-3 rounded-lg"
                  >
                    <Text className="text-gray-300 text-center font-medium">Cancel</Text>
                  </TouchableOpacity>

                  {orderMode ? (
                    <TouchableOpacity
                      onPress={form.handleSubmit(onFormSubmit)}
                      disabled={isCreationPending}
                      className="flex-1 bg-[#c084fc] py-3 rounded-lg opacity-90"
                      style={{ opacity: isCreationPending ? 0.5 : 1 }}
                    >
                      <View className="flex-row justify-center items-center">
                        <Text className="text-white text-center font-medium">
                          {isCreationPending ? 'Opening...' : 'Open order'}
                        </Text>
                        {isCreationPending && (
                          <Loader size={16} color="#ffffff" className="ml-2" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setOrderType(OrderTypeEnum.LIMIT);
                          setOrderMode(true);
                          setPosition(
                            options.orderPrice > options.marketPrice
                              ? PositionTypeEnum.SHORT
                              : PositionTypeEnum.LONG,
                          );
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border border-purple-500 py-3 rounded-lg"
                        style={{ opacity: isLoading ? 0.5 : 1 }}
                      >
                        <Text className="text-purple-400 text-center font-medium">Limit order</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setOrderType(OrderTypeEnum.STOP);
                          setOrderMode(true);
                          setPosition(
                            options.orderPrice > options.marketPrice
                              ? PositionTypeEnum.LONG
                              : PositionTypeEnum.SHORT,
                          );
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border border-purple-500 py-3 rounded-lg"
                        style={{ opacity: isLoading ? 0.5 : 1 }}
                      >
                        <Text className="text-purple-400 text-center font-medium">Stop order</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        )} */}
      </View>
    </View>
  );
}