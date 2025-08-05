import React, { useCallback, useRef, useMemo, useEffect, useState } from "react";
import Header from "@/components/Header/header";
import { useAccounts, useBrokerAccounts } from "@/hooks";
import { ActivityIndicator, Alert, BackHandler, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronsUpDown, ChevronUp, Edit, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";
import BottomSheet, { BottomSheetModal } from "@gorhom/bottom-sheet";
import EditPositionBottomSheet from "@/components/EditPositionBottomSheet";
import ClosePositionBottomSheet from "@/components/ClosePositionBottomSheet";
import PositionCard from "@/components/positions/PositionCard";
import OrderCard from "@/components/positions/OrderCard";
import { tags } from "react-native-svg/lib/typescript/xmlTags";
import HistoryCard from "@/components/positions/HistoryCard";
import ScreenShotBottomSheet from "@/components/ScreenShotBottomsheet";
import { useFocusEffect } from "expo-router";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { useCloseAllTradesMutation, useGetOpenTradesQuery, useSyncTradesMutation } from "@/api/hooks/trade-service";
import { useGetTradeHistory } from "@/api/hooks/trade-history";
import { CloseTypeEnum, OpenTradesData } from "@/api/schema";
import { StatusEnum } from "@/api/services/api";
import { parseOrdersArray, parseTradesArray } from "@/utils/data-parsing";
import { oneClickTradingEnabledAtom } from "@/atoms";
import { useOpenTradesManager } from "@/api/hooks/use-open-trades-manager";

// Types
interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  size: number;
  pnl: number;
  entry: number;
  fees: number;
  tp?: number;
  sl?: number;
  roi: number;
  openTime: string;
}

interface TabData {
  openPositions: Position[];
  openOrders: any[];
  orderHistory: any[];
}

enum TabId {
  OpenPositions = 'open-positions',
  OpenOrders = 'open-orders',
  OrderHistory = 'order-history',
}

type AlertType = 'sync' | 'closeProfits' | 'closeLosses' | 'closeAll' | null;

const Positions = () => {
  const [activeTab, setActiveTab] = useState<TabId>(TabId.OpenPositions);
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [currentAlert, setCurrentAlert] = useState<AlertType>(null);
  const [alertTimeoutId, setAlertTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);

  const { selectedAccountId, selectedPreviewAccountId } = useAccounts();
  const { data } = useOpenPositionsWS();
  const prevCountsRef = useRef<{ trades: number; orders: number }>({
    trades: 0,
    orders: 0
  })

  const { data: openTrades, refetch: refetchTradeHistory } = useOpenTradesManager({
    account: selectedPreviewAccountId ?? selectedAccountId,
  })

  const { data: tradeHistory, refetch: refetchTradeHistory } = useGetTradeHistory({
    account: selectedPreviewAccountId ?? selectedAccountId,
    page
  })

  const { mutateAsync: syncTrades } = useSyncTradesMutation();
  const { mutateAsync: closeAllTrades } = useCloseAllTradesMutation();

  //Bottom sheet refs
  const editBottomSheetRef = useRef<BottomSheetModal>(null);
  const closeBottomSheetRef = useRef<BottomSheetModal>(null);
  const screenShotBottomSheetRef = useRef<BottomSheetModal>(null);

  const tableData: OpenTradesData | null = useMemo(() => {
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
        }
      }
      return null;
    }
    //
    const isWebSocketStale = data?.account && data.account !== currentAccountId;
    if (isWebSocketStale) {
      console.log('WebSocket data account mismatch detected - using API only',
        `WS: ${data?.account}, Current: ${currentAccountId}`
      )
      return openTrades;
    }

    if (data && data.account === currentAccountId) {
      return {
        account: openTrades.account,
        status: openTrades.status,
        //
        open_trades: parseTradesArray(data.open_trades || []),
        open_orders: parseOrdersArray(data.open_orders || []),
        //
        other_open_trades: parseTradesArray(openTrades.other_open_trades || []),
        other_open_orders: parseOrdersArray(openTrades.other_open_orders || []),
      }
    }

    if (openTrades) {
      return {
        ...openTrades,
        open_trades: parseTradesArray(openTrades.open_trades || []),
        open_orders: parseOrdersArray(openTrades.open_orders || []),
        other_open_trades: parseTradesArray(openTrades.other_open_trades || []),
        other_open_orders: parseOrdersArray(openTrades.other_open_orders || []),
      }
    }

    return openTrades;
  }, [data, openTrades, selectedAccountId, selectedPreviewAccountId]);

  useEffect(() => {
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
  ])

  useEffect(() => {
    prevCountsRef.current = { trades: 0, orders: 0 };
  }, [selectedAccountId])

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

  const handleSyncTrades = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('syncing');

    try {
      const response = await syncTrades({
        account: selectedPreviewAccountId ?? selectedAccountId
      })

      if (response.status === StatusEnum.SUCCESS) {
        showAlert('sync', 5000);
        setExpandedPositions(new Set());
      } else {
        Alert.alert('Error syncing trades', response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    }
  }, [isLoading, showAlert, syncTrades, selectedAccountId, selectedPreviewAccountId]);

  const handleCloseTrades = useCallback(async (closeType: CloseTypeEnum) => {
    if (isLoading) return;

    // Show confirmation dialog before proceeding
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
  }, [isLoading, closeAllTrades, selectedAccountId, selectedPreviewAccountId, showAlert]);

  const handleCloseProfits = useCallback(() => handleCloseTrades(CloseTypeEnum.PROFIT), [handleCloseTrades]);
  const handleCloseLosses = useCallback(() => handleCloseTrades(CloseTypeEnum.LOSS), [handleCloseTrades]);
  const handleCloseAll = useCallback(() => handleCloseTrades(CloseTypeEnum.ALL), [handleCloseTrades]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (editBottomSheetRef.current) {
          editBottomSheetRef.current.close();
          return true;
        }
        if (closeBottomSheetRef.current) {
          closeBottomSheetRef.current.close();
          return true;
        }
        if (screenShotBottomSheetRef.current) {
          screenShotBottomSheetRef.current.close();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    return () => {
      clearAlertTimeout();
    };
  }, [clearAlertTimeout]);

  const openEditModal = useCallback((position: Position) => {
    setSelectedPosition(position);
    setTimeout(() => {
      try {
        editBottomSheetRef.current?.present();
      } catch (error) {
        console.error('Error opening edit modal:', error);
      }
    }, 100);
  }, []);

  const openCloseModal = useCallback((position: Position) => {
    setSelectedPosition(position);
    setTimeout(() => {
      try {
        closeBottomSheetRef.current?.present();
      } catch (error) {
        console.error('Error opening close modal:', error);
      }
    }, 100);
  }, []);

  const openScreenShotModal = useCallback((history: any) => {
    setSelectedHistory(history);
    setTimeout(() => {
      try {
        screenShotBottomSheetRef.current?.present();
      } catch (error) {
        console.error('Error opening screenshot modal:', error);
      }
    }, 100);
  }, []);

  const closeEditModal = useCallback(() => {
    try {
      editBottomSheetRef.current?.dismiss();
      setSelectedPosition(null);
    } catch (error) {
      console.error('Error closing edit modal:', error);
    }
  }, []);

  const closeCloseModal = useCallback(() => {
    try {
      closeBottomSheetRef.current?.dismiss();
      setSelectedPosition(null);
    } catch (error) {
      console.error('Error closing close modal:', error);
    }
  }, []);

  const closeScreenShotModal = useCallback(() => {
    try {
      screenShotBottomSheetRef.current?.dismiss();
      setSelectedHistory(null);
    } catch (error) {
      console.error('Error closing screenshot modal:', error);
    }
  }, []);

  const handleSavePosition = useCallback((formData: any) => {
    console.log('Saving position changes:', formData);
    console.log('For position:', selectedPosition);
    closeEditModal();
  }, [selectedPosition, closeEditModal]);

  const handleClosePosition = useCallback((percentage: number, customAmount?: string) => {
    closeCloseModal();
  }, [closeCloseModal]);

  const handleScreenShot = useCallback((history: any) => {
    closeScreenShotModal();
  }, [closeScreenShotModal]);

  const toggleExpansion = useCallback((positionId: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) {
        newSet.delete(positionId);
      } else {
        newSet.add(positionId);
      }
      return newSet;
    });
  }, []);

  const tabData = useMemo(() => ({
    openPositions: tableData?.open_trades ?? [],
    openOrders: tableData?.open_orders ?? [],
    orderHistory: tradeHistory?.all_trades ?? []
  }), [tableData, tradeHistory]);

  const renderTabs = useMemo(() => (
    <View className="flex-row bg-[#100E0F] border-b border-gray-700">
      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OpenPositions ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OpenPositions)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OpenPositions ? 'text-white' : 'text-gray-400'}`}>
          Open Positions {tabData.openPositions.length}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OpenOrders ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OpenOrders)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OpenOrders ? 'text-white' : 'text-gray-400'}`}>
          Open Orders {tabData.openOrders.length}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === TabId.OrderHistory ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab(TabId.OrderHistory)}
      >
        <Text className={`text-center font-medium ${activeTab === TabId.OrderHistory ? 'text-white' : 'text-gray-400'}`}>
          Order History {tradeHistory?.total_count ?? 0}
        </Text>
      </TouchableOpacity>
    </View>
  ), [activeTab, tabData, tradeHistory?.total_count]);

  const renderActionButtons = useMemo(() => (
    <View className="flex-row px-1 py-1 mt-1 bg-[#100E0F]">
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
  ), [isLoading, loadingAction, handleSyncTrades, handleCloseProfits, handleCloseLosses, handleCloseAll]);




  const renderContent = useCallback(() => {
    switch (activeTab) {
      case TabId.OpenPositions:
        return (
          <ScrollView className="flex-1">
            {tabData.openPositions.map(position => (
              <PositionCard
                key={position.id}
                position={position}
                isExpanded={expandedPositions.has(position.id)}
                onToggleExpansion={toggleExpansion}
                onEdit={openEditModal}
                onClose={openCloseModal}
              />
            ))}
          </ScrollView>
        );
      case TabId.OpenOrders:
        return (
          <ScrollView className="flex-1">
            {tabData.openOrders.length > 0 ? (
              tabData.openOrders.map(order => (
                <OrderCard
                  openOrders={tabData?.openOrders ?? []}
                  oneClickTradingEnabled={oneClickTradingEnabled}
                  onEditOrder={openEditModal}
                  onCancelOrder={openCloseModal}
                />
              ))
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400">No open orders</Text>
              </View>
            )}
          </ScrollView>
        );
      case TabId.OrderHistory:
        return (
          <ScrollView className="flex-1">
            {tabData.orderHistory.length > 0 ? (
              tabData.orderHistory.map(history => (
                <HistoryCard
                  key={history.id}
                  history={history}
                  isExpanded={expandedPositions.has(history.id)}
                  onToggleExpansion={toggleExpansion}
                  onScreenShot={openScreenShotModal}
                />
              ))
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400">No order history</Text>
              </View>
            )}
          </ScrollView>
        );
      default:
        return null;
    }
  }, [activeTab, expandedPositions, toggleExpansion, openEditModal, openCloseModal, openScreenShotModal, tabData]);

  //Alert component
  const renderAlert = useCallback(() => {
    if (currentAlert !== type) return null;

    if (!currentAlert) return null;

    const getAlertContent = () => {
      switch (currentAlert) {
        case 'sync':
          return {
            title: 'Trades synced successfully',
            message: 'All trades are synced'
          };
        case 'closeProfits':
          return {
            title: 'Trades closed successfully',
            message: 'All profit trades closed'
          };
        case 'closeLosses':
          return {
            title: 'Trades closed successfully',
            message: 'All loss trades closed'
          };
        case 'closeAll':
          return {
            title: 'Trades closed successfully',
            message: 'All trades closed'
          };
        default:
          return { title: '', message: '' };
      }
    }

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
    )
  }, [currentAlert])

  return (
    <SafeAreaView className="flex-1 bg-[#100E0F]">
      <Header />
      {renderTabs}
      {activeTab === TabId.OpenPositions && renderActionButtons}
      {renderContent()}

      <EditPositionBottomSheet
        ref={editBottomSheetRef}
        position={selectedPosition}
        onSave={handleSavePosition}
        onClose={closeEditModal}
      />

      <ClosePositionBottomSheet
        ref={closeBottomSheetRef}
        position={selectedPosition}
        onClose={closeCloseModal}
        onClosePosition={handleClosePosition}
      />

      <ScreenShotBottomSheet
        ref={screenShotBottomSheetRef}
        history={selectedHistory}
        onClose={closeScreenShotModal}
        onScreenShot={handleScreenShot}
      />

      {renderAlert()}

      {isLoading && (
        <View className="absolute inset-0 bg-black bg-opacity-50 flex-1 items-center justify-center">
          <View className="bg-gray-900 rounded-2xl p-8 items-center shadow-2xl border border-gray-700">
            <View className="relative mb-4">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <View className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-30" />
            </View>
            <Text className="text-white text-lg font-InterSemiBold">
              {loadingAction === 'syncing' && 'Syncing trades...'}
              {loadingAction === 'closing_profits' && 'Closing profitable trades...'}
              {loadingAction === 'closing_losses' && 'Closing losing trades...'}
              {loadingAction === 'closing_all' && 'Closing all trades...'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};



export default Positions