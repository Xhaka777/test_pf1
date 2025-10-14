import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  quantity: number;
}

interface SimpleTradingViewPositionsProps {
  symbol?: string;
  positions?: Position[];
}

const SimpleTradingViewPositions: React.FC<SimpleTradingViewPositionsProps> = ({
  symbol = 'AAPL',
  positions = [
    {
      id: '1',
      symbol: 'AAPL',
      side: 'LONG',
      entry: 173.68,
      quantity: 12
    },
    {
      id: '2',
      symbol: 'AAPL',
      side: 'LONG',
      entry: 175.50,
      quantity: 10
    },
    {
      id: '3',
      symbol: 'AAPL',
      side: 'SHORT',
      entry: 170.25,
      quantity: 8
    }
  ]
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const baseUrl = `${FileSystem.bundleDirectory}charting_assets/`;

  console.log('=== SimpleTradingViewPositions RENDER ===');
  console.log('Symbol:', symbol);
  console.log('Positions:', JSON.stringify(positions, null, 2));
  console.log('IsReady:', isReady);

  const handleWebViewMessage = (event: any) => {
    console.log('=== Message from WebView ===');
    console.log('Raw data:', event.nativeEvent.data);
    
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Parsed message:', JSON.stringify(message, null, 2));
      
      if (message.type === 'ready') {
        console.log('✅ Chart is READY');
        setIsReady(true);
      } else if (message.type === 'log') {
        console.log(`[WebView Log] ${message.level}:`, message.message);
      } else if (message.type === 'error') {
        console.error('[WebView Error]:', message.message);
      } else if (message.type === 'positions_created') {
        console.log('✅ Positions created successfully:', message.count);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  };

  useEffect(() => {
    console.log('=== useEffect [isReady, positions] ===');
    console.log('isReady:', isReady);
    console.log('positions length:', positions?.length);
    
    if (isReady && webViewRef.current) {
      const message = { 
        type: 'positions', 
        positions 
      };
      console.log('📤 Sending positions to WebView:', JSON.stringify(message, null, 2));
      webViewRef.current.postMessage(JSON.stringify(message));
    } else {
      console.log('⏳ Not ready to send positions yet');
    }
  }, [isReady, positions]);

  const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script type="text/javascript" src="charting_library/charting_library.js"></script>
    <script type="text/javascript" src="datafeeds/udf/dist/bundle.js"></script>
    <style>
      html, body, #tv_chart_container {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: #100E0F;
      }
    </style>
  </head>
  <body>
    <div id="tv_chart_container"></div>
    <script>
      // This mimics your web implementation structure
      let tvWidgetRef = null;  // Like: const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);
      let shapesListRef = [];  // Like: const shapesListRef = useRef<IPositionLineAdapter[]>([]);
      
      const POSITION_COLOR = '#FFA500';
      const LABEL_COLOR = '#000000';

      function sendLog(level, message) {
        try {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ 
            type: 'log',
            level: level,
            message: message 
          }));
        } catch (e) {
          console.error('Failed to send log:', e);
        }
      }

      function sendError(message) {
        try {
          window.ReactNativeWebView?.postMessage(JSON.stringify({ 
            type: 'error',
            message: message 
          }));
        } catch (e) {
          console.error('Failed to send error:', e);
        }
      }

      // Like your getSafeActiveChart function
      function getSafeActiveChart() {
        try {
          if (!tvWidgetRef) {
            return null;
          }
          const chart = tvWidgetRef.activeChart();
          return chart || null;
        } catch (error) {
          sendError('Failed to get active chart: ' + error.message);
          return null;
        }
      }

      // Like your clearShapes function
      function clearShapes() {
        sendLog('info', 'Clearing ' + shapesListRef.length + ' existing shapes');
        shapesListRef.forEach((shape, index) => {
          try {
            shape.remove();
            sendLog('info', 'Removed shape ' + (index + 1));
          } catch (error) {
            sendError('Error removing shape ' + (index + 1) + ': ' + error.message);
          }
        });
        shapesListRef = [];
      }

      // Like your appendShape function
      function appendShape(newShape) {
        shapesListRef.push(newShape);
      }

      // Like your addPositionLinesToChart function
      function addPositionLinesToChart(positions) {
        sendLog('info', '=== addPositionLinesToChart called ===');
        
        clearShapes();

        const chart = getSafeActiveChart();
        if (!chart) {
          sendError('❌ Chart not available');
          return;
        }

        const symbolInfo = chart.symbolExt();
        if (!symbolInfo) {
          sendError('❌ Symbol info not available');
          return;
        }

        sendLog('info', 'Current chart symbol: ' + symbolInfo.name);
        sendLog('info', 'Processing ' + positions.length + ' positions');

        let successCount = 0;

        positions.forEach((position, index) => {
          sendLog('info', '--- Processing position ' + (index + 1) + ' ---');
          sendLog('info', 'Position symbol: ' + position.symbol + ', Chart symbol: ' + symbolInfo.name);

          // Check if position is for current symbol (like your web code does)
          if (symbolInfo.name !== position.symbol) {
            sendLog('info', 'Skipping position - symbol mismatch');
            return;
          }

          try {
            // Try createPositionLine first (like your web askLineRef implementation)
            let line = null;
            
            if (typeof chart.createPositionLine === 'function') {
              sendLog('info', 'Using createPositionLine (available without Trading Platform)');
              line = chart.createPositionLine();
              
              if (line) {
                // Apply styling for position line
                line
                  .setPrice(position.entry)
                  .setText(position.side.toUpperCase() + ' ' + position.entry + ' [' + position.quantity + ']')
                  .setQuantity(position.quantity.toString())
                  .setLineColor(POSITION_COLOR)
                  .setLineWidth(2)
                  .setLineStyle(0)
                  .setBodyTextColor(LABEL_COLOR)
                  .setQuantityTextColor(LABEL_COLOR)
                  .setBodyBackgroundColor(POSITION_COLOR)
                  .setQuantityBackgroundColor(POSITION_COLOR);
                  
                sendLog('info', '✅ Position line created with createPositionLine');
              }
            } else if (typeof chart.createOrderLine === 'function') {
              sendLog('info', 'Trying createOrderLine (requires Trading Platform)');
              line = chart.createOrderLine();
              
              if (line) {
                // Apply styling for order line
                line
                  .setPrice(position.entry)
                  .setQuantity(position.quantity.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  }))
                  .setText(position.side.toUpperCase() + ' ' + position.entry)
                  .setLineColor(POSITION_COLOR)
                  .setBodyBorderColor(POSITION_COLOR)
                  .setQuantityBorderColor(POSITION_COLOR)
                  .setQuantityBackgroundColor(POSITION_COLOR)
                  .setCancelButtonBorderColor(POSITION_COLOR)
                  .setCancelButtonIconColor(POSITION_COLOR)
                  .setBodyTextColor(LABEL_COLOR);
                  
                sendLog('info', '✅ Order line created with createOrderLine');
              }
            } else {
              throw new Error('Neither createPositionLine nor createOrderLine available');
            }
            
            if (!line) {
              throw new Error('Line creation returned null');
            }

            // Store it like: appendShape(line)
            appendShape(line);
            successCount++;
            
            sendLog('info', '✅ Position line ' + (index + 1) + ' created successfully');
          } catch (error) {
            sendError('❌ Error creating position line ' + (index + 1) + ': ' + error.message);
            sendError('Stack: ' + error.stack);
          }
        });

        sendLog('info', '=== Complete: ' + successCount + ' / ' + positions.length + ' positions added ===');
        
        window.ReactNativeWebView?.postMessage(JSON.stringify({ 
          type: 'positions_created',
          count: successCount 
        }));
      }

      function initTradingViewWidget() {
        sendLog('info', '📊 Initializing TradingView widget...');

        if (typeof TradingView === 'undefined') {
          sendError('❌ TradingView library not loaded');
          return;
        }

        if (typeof Datafeeds === 'undefined') {
          sendError('❌ Datafeeds library not loaded');
          return;
        }

        try {
          // This is exactly like: tvWidgetRef.current = new window.TradingView.widget(...)
          // CRITICAL: Must enable trading_platform to use createOrderLine()
          tvWidgetRef = new TradingView.widget({
            autosize: true,
            symbol: '${symbol}',
            interval: 'D',
            container: 'tv_chart_container',
            datafeed: new Datafeeds.UDFCompatibleDatafeed('https://demo-feed-data.tradingview.com'),
            library_path: 'charting_library/',
            locale: 'en',
            theme: 'dark',
            disabled_features: ['use_localstorage_for_settings'],
            enabled_features: ['trading_platform'],  // CRITICAL: Enables createOrderLine()
            overrides: {
              'paneProperties.background': '#100E0F',
              'paneProperties.backgroundType': 'solid',
            },
          });

          sendLog('info', '✅ Widget created successfully');

          // This is exactly like your onChartReady callback
          tvWidgetRef.onChartReady(() => {
            sendLog('info', '📈 Chart ready callback fired');
            const chart = getSafeActiveChart();
            
            if (chart) {
              try {
                const symbolExt = chart.symbolExt();
                sendLog('info', 'Chart symbol: ' + JSON.stringify(symbolExt));
              } catch (e) {
                sendLog('warn', 'Could not get symbol: ' + e.message);
              }
            }
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));
          });
        } catch (error) {
          sendError('❌ Error creating widget: ' + error.message);
        }
      }

      // Handle messages from React Native
      function handleMessage(event) {
        sendLog('info', '📨 Message received in WebView');
        
        try {
          const msg = JSON.parse(event.data);
          sendLog('info', 'Message type: ' + msg.type);
          
          if (msg.type === 'positions' && Array.isArray(msg.positions)) {
            sendLog('info', '📍 Processing positions message');
            addPositionLinesToChart(msg.positions);
          }
        } catch (e) {
          sendError('❌ Message parse error: ' + e.message);
        }
      }

      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);

      // Initialize
      sendLog('info', '🚀 Starting initialization...');
      initTradingViewWidget();
    </script>
  </body>
</html>
`;

  console.log('=== Rendering WebView ===');

  return (
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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView Error:', nativeEvent);
        }}
        onLoadStart={() => console.log('📥 WebView load started')}
        onLoadEnd={() => console.log('📦 WebView load ended')}
        onLoad={() => console.log('✅ WebView loaded')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SimpleTradingViewPositions;