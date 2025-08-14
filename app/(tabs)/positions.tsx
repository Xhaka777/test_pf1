// app/(tabs)/positions.tsx - Fixed version with proper ref handling
import React, { useCallback, useRef, useMemo, useEffect, useState, forwardRef } from "react";
import Header from "@/components/Header/header";
import { useAccounts } from "@/providers/accounts"; 
import { ActivityIndicator, Alert, BackHandler, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import EditPositionBottomSheet from "@/components/EditPositionBottomSheet";
import ClosePositionBottomSheet from "@/components/ClosePositionBottomSheet";
import CloseOrderBottomSheet from "@/components/CloseOrderBottomSheet"; // NEW IMPORT
import PositionCard from "@/components/positions/PositionCard";
import OrderCard from "@/components/positions/OrderCard";
import HistoryCard from "@/components/positions/HistoryCard";
import ScreenShotBottomSheet from "@/components/ScreenShotBottomsheet";
import { useFocusEffect } from "expo-router";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { useCloseAllTradesMutation, useSyncTradesMutation } from "@/api/hooks/trade-service";
import { useGetTradeHistory } from "@/api/hooks/trade-history";
import { CloseTypeEnum, OpenTradesData } from "@/api/schema";
import { StatusEnum } from "@/api/services/api";
import { parseOrdersArray, parseTradesArray } from "@/utils/data-parsing";
import { useOpenTradesManager } from "@/api/hooks/use-open-trades-manager";
import { createMockOpenPositions, createMockTradeHistory } from "@/utils/mock-data"; // Import both mock functions

enum TabId {
  OpenPositions = 'open-positions',
  OpenOrders = 'open-orders',
  OrderHistory = 'order-history',
}

type AlertType = 'sync' | 'closeProfits' | 'closeLosses' | 'closeAll' | null;

const Positions = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.OpenPositions);
  const [currentAlert, setCurrentAlert] = useState<AlertType>(null);
  const [alertTimeoutId, setAlertTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');

  // 🧪 TESTING MODE - Toggle this to enable/disable mock data
  const [useMockData, setUseMockData] = useState(true); // Set to false to use real data

  // Bottom sheet visibility states - matching web pattern
  const [editPositionDialogVisible, setEditPositionDialogVisible] = useState(false);
  const [closePositionDialogVisible, setClosePositionDialogVisible] = useState(false);
  const [closeOrderDialogVisible, setCloseOrderDialogVisible] = useState(false); // NEW STATE
  const [screenshotPositionDialogVisible, setScreenshotPositionDialogVisible] = useState(false);

  // Current selected items for bottom sheets
  const [currentPosition, setCurrentPosition] = useState<OpenTradesData['open_trades'][number] | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OpenTradesData['open_orders'][number] | null>(null);
  const [currentOrderForClose, setCurrentOrderForClose] = useState<OpenTradesData['open_orders'][number] | null>(null); // NEW STATE
  const [currentHistory, setCurrentHistory] = useState<any>(null);

  const { selectedAccountId, selectedPreviewAccountId } = useAccounts();
  const { data } = useOpenPositionsWS();
  const prevCountsRef = useRef<{ trades: number; orders: number }>({
    trades: 0,
    orders: 0
  });

  const { data: openTrades, refetch: refetchOpenTrades } = useOpenTradesManager({
    account: selectedPreviewAccountId ?? selectedAccountId,
  });

  const { data: tradeHistory, refetch: refetchTradeHistory } = useGetTradeHistory({
    account: selectedPreviewAccountId ?? selectedAccountId,
    page
  });

  const { mutateAsync: syncTrades } = useSyncTradesMutation();
  const { mutateAsync: closeAllTrades } = useCloseAllTradesMutation();

  // Bottom sheet refs
  const editBottomSheetRef = useRef<BottomSheetModal>(null);
  const closeBottomSheetRef = useRef<BottomSheetModal>(null);
  const closeOrderBottomSheetRef = useRef<BottomSheetModal>(null); // NEW REF
  const screenShotBottomSheetRef = useRef<BottomSheetModal>(null);

  // 🧪 Create mock data
  const mockData = useMemo(() => {
    if (!useMockData) return null;
    const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;
    return createMockOpenPositions(currentAccountId || 1); // Use account ID or default to 1
  }, [useMockData, selectedAccountId, selectedPreviewAccountId]);

  // 🧪 Create mock trade history data
  const mockTradeHistory = useMemo(() => {
    if (!useMockData) return null;
    const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;
    return createMockTradeHistory(currentAccountId || 1);
  }, [useMockData, selectedAccountId, selectedPreviewAccountId]);

  // Table data logic - same as web version but with mock data option
  const tableData: OpenTradesData | null = useMemo(() => {
    // 🧪 Use mock data if testing mode is enabled
    if (useMockData && mockData) {
      console.log('🧪 [TESTING] Using mock data with', mockData.open_trades.length, 'trades');
      return mockData;
    }

    const currentAccountId = selectedPreviewAccountId ?? selectedAccountId;

    if (!openTrades) {
      if (
        (data?.open_trades ?? data?.open_orders) &&
        data?.account === currentAccountId
      ) {
        return {
          account: currentAccountId || 0,
          status: StatusEnum.SUCCESS,
          open_trades: data.open_trades || [],
          open_orders: data.open_orders || [],
          other_open_trades: [],
          other_open_orders: [],
        };
      }
      return null;
    }

    const isWebSocketStale = data?.account && data.account !== currentAccountId;
    if (isWebSocketStale) {
      console.log('WebSocket data account mismatch detected - using API only',
        `WS: ${data?.account}, Current: ${currentAccountId}`
      );
      return openTrades;
    }

    if (data && data.account === currentAccountId) {
      return {
        account: openTrades.account,
        status: openTrades.status,
        open_trades: parseTradesArray(data.open_trades || []),
        open_orders: parseOrdersArray(data.open_orders || []),
        other_open_trades: parseTradesArray(openTrades.other_open_trades || []),
        other_open_orders: parseOrdersArray(openTrades.other_open_orders || []),
      };
    }

    if (openTrades) {
      return {
        ...openTrades,
        open_trades: parseTradesArray(openTrades.open_trades || []),
        open_orders: parseOrdersArray(openTrades.open_orders || []),
        other_open_trades: parseTradesArray(openTrades.other_open_trades || []),
        other_open_orders: parseOrdersArray(openTrades.other_open_orders || []),
      };
    }

    return openTrades;
  }, [data, openTrades, selectedAccountId, selectedPreviewAccountId, useMockData, mockData]);

  // Refetch logic - same as web version (but skip when using mock data)
  useEffect(() => {
    if (useMockData) return; // Skip refetch logic when using mock data

    const currentTrades = tableData?.open_trades?.length ?? 0;
    const currentOrders = tableData?.open_orders?.length ?? 0;
    const prevTrades = prevCountsRef.current.trades;
    const prevOrders = prevCountsRef.current.orders;

    if (
      prevOrders > 0 &&
      (currentOrders < prevOrders || currentTrades > prevTrades)
    ) {
      void refetchOpenTrades();
      void refetchTradeHistory();
    }

    prevCountsRef.current = { trades: currentTrades, orders: currentOrders };
  }, [
    tableData?.open_trades?.length,
    tableData?.open_orders?.length,
    refetchOpenTrades,
    refetchTradeHistory,
    useMockData, // Add dependency
  ]);

  useEffect(() => {
    prevCountsRef.current = { trades: 0, orders: 0 };
  }, [selectedAccountId]);

  // Alert management
  const clearAlertTimeout = useCallback(() => {
    if (alertTimeoutId) {
      clearTimeout(alertTimeoutId);
      setAlertTimeoutId(null);
    }
  }, [alertTimeoutId]);

  const showAlert = useCallback((type: AlertType, duration: number = 3000) => {
    clearAlertTimeout();
    setCurrentAlert(type);

    const timeoutId = setTimeout(() => {
      setCurrentAlert(null);
      setAlertTimeoutId(null);
    }, duration);

    setAlertTimeoutId(timeoutId);
  }, [clearAlertTimeout]);

  // Trade actions - same logic as web
  const handleSyncTrades = useCallback(async () => {
    if (isLoading) return;

    // 🧪 Mock the sync action when using mock data
    if (useMockData) {
      setIsLoading(true);
      setLoadingAction('syncing');
      
      // Simulate API delay
      setTimeout(() => {
        setIsLoading(false);
        setLoadingAction('');
        showAlert('sync', 5000);
      }, 1500);
      return;
    }

    setIsLoading(true);
    setLoadingAction('syncing');

    try {
      const response = await syncTrades({
        account: selectedPreviewAccountId ?? selectedAccountId
      });

      if (response.status === StatusEnum.SUCCESS) {
        showAlert('sync', 5000);
      } else {
        Alert.alert('Error syncing trades', response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  }, [isLoading, showAlert, syncTrades, selectedAccountId, selectedPreviewAccountId, useMockData]);

  const handleCloseTrades = useCallback(async (closeType: CloseTypeEnum) => {
    if (isLoading) return;

    const getConfirmationMessage = () => {
      switch (closeType) {
        case CloseTypeEnum.ALL:
          return 'You are about to close ALL trades on this account and any copied accounts. This action cannot be undone.';
        case CloseTypeEnum.PROFIT:
          return 'You are about to close all PROFITABLE trades on this account and any copied accounts. This action cannot be undone.';
        case CloseTypeEnum.LOSS:
          return 'You are about to close all LOSING trades on this account and any copied accounts. This action cannot be undone.';
        default:
          return 'You are about to close trades on this account and any copied accounts. This action cannot be undone.';
      }
    };

    const getConfirmationTitle = () => {
      switch (closeType) {
        case CloseTypeEnum.ALL:
          return 'Close All Trades';
        case CloseTypeEnum.PROFIT:
          return 'Close Profitable Trades';
        case CloseTypeEnum.LOSS:
          return 'Close Losing Trades';
        default:
          return 'Close Trades';
      }
    };

    Alert.alert(
      getConfirmationTitle(),
      getConfirmationMessage(),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Close Trades',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            setLoadingAction(
              closeType === CloseTypeEnum.ALL ? 'closing_all' :
                closeType === CloseTypeEnum.PROFIT ? 'closing_profits' : 'closing_losses'
            );

            // 🧪 Mock the close action when using mock data
            if (useMockData) {
              setTimeout(() => {
                setIsLoading(false);
                setLoadingAction('');
                const alertType =
                  closeType === CloseTypeEnum.ALL ? 'closeAll' :
                    closeType === CloseTypeEnum.PROFIT ? 'closeProfits' : 'closeLosses';
                showAlert(alertType);
              }, 2000);
              return;
            }

            try {
              const response = await closeAllTrades({
                account: selectedPreviewAccountId ?? selectedAccountId,
                close_type: closeType,
              });

              if (response.status === StatusEnum.SUCCESS) {
                const alertType =
                  closeType === CloseTypeEnum.ALL ? 'closeAll' :
                    closeType === CloseTypeEnum.PROFIT ? 'closeProfits' : 'closeLosses';
                showAlert(alertType);
              } else {
                Alert.alert('Error closing trades', response.message);
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error
                ? error.message
                : 'An unexpected error occurred';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
              setLoadingAction('');
            }
          }
        }
      ]
    );
  }, [isLoading, closeAllTrades, selectedAccountId, selectedPreviewAccountId, showAlert, useMockData]);

  const handleCloseProfits = useCallback(() => handleCloseTrades(CloseTypeEnum.PROFIT), [handleCloseTrades]);
  const handleCloseLosses = useCallback(() => handleCloseTrades(CloseTypeEnum.LOSS), [handleCloseTrades]);
  const handleCloseAll = useCallback(() => handleCloseTrades(CloseTypeEnum.ALL), [handleCloseTrades]);

  // Bottom sheet handlers - using refs directly
  const openEditModal = useCallback((position: OpenTradesData['open_trades'][number]) => {
    setCurrentPosition(position);
    setEditPositionDialogVisible(true);
    setTimeout(() => {
      editBottomSheetRef.current?.present();
    }, 100);
  }, []);

  const openCloseModal = useCallback((item: OpenTradesData['open_trades'][number] | OpenTradesData['open_orders'][number]) => {
    if ('position_type' in item) {
      // It's a trade
      setCurrentPosition(item as OpenTradesData['open_trades'][number]);
    } else {
      // It's an order
      setCurrentOrder(item as OpenTradesData['open_orders'][number]);
    }
    setClosePositionDialogVisible(true);
    setTimeout(() => {
      closeBottomSheetRef.current?.present();
    }, 100);
  }, []);

  // NEW HANDLER for close order bottom sheet
  const openCloseOrderModal = useCallback((order: OpenTradesData['open_orders'][number]) => {
    setCurrentOrderForClose(order);
    setCloseOrderDialogVisible(true);
    setTimeout(() => {
      closeOrderBottomSheetRef.current?.present();
    }, 100);
  }, []);

  const openScreenShotModal = useCallback((history: any) => {
    setCurrentHistory(history);
    setScreenshotPositionDialogVisible(true);
    setTimeout(() => {
      screenShotBottomSheetRef.current?.present();
    }, 100);
  }, []);

  // Back handler - UPDATED to include new bottom sheet
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (editPositionDialogVisible) {
          setEditPositionDialogVisible(false);
          editBottomSheetRef.current?.dismiss();
          return true;
        }
        if (closePositionDialogVisible) {
          setClosePositionDialogVisible(false);
          closeBottomSheetRef.current?.dismiss();
          return true;
        }
        if (closeOrderDialogVisible) { // NEW BACK HANDLER
          setCloseOrderDialogVisible(false);
          closeOrderBottomSheetRef.current?.dismiss();
          return true;
        }
        if (screenshotPositionDialogVisible) {
          setScreenshotPositionDialogVisible(false);
          screenShotBottomSheetRef.current?.dismiss();
          return true;
         }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [editPositionDialogVisible, closePositionDialogVisible, closeOrderDialogVisible, screenshotPositionDialogVisible]) // UPDATED dependencies
  );

  useEffect(() => {
    return () => {
      clearAlertTimeout();
    };
  }, [clearAlertTimeout]);

  // Tab data - dynamic based on tableData and with mock history support
  const tabData = useMemo(() => ({
    openPositions: tableData?.open_trades ?? [],
    openOrders: tableData?.open_orders ?? [],
    orderHistory: useMockData && mockTradeHistory ? mockTradeHistory.all_trades : (tradeHistory?.all_trades ?? [])
  }), [tableData, tradeHistory, useMockData, mockTradeHistory]);

  // Render functions
  const renderTabs = useMemo(() => (
    <View className="flex-row bg-[#100E0F] border-b border-gray-700">
      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OpenPositions ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OpenPositions)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OpenPositions ? 'text-white' : 'text-gray-400'}`}>
          Open Positions {tabData.openPositions.length}
          {useMockData && <Text className="text-yellow-400"> 🧪</Text>}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OpenOrders ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OpenOrders)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OpenOrders ? 'text-white' : 'text-gray-400'}`}>
          Open Orders {tabData.openOrders.length}
          {useMockData && <Text className="text-yellow-400"> 🧪</Text>}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OrderHistory ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OrderHistory)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OrderHistory ? 'text-white' : 'text-gray-400'}`}>
          Order History {useMockData && mockTradeHistory ? mockTradeHistory.total_count : (tradeHistory?.total_count ?? 0)}
          {useMockData && <Text className="text-yellow-400"> 🧪</Text>}
        </Text>
      </TouchableOpacity>
    </View>
  ), [activeTab, tabData, tradeHistory?.total_count, useMockData]);

  const renderActionButtons = useMemo(() => (
    <View className="flex-row px-1 py-1 mt-1 bg-[#100E0F]">
      {/* 🧪 Testing mode toggle button */}
      <TouchableOpacity
        className={`flex-1 py-1 px-1 mr-1 rounded-md border ${useMockData ? 'border-yellow-500 bg-yellow-900' : 'border-gray-500'}`}
        onPress={() => setUseMockData(!useMockData)}
      >
        <Text className={`text-center text-sm font-InterSemiBold ${useMockData ? 'text-yellow-400' : 'text-gray-400'}`}>
          {useMockData ? '🧪 MOCK' : '📡 LIVE'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-green-500"
        onPress={handleSyncTrades}
        disabled={isLoading}
      >
        <Text className="text-success-400 text-center text-sm font-InterSemiBold">
          {loadingAction === 'syncing' ? 'Syncing...' : 'Sync Trades'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-green-500"
        onPress={handleCloseProfits}
        disabled={isLoading}
      >
        <Text className="text-success-400 text-center text-sm font-InterSemiBold">
          {loadingAction === 'closing_profits' ? 'Closing...' : 'Close Profits'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-red-500"
        onPress={handleCloseLosses}
        disabled={isLoading}
      >
        <Text className="text-danger-500 text-center text-sm font-InterSemiBold">
          {loadingAction === 'closing_losses' ? 'Closing...' : 'Close Losses'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-red-500"
        onPress={handleCloseAll}
        disabled={isLoading}
      >
        <Text className="text-danger-500 text-center text-sm font-InterSemiBold">
          {loadingAction === 'closing_all' ? 'Closing...' : 'Close All'}
        </Text>
      </TouchableOpacity>
    </View>
  ), [isLoading, loadingAction, handleSyncTrades, handleCloseProfits, handleCloseLosses, handleCloseAll, useMockData]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case TabId.OpenPositions:
        return (
          <ScrollView className="flex-1">
            <PositionCard
              openTrades={tabData.openPositions}
              onEdit={openEditModal}
              onClose={openCloseModal}
            />
          </ScrollView>
        );
      case TabId.OpenOrders:
        return (
          <ScrollView className="flex-1">
            <OrderCard
              openOrders={tabData.openOrders}
              onClose={openCloseOrderModal} // UPDATED to use new handler
            />
          </ScrollView>
        );
      case TabId.OrderHistory:
        return (
          <ScrollView className="flex-1">
            <HistoryCard
              orderHistory={tabData.orderHistory}
              page={page}
              setPage={setPage}
              total={useMockData && mockTradeHistory ? mockTradeHistory.total_count : (tradeHistory?.total_count ?? 0)}
              onScreenShot={openScreenShotModal}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  }, [activeTab, tabData, page, tradeHistory, openEditModal, openCloseModal, openCloseOrderModal, openScreenShotModal]); // UPDATED dependencies

  const renderAlert = useCallback(() => {
    if (!currentAlert) return null;

    const getAlertContent = () => {
      switch (currentAlert) {
        case 'sync':
          return {
            title: 'Trades synced successfully',
            message: useMockData ? 'Mock trades synced (testing mode)' : 'All trades are synced'
          };
        case 'closeProfits':
          return {
            title: 'Trades closed successfully',
            message: useMockData ? 'Mock profit trades closed (testing mode)' : 'All profit trades closed'
          };
        case 'closeLosses':
          return {
            title: 'Trades closed successfully',
            message: useMockData ? 'Mock loss trades closed (testing mode)' : 'All loss trades closed'
          };
        case 'closeAll':
          return {
            title: 'Trades closed successfully',
            message: useMockData ? 'All mock trades closed (testing mode)' : 'All trades closed'
          };
        default:
          return { title: '', message: '' };
      }
    };

    const { title, message } = getAlertContent();

    return (
      <View className="absolute bottom-5 left-4 right-4 bg-[#100E0F] border border-[#1F1B1D] rounded-lg py-1 px-3 shadow-lg">
        <View className="flex-row items-center justify-between p-5">
          <View className="flex-1">
            <Text className="text-white font-InterSemiBold text-base mb-1">{title}</Text>
            <Text className="text-gray-300 font-InterRegular text-base">{message}</Text>
          </View>
          <TouchableOpacity
            className="ml-4 p-2"
            onPress={() => setCurrentAlert(null)}
          >
            <X size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [currentAlert, useMockData]);

  return (
    <SafeAreaView className="flex-1 bg-[#100E0F]">
      <Header />
      {renderTabs}
      {activeTab === TabId.OpenPositions && renderActionButtons}
      {renderContent()}

      {/* Bottom Sheets - using refs directly */}
      {currentPosition && (
        <EditPositionBottomSheet
          ref={editBottomSheetRef}
          isOpen={editPositionDialogVisible}
          onClose={() => {
            setEditPositionDialogVisible(false);
            editBottomSheetRef.current?.dismiss();
            setTimeout(() => setCurrentPosition(null), 100);
          }}
          openTrade={currentPosition}
        />
      )}

      {(currentPosition || currentOrder) && (
        <ClosePositionBottomSheet
          ref={closeBottomSheetRef}
          isOpen={closePositionDialogVisible}
          onClose={() => {
            setClosePositionDialogVisible(false);
            closeBottomSheetRef.current?.dismiss();
            setTimeout(() => {
              setCurrentPosition(null);
              setCurrentOrder(null);
            }, 100);
          }}
          openTrade={currentPosition || currentOrder}
        />
      )}

      {/* NEW BOTTOM SHEET - CloseOrderBottomSheet */}
      {currentOrderForClose && (
        <CloseOrderBottomSheet
          ref={closeOrderBottomSheetRef}
          order={currentOrderForClose}
          accountId={selectedPreviewAccountId ?? selectedAccountId ?? 0}
          onClose={() => {
            setCloseOrderDialogVisible(false);
            closeOrderBottomSheetRef.current?.dismiss();
            setTimeout(() => setCurrentOrderForClose(null), 100);
          }}
        />
      )}

      {currentHistory && (
        <ScreenShotBottomSheet
          ref={screenShotBottomSheetRef}
          isOpen={screenshotPositionDialogVisible}
          onClose={() => {
            setScreenshotPositionDialogVisible(false);
            screenShotBottomSheetRef.current?.dismiss();
            setTimeout(() => setCurrentHistory(null), 100);
          }}
          history={currentHistory}
          isHistory={true}
          backtesting={false}
        />
      )}

      {renderAlert()}

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 items-center justify-center">
          <View className="bg-gray-900 rounded-2xl p-8 items-center shadow-2xl border border-gray-700">
            <View className="relative mb-4">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <View className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-30" />
            </View>
            <Text className="text-white text-lg font-InterSemiBold">
              {loadingAction === 'syncing' && (useMockData ? 'Syncing mock trades...' : 'Syncing trades...')}
              {loadingAction === 'closing_profits' && (useMockData ? 'Closing mock profitable trades...' : 'Closing profitable trades...')}
              {loadingAction === 'closing_losses' && (useMockData ? 'Closing mock losing trades...' : 'Closing losing trades...')}
              {loadingAction === 'closing_all' && (useMockData ? 'Closing all mock trades...' : 'Closing all trades...')}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Positions;