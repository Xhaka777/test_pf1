import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { TrendingUp } from 'lucide-react-native';

// Define position line colors
const SL_COLOR = '#FF0000';
const TP_COLOR = '#12de1f';
const POSITION_COLOR = '#FFA500';
const LABEL_COLOR = '#000000';

interface TradingChartProps {
  symbol?: string;
  selectedAccountId?: number;
  accountDetails?: any;
  userId?: string;
  relevantTrades?: any[];
  relevantOrders?: any[];
  currency?: string;
}

const TradingChart: React.FC<TradingChartProps> = ({
  symbol = 'BTCUSD',
  selectedAccountId,
  accountDetails,
  userId,
  relevantTrades = [],
  relevantOrders = [],
  currency = 'USD'
}) => {
  const [webViewRef, setWebViewRef] = useState<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const baseUrl = `${FileSystem.bundleDirectory}charting_assets/`;

  // Generate the HTML content with dynamic symbol and styling
  const htmlContent = useMemo(() => `
<!DOCTYPE HTML>
<html style="height: 100%; margin: 0; padding: 0;">
<head>
    <title>TradingView Advanced Charts</title>
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no">
    <base href="${baseUrl}">
    
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
        #tv_chart_container {
            height: 100% !important;
            width: 100% !important;
            position: relative;
            background-color: #0f0f0f;
        }
        /* Custom position line styles */
        .custom-position-line {
            position: absolute !important;
            width: 100%;
            height: 2px;
            z-index: 1000 !important;
            pointer-events: none !important;
        }
        .position-label {
            position: absolute;
            right: 10px;
            top: -12px;
            padding: 2px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
            white-space: nowrap;
        }
        /* Hide symbol info elements */
        .chart-markup-table.pane,
        .layout__area--center .pane-legend,
        [data-name="legend"],
        .legend-source-item {
            display: none !important;
        }
    </style>
    
    <script type="text/javascript" src="charting_library/charting_library.standalone.js"></script>
    <script type="text/javascript" src="datafeeds/udf/dist/bundle.js"></script>
    
    <script type="text/javascript">
        function log(type, message) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
            }
        }
        
        window.addEventListener('error', function(e) {
            log('error', '❌ Error: ' + e.message);
        });
        
        log('info', '📜 Scripts loaded');
        
        let chartWidget = null;
        
        window.addEventListener('DOMContentLoaded', function() {
            log('info', '📱 DOM ready');
            
            try {
                if (typeof TradingView === 'undefined') {
                    log('error', '❌ TradingView not found');
                    document.body.innerHTML = '<div style="color:white;padding:20px;font-family:Arial;">Error: TradingView library not loaded.</div>';
                    return;
                }
                
                log('success', '✅ TradingView found, initializing...');
                
                chartWidget = new TradingView.widget({
                    fullscreen: false,
                    autosize: true,
                    symbol: '${symbol}',
                    interval: '1D',
                    container: "tv_chart_container",
                    datafeed: new Datafeeds.UDFCompatibleDatafeed(
                        "https://demo-feed-data.tradingview.com"
                    ),
                    library_path: "charting_library/",
                    locale: "en",
                    disabled_features: [
                        "use_localstorage_for_settings",
                        "symbol_info",
                        "display_market_status",
                        "header_symbol_search",
                        "header_compare",
                        "header_undo_redo"
                    ],
                    enabled_features: [
                        "study_templates",
                        "hide_left_toolbar_by_default"
                    ],
                    charts_storage_url: 'https://saveload.tradingview.com',
                    charts_storage_api_version: "1.1",
                    client_id: 'tradingview.com',
                    user_id: 'public_user_id',
                    theme: 'dark',
                    toolbar_bg: '#1a1a1a',
                    overrides: {
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
                
                chartWidget.onChartReady(() => {
                    log('success', '🎉 Chart initialized!');
                    
                    // Hide symbol info after chart loads
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
                
            } catch (error) {
                log('error', '❌ Init error: ' + error.message);
            }
        });
        
        // Function to update symbol dynamically
        window.updateSymbol = function(newSymbol) {
            if (chartWidget && chartWidget.setSymbol) {
                chartWidget.setSymbol(newSymbol, chartWidget.activeChart().resolution());
                log('info', '📊 Symbol updated to: ' + newSymbol);
            }
        };
        
        // Function to inject position lines
        window.injectPositionLines = function(trades, orders, currency) {
            log('info', '📍 Injecting position lines...');
            
            // Remove existing lines
            const existingLines = document.querySelectorAll('.custom-position-line');
            existingLines.forEach(line => line.remove());
            
            const container = document.getElementById('tv_chart_container');
            if (!container) {
                log('error', '❌ Chart container not found');
                return;
            }
            
            const chartHeight = container.offsetHeight;
            const priceScale = chartWidget.activeChart().getPriceScale();
            
            // Helper function to calculate Y position
            function getPriceYPosition(price) {
                // This is a simplified calculation
                // In production, you'd use the actual price scale API
                const chartTop = 100; // Approximate top offset
                const chartBottom = chartHeight - 100; // Approximate bottom offset
                const priceRange = priceScale.getVisibleRange();
                if (!priceRange) return chartHeight / 2;
                
                const relativePosition = (price - priceRange.from) / (priceRange.to - priceRange.from);
                return chartBottom - (relativePosition * (chartBottom - chartTop));
            }
            
            // Helper function to create position line
            function createPositionLine(price, text, color, type = 'position') {
                const line = document.createElement('div');
                line.className = 'custom-position-line';
                line.style.backgroundColor = color;
                line.style.borderTop = '2px solid ' + color;
                line.style.top = getPriceYPosition(price) + 'px';
                
                const label = document.createElement('div');
                label.className = 'position-label';
                label.style.backgroundColor = color;
                label.style.color = type === 'position' ? '${LABEL_COLOR}' : '#ffffff';
                label.textContent = text;
                line.appendChild(label);
                
                return line;
            }
            
            // Add trade lines
            trades.forEach(trade => {
                // Position line
                const positionPrice = parseFloat(trade.entry);
                const positionText = trade.position_type.toUpperCase() + ' ' + positionPrice;
                const positionLine = createPositionLine(positionPrice, positionText, '${POSITION_COLOR}');
                container.appendChild(positionLine);
                
                // SL line
                if (trade.sl && trade.sl > 0) {
                    const slPrice = parseFloat(trade.sl);
                    const slAmount = parseFloat(trade.trade_loss || 0).toLocaleString('en-US', {
                        style: 'currency',
                        currency: currency
                    });
                    const slText = 'SL ' + trade.position_type.toUpperCase() + ' ' + trade.entry + ' [' + trade.quantity + '] ' + slAmount;
                    const slLine = createPositionLine(slPrice, slText, '${SL_COLOR}', 'sl');
                    container.appendChild(slLine);
                }
                
                // TP line
                if (trade.tp && trade.tp > 0) {
                    const tpPrice = parseFloat(trade.tp);
                    const tpAmount = parseFloat(trade.trade_profit || 0).toLocaleString('en-US', {
                        style: 'currency',
                        currency: currency
                    });
                    const tpText = 'TP ' + trade.position_type.toUpperCase() + ' ' + trade.entry + ' [' + trade.quantity + '] ' + tpAmount;
                    const tpLine = createPositionLine(tpPrice, tpText, '${TP_COLOR}', 'tp');
                    container.appendChild(tpLine);
                }
            });
            
            // Add order lines
            orders.forEach(order => {
                const orderPrice = parseFloat(order.price);
                const orderText = order.order_type + ' ' + orderPrice;
                const orderColor = order.position_type === 'long' ? '${TP_COLOR}' : '${SL_COLOR}';
                const orderLine = createPositionLine(orderPrice, orderText, orderColor, 'order');
                container.appendChild(orderLine);
                
                // Order SL
                if (order.sl && order.sl > 0) {
                    const slPrice = parseFloat(order.sl);
                    const slText = 'SL ' + order.order_type + ' ' + order.price + ' [' + order.quantity + ']';
                    const slLine = createPositionLine(slPrice, slText, '${SL_COLOR}', 'order-sl');
                    container.appendChild(slLine);
                }
                
                // Order TP
                if (order.tp && order.tp > 0) {
                    const tpPrice = parseFloat(order.tp);
                    const tpText = 'TP ' + order.order_type + ' ' + order.price + ' [' + order.quantity + ']';
                    const tpLine = createPositionLine(tpPrice, tpText, '${TP_COLOR}', 'order-tp');
                    container.appendChild(tpLine);
                }
            });
            
            log('success', '✅ Position lines injected');
        };
    </script>
</head>
<body style="margin:0px;background:#0f0f0f;">
    <div id="tv_chart_container"></div>
</body>
</html>`, [symbol, baseUrl]);

  // Update symbol when it changes
  useEffect(() => {
    if (webViewRef && isChartReady && symbol) {
      const script = `window.updateSymbol('${symbol}'); true;`;
      webViewRef.injectJavaScript(script);
    }
  }, [webViewRef, isChartReady, symbol]);

  // Inject position lines when data changes
  const injectPositionLines = useCallback(() => {
    if (!webViewRef || !isChartReady || (!relevantTrades.length && !relevantOrders.length)) {
      return;
    }

    const script = `
      window.injectPositionLines(
        ${JSON.stringify(relevantTrades)},
        ${JSON.stringify(relevantOrders)},
        '${currency}'
      );
      true;
    `;
    
    webViewRef.injectJavaScript(script);
  }, [webViewRef, isChartReady, relevantTrades, relevantOrders, currency]);

  // Inject lines when trades/orders change
  useEffect(() => {
    if (isChartReady && (relevantTrades.length > 0 || relevantOrders.length > 0)) {
      const timer = setTimeout(() => {
        injectPositionLines();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isChartReady, injectPositionLines, relevantTrades, relevantOrders]);

  // Handle messages from WebView
  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const icon = data.type === 'error' ? '🔴' : 
                  data.type === 'success' ? '🎉' : '💬';
      console.log(`${icon} WebView: ${data.message}`);
      
      if (data.type === 'chartReady') {
        setIsChartReady(true);
      }
    } catch (e) {
      console.log('💬 WebView:', event.nativeEvent.data);
    }
  }, []);

  // Loading state
//   if (!accountDetails || !selectedAccountId) {
//     return (
//       <View style={styles.loadingContainer}>
//         <TrendingUp size={32} color="#00d4aa" />
//         <Text style={styles.loadingText}>Loading account details...</Text>
//       </View>
//     );
//   }

  return (
    <View style={styles.container}>
      <WebView
        ref={setWebViewRef}
        source={{ 
          html: htmlContent,
          baseUrl: baseUrl
        }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        startInLoadingState={true}
        
        onLoadStart={() => console.log('📱 WebView: Load started')}
        onLoadEnd={() => console.log('🏁 WebView: Load ended')}
        
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
        }}
        
        onMessage={onMessage}
        
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <TrendingUp size={32} color="#00d4aa" />
            <Text style={styles.loadingText}>
              Loading {symbol} chart...
            </Text>
          </View>
        )}
        
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    gap: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default TradingChart;