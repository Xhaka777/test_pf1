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

type AlertType = 'sync' | 'closeProfits' | 'closeLosses' | 'closeAll' | null;

const Positions = () => {

  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');
  const [currentAlert, setCurrentAlert] = useState<AlertType>(null);
  const [alertTimeoutId, setAlertTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [showSyncAlert, setShowSyncAlert] = useState(false);
  const [showCloseProfitsAlert, setShowCloseProfitsAlert] = useState(false);
  const [showCloseLossesAlert, setShowCloseLossesAlert] = useState(false);
  const [showCloseAllAlert, setShowCloseAllAlert] = useState(false);


  const editBottomSheetRef = useRef<BottomSheetModal>(null);
  const closeBottomSheetRef = useRef<BottomSheetModal>(null);
  const screenShotBottomSheetRef = useRef<BottomSheetModal>(null);

  // Debug state to track bottom sheet operations
  const [debugInfo, setDebugInfo] = useState<string>('');

    // Add debug logging
    const logDebug = useCallback((message: string) => {
      console.log(`[BottomSheet Debug] ${message}`);
      setDebugInfo(message);
      // Clear debug info after 3 seconds
      setTimeout(() => setDebugInfo(''), 3000);
    }, []);

  // Sample data
  const tabData: TabData = {
    openPositions: [
      {
        id: '1',
        symbol: 'BTCUSDT',
        type: 'LONG',
        size: 0.12,
        pnl: -366.43,
        entry: 108888,
        fees: 0,
        roi: -0.73,
        openTime: '2025/05/29 11:26:33'
      },
      {
        id: '2',
        symbol: 'BTCUSDT',
        type: 'LONG',
        size: 0.01,
        pnl: 29.9,
        entry: 3242.99,
        fees: 0,
        roi: -0.08,
        openTime: '2025/05/29 10:36:32'
      },
      {
        id: '3',
        symbol: 'BTCUSDT',
        type: 'SHORT',
        size: 0.12,
        pnl: 355.63,
        entry: 3242.99,
        fees: 1.59,
        roi: 0.7,
        openTime: '2025/05/29 11:36:32'
      },
      {
        id: '4',
        symbol: 'BTCUSDT',
        type: 'LONG',
        size: 10.00,
        pnl: -64.02,
        entry: 3242.99,
        fees: 1.59,
        roi: -0.03,
        openTime: '2024/06/21 10:36:32'
      }
    ],
    openOrders: [
      {
        id: '5',
        symbol: 'ETHUSDT',
        type: 'LONG',
        orderType: 'LIMIT',
        size: 2.5,
        price: 2450.00,
        status: 'PENDING',
        createdTime: '2025/05/29 12:30:15'
      },
      {
        id: '6',
        symbol: 'BTCUSDT',
        type: 'SHORT',
        orderType: 'STOP',
        size: 0.05,
        price: 107000.00,
        triggerPrice: 107500.00,
        status: 'PENDING',
        createdTime: '2025/05/29 11:45:22'
      }
    ],
    orderHistory: [
      {
        id: '1',
        symbol: 'BTCUSDT',
        type: 'SHORT',
        size: 0.12,
        pnl: 398.43,
        entry: 108888,
        openTime: '2025/05/29 11:26:33',
        exit: 105477.95,
        exitTime: '2025/06/04 11:30:00',
        roi: 0.79,
        fees: 0,
        tags: ['Indigo', 'Purple', 'Gray', 'Violet', 'Blue']
      },
      {
        id: '8',
        symbol: 'BTCUSDT',
        type: 'LONG',
        size: 0.12,
        pnl: -366.43,
        entry: 108888,
        openTime: '2025/05/29 11:26:33',
        exit: 108500,
        exitTime: '2025/05/29 11:30:00',
        roi: -0.73,
        fees: 0,
        tags: ['Indigo', 'Purple', 'Gray', 'Violet', 'Blue']
      }
    ]

  };

  //Cleanup function for alerts
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

  //Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        //Close any open botton sheets first
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
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  )

  //Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAlertTimeout();
    };
  }, [clearAlertTimeout]);

  const openEditModal = useCallback((position: Position) => {
    logDebug(`Opening edit modal for position: ${position.symbol}`);
    setSelectedPosition(position);
    
    // Use setTimeout to ensure state is set before opening
    setTimeout(() => {
      try {
        editBottomSheetRef.current?.present();
        logDebug('Edit modal presented successfully');
      } catch (error) {
        logDebug(`Error opening edit modal: ${error}`);
        console.error('Error opening edit modal:', error);
      }
    }, 100);
  }, [logDebug]);

  const openCloseModal = useCallback((position: Position) => {
    logDebug(`Opening close modal for position: ${position.symbol}`);
    setSelectedPosition(position);
    
    setTimeout(() => {
      try {
        closeBottomSheetRef.current?.present();
        logDebug('Close modal presented successfully');
      } catch (error) {
        logDebug(`Error opening close modal: ${error}`);
        console.error('Error opening close modal:', error);
      }
    }, 100);
  }, [logDebug]);


  const openScreenShotModal = useCallback((history: any) => {
    logDebug(`Opening screenshot modal for: ${history.symbol || history.id}`);
    setSelectedHistory(history);
    
    setTimeout(() => {
      try {
        screenShotBottomSheetRef.current?.present();
        logDebug('Screenshot modal presented successfully');
      } catch (error) {
        logDebug(`Error opening screenshot modal: ${error}`);
        console.error('Error opening screenshot modal:', error);
      }
    }, 100);
  }, [logDebug]);

  const closeEditModal = useCallback(() => {
    logDebug('Closing edit modal');
    try {
      editBottomSheetRef.current?.dismiss();
      setSelectedPosition(null);
    } catch (error) {
      logDebug(`Error closing edit modal: ${error}`);
      console.error('Error closing edit modal:', error);
    }
  }, [logDebug]);

  const closeCloseModal = useCallback(() => {
    logDebug('Closing close modal');
    try {
      closeBottomSheetRef.current?.dismiss();
      setSelectedPosition(null);
    } catch (error) {
      logDebug(`Error closing close modal: ${error}`);
      console.error('Error closing close modal:', error);
    }
  }, [logDebug]);

  const closeScreenShotModal = useCallback(() => {
    logDebug('Closing screenshot modal');
    try {
      screenShotBottomSheetRef.current?.dismiss();
      setSelectedHistory(null);
    } catch (error) {
      logDebug(`Error closing screenshot modal: ${error}`);
      console.error('Error closing screenshot modal:', error);
    }
  }, [logDebug]);

  const handleSavePosition = useCallback((formData: any) => {
    // Handle save logic here
    console.log('Saving position changes:', formData);
    console.log('For position:', selectedPosition);
    closeEditModal();
  }, [selectedPosition, closeEditModal]);

  const handleClosePosition = useCallback((percentage: number, customAmount?: string) => {
    // Handle close position logic here
    closeCloseModal();
  }, [selectedPosition, closeCloseModal]);

  const handleScreenShot = useCallback((history: any) => {
    closeScreenShotModal();
  }, [closeScreenShotModal])

  //Sync Trades handler
  const handleSyncTrades = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('syncing');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('sync', 5000);
      setExpandedPositions(new Set());
    } catch (error) {
      console.log('Error syncing trades:', error);
      Alert.alert('Error', 'Failed to sync trades. Please try again.')
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }

    // setTimeout(() => {
    //   setIsLoading(false);
    //   setLoadingAction('');
    //   setShowSyncAlert(true);
    //   // Auto hide after 5 seconds
    //   setTimeout(() => {
    //     setShowSyncAlert(false);
    //   }, 5000);
    //   // Reset expanded positions
    // }, 3000);
  }, [isLoading, showAlert])

  const handleCloseProfits = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('closing_profits');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('closeProfits');
    } catch (error) {
      console.error('Error closing profits:', error);
      Alert.alert('Error', 'Failed to close profitable trades. Please try again.')
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  }, [isLoading, showAlert]);

  const handleCloseLosses = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('closing_losses');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('closeLosses');
    } catch (error) {
      console.error('Error closing losses:', error);
      Alert.alert('Error', 'Failed to close losing trades. Please try again.')
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
    // Auto hide after 3 seconds
  }, [isLoading, showAlert]);

  const handleCloseAll = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingAction('closing_all');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert('closeAll');
    } catch (error) {
      console.error('Error closing all trades:', error);
      Alert.alert('Error', 'Failed to close to all trades. Please try again.')
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
    // Simulate API call
    // setTimeout(() => {
    //   setIsLoading(false);
    //   setLoadingAction('');
    //   setShowCloseAllAlert(true);
    //   // Auto hide after 3 seconds
    //   setTimeout(() => {
    //     setShowCloseAllAlert(false);
    //   }, 3000);
    // }, 2000);
  }, [isLoading, showAlert]);


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

  const renderTabs = useMemo(() => (
    <View className="flex-row bg-[#100E0F] border-b border-gray-700">
      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === 'positions' ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab('positions')}
      >
        <Text className={`text-center font-medium ${activeTab === 'positions' ? 'text-white' : 'text-gray-400'}`}>
          Open Positions {tabData.openPositions.length}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === 'orders' ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab('orders')}
      >
        <Text className={`text-center font-medium ${activeTab === 'orders' ? 'text-white' : 'text-gray-400'}`}>
          Open Orders {tabData.openOrders.length}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 py-4 ${activeTab === 'history' ? 'border-b-2 border-pink-500' : ''}`}
        onPress={() => setActiveTab('history')}
      >
        <Text className={`text-center font-medium ${activeTab === 'history' ? 'text-white' : 'text-gray-400'}`}>
          Order History {tabData.orderHistory.length}
        </Text>
      </TouchableOpacity>

    </View>
  ), [activeTab, tabData]);

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
      case 'positions':
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
      case 'orders':
        return (
          <ScrollView className="flex-1">
            {tabData.openOrders.length > 0 ? (
              tabData.openOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedPositions.has(order.id)}
                  onToggleExpansion={toggleExpansion}
                  onCancel={openCloseModal}
                />
              ))
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400">No open orders</Text>
              </View>
            )}
          </ScrollView>
        );
      case 'history':
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
  const renderAlert = useCallback((type: AlertType, title: string, message: string) => {
    if (currentAlert !== type) return null;

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
      {activeTab === 'positions' && renderActionButtons}
      {/* <View className="w-full h-0.5 bg-gray-800 mt-1" /> */}
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

      {showSyncAlert && (
        <View className="absolute bottom-5 left-4 right-4 bg-[#100E0F] border border-[#1F1B1D] rounded-lg py-1 px-3 shadow-lg">
          <View className="flex-row items-center justify-between p-5">
            <View className="flex-1">
              <Text className="text-white font-InterSemiBold text-base mb-1">Trades synced successfully</Text>
              <Text className="text-gray-300 font-InterRegular text-base">
                All trades are synced
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4 p-2"
              onPress={() => setShowSyncAlert(false)}>
              {/* <Text className="text-gray-400 text-lg">x</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      )}
      {showCloseProfitsAlert && (
        <View className="absolute bottom-5 left-4 right-4 bg-[#100E0F] border border-[#1F1B1D] rounded-lg py-1 px-3 shadow-lg">
          <View className="flex-row items-center justify-between p-5">
            <View className="flex-1">
              <Text className="text-white font-InterSemiBold text-base mb-1">Trades closed successfully</Text>
              <Text className="text-gray-300 font-InterRegular text-base">
                All profit trades closed
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4 p-2"
              onPress={() => setShowCloseProfitsAlert(false)}
            >
              {/* <Text className="text-gray-400 text-lg">✕</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showCloseLossesAlert && (
        <View className="absolute bottom-5 left-4 right-4 bg-[#100E0F] border border-[#1F1B1D] rounded-lg py-1 px-3 shadow-lg">
          <View className="flex-row items-center justify-between p-5">
            <View className="flex-1">
              <Text className="text-white font-InterSemiBold text-base mb-1">Trades clased successfully</Text>
              <Text className="text-gray-300 font-InterRegular text-base">
                All loss trades closed
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4 p-2"
              onPress={() => setShowCloseLossesAlert(false)}
            >
              {/* <Text className="text-gray-400 text-lg">✕</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showCloseAllAlert && (
        <View className="absolute bottom-5 left-4 right-4 bg-[#100E0F] border border-[#1F1B1D] rounded-lg py-1 px-3 shadow-lg">
          <View className="flex-row items-center justify-between p-5">
            <View className="flex-1">
              <Text className="text-white font-InterSemiBold text-base mb-1">Trades closed successfully</Text>
              <Text className="text-gray-300 font-InterRegular text-base">
                All trades closed
              </Text>
            </View>
            <TouchableOpacity
              className="ml-4 p-2"
              onPress={() => setShowCloseAllAlert(false)}
            >
              {/* <Text className="text-gray-400 text-lg">✕</Text> */}
            </TouchableOpacity>
          </View>
        </View>
      )}

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