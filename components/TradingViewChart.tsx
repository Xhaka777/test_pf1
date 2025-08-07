import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { TrendingUp } from 'lucide-react-native';
import { useActiveSymbol } from '@/hooks/use-active-symbol';
import { useAccountDetails } from '@/providers/account-details';
import { useAccounts } from '@/providers/accounts';
import { useCurrencySymbol } from '@/providers/currency-symbols';
import { useOpenPositionsWS } from '@/providers/open-positions';

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

export default function TradingViewChart({
  symbol,
  selectedAccountId,
  accountDetails,
  userId
}: TradingViewChartProps) {
  const { findCurrencyPairBySymbol } = useCurrencySymbol();
  const { data: openTradesData } = useOpenPositionsWS();
  const [webViewRef, setWebViewRef] = useState<any>(null);

  // Get the currently selected symbol data
  const selectedSymbolData = useMemo(() => {
    if (!symbol) return null;
    return findCurrencyPairBySymbol(symbol);
  }, [symbol, findCurrencyPairBySymbol]);

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
                    "hide_legend": false,
                    "save_image": false,
                    "container_id": "tradingview_chart",
                    "autosize": true,
                    "overrides": {
                        "paneProperties.background": "#0f0f0f",
                        "paneProperties.backgroundType": "solid",
                        "paneProperties.backgroundGradientStartColor": "#0f0f0f",
                        "paneProperties.backgroundGradientEndColor": "#0f0f0f",
                        "paneProperties.vertGridProperties.color": "#2a2a2a",
                        "paneProperties.horzGridProperties.color": "#2a2a2a",
                        "symbolWatermarkProperties.transparency": 90,
                        "scalesProperties.textColor": "#9ca3af",
                        "scalesProperties.backgroundColor": "#1a1a1a"
                    }
                });

                // Notify React Native when chart is ready
                chartWidget.onChartReady(() => {
                    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'chartReady'
                    }));
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
      </View>
    </View>
  );
}