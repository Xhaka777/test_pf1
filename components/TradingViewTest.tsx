import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { ChartBar as BarChart3, TrendingUp, Maximize2 } from 'lucide-react-native';

const popularSymbols = [  
  { symbol: 'BTCUSD', name: 'Bitcoin' },
  { symbol: 'ETHUSD', name: 'Ethereum' },
];

export default function ChartsScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');

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
            }
        </style>
    </head>
    <body>
        <div class="tradingview-widget-container">
            <div id="tradingview_chart"></div>
        </div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
            function initChart() {
                new TradingView.widget({
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
            }
            
            if (typeof TradingView !== 'undefined') {
                initChart();
            } else {
                window.addEventListener('load', initChart);
            }
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Symbol selector - compact version */}
      <View style={styles.symbolsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.symbolsContent}>
          {popularSymbols.map((item) => (
            <TouchableOpacity
              key={item.symbol}
              style={[
                styles.symbolButton,
                selectedSymbol === item.symbol && styles.selectedSymbolButton
              ]}
              onPress={() => setSelectedSymbol(item.symbol)}>
              <Text style={[
                styles.symbolText,
                selectedSymbol === item.symbol && styles.selectedSymbolText
              ]}>
                {item.symbol}
              </Text>
              <Text style={[
                styles.symbolName,
                selectedSymbol === item.symbol && styles.selectedSymbolName
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chart container - takes remaining space */}
      <View style={styles.chartContainer}>
        <WebView
          source={{ html: getTradingViewHTML(selectedSymbol) }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <TrendingUp size={32} color="#00d4aa" />
              <Text style={styles.loadingText}>Loading chart...</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  // Compact symbol selector
  symbolsContainer: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 8, // Reduced from 16
  },
  symbolsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  symbolButton: {
    paddingHorizontal: 12, // Reduced from 16
    paddingVertical: 8,    // Reduced from 12
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedSymbolButton: {
    backgroundColor: '#00d4aa',
    borderColor: '#00d4aa',
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedSymbolText: {
    color: '#ffffff',
  },
  symbolName: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  selectedSymbolName: {
    color: '#ffffff',
  },
  // Chart takes remaining space
  chartContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingContainer: {
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