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
          
         // In your getTradingViewHTML function, update the widget configuration:

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
        // Add these disabled features to remove volume and studies
        "disabled_features": [
            "symbol_info",
            "display_market_status",
            "volume_force_overlay",
            "create_volume_indicator_by_default",
            "studies_on_charts"
        ],
        // Add these enabled features for cleaner chart
        "enabled_features": [
            "hide_left_toolbar_by_default"
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
            "scalesProperties.backgroundColor": "#1a1a1a",
            // Remove volume indicator
            "volumePaneSize": "compat",
            "mainSeriesProperties.showCountdown": false,
            "mainSeriesProperties.visible": true,
            // Hide volume bars specifically
            "volumePaneSize": "small"
        },
        // Add studies_overrides to ensure no default studies
        "studies_overrides": {
            "volume.volume.color.0": "rgba(0,0,0,0)",
            "volume.volume.color.1": "rgba(0,0,0,0)",
            "volume.volume.transparency": 100
        }
    });

          // After chart is ready, remove any volume studies
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
          // injectPositionLines();
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