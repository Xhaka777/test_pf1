import React, { useCallback, useRef, useMemo, useEffect, useState } from "react";
import Header from "@/components/Header/header";
import { useAccounts, useBrokerAccounts } from "@/hooks";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ChevronDown, ChevronsUpDown, ChevronUp, Edit, Pencil, X } from "lucide-react-native";
import images from "@/constants/images";
import BottomSheet from "@gorhom/bottom-sheet";
import EditPositionBottomSheet from "@/components/EditPositionBottomSheet";
import ClosePositionBottomSheet from "@/components/ClosePositionBottomSheet";
import PositionCard from "@/components/positions/PositionCard";
import OrderCard from "@/components/positions/OrderCard";
import { tags } from "react-native-svg/lib/typescript/xmlTags";
import HistoryCard from "@/components/positions/HistoryCard";
import ScreenShotBottomSheet from "@/components/ScreenShotBottomsheet";

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


const Positions = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showSyncAlert, setShowSyncAlert] = useState(false);
  const [showCloseProfitsAlert, setShowCloseProfitsAlert] = useState(false);
  const [showCloseLossesAlert, setShowCloseLossesAlert] = useState(false);
  const [showCloseAllAlert, setShowCloseAllAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string>('');

  const editBottomSheetRef = useRef<BottomSheet>(null);
  const closeBottomSheetRef = useRef<BottomSheet>(null);
  const screenShotBottomSheetRef = useRef<BottomSheet>(null);


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

  const openEditModal = (position: Position) => {
    setSelectedPosition(position);
    editBottomSheetRef.current?.snapToIndex(1);
  };

  const openCloseModal = (position: Position) => {
    setSelectedPosition(position);
    closeBottomSheetRef.current?.snapToIndex(1);
  };

  const openScreenShotModal = (position: Position) => {
    setSelectedPosition(position);
    screenShotBottomSheetRef.current?.snapToIndex(1);
  }

  const closeEditModal = () => {
    setSelectedPosition(null);
    editBottomSheetRef.current?.close();
  };

  const closeCloseModal = () => {
    setSelectedPosition(null);
    closeBottomSheetRef.current?.close();
  };

  const closeScreenShotModal = () => {
    setSelectedPosition(null);
    screenShotBottomSheetRef.current?.close();
  }

  const handleSavePosition = (formData: any) => {
    // Handle save logic here
    console.log('Saving position changes:', formData);
    console.log('For position:', selectedPosition);
    closeEditModal();
  };

  const handleClosePosition = (percentage: number, customAmount?: string) => {
    // Handle close position logic here
    console.log('Closing position:', selectedPosition);
    console.log('Percentage:', percentage);
    console.log('Custom amount:', customAmount);
    closeCloseModal();
  };

  //Sync Trades handler
  const handleSyncTrades = () => {
    setIsLoading(true);
    setLoadingAction('syncing');
    // Simulate API call
    // setShowSyncAlert(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoadingAction('');
      setShowSyncAlert(true);
      // Auto hide after 5 seconds
      setTimeout(() => {
        setShowSyncAlert(false);
      }, 5000);
      // Reset expanded positions
    }, 3000);
  }

  const handleCloseProfits = () => {
    setIsLoading(true);
    setLoadingAction('syncing');
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLoadingAction('');
      setShowCloseProfitsAlert(true);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowCloseProfitsAlert(false);
      }, 3000);
    }, 2000);
  };

  const handleCloseLosses = () => {
    setIsLoading(true);
    setLoadingAction('syncing');
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLoadingAction('');
      setShowCloseLossesAlert(true);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowCloseLossesAlert(false);
      }, 3000);
    }, 2000)
    // Auto hide after 3 seconds
  };

  const handleCloseAll = () => {
    setIsLoading(true);
    setLoadingAction('syncing');
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setLoadingAction('');
      setShowCloseAllAlert(true);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowCloseAllAlert(false);
      }, 3000);
    }, 2000);
  };


  const toggleExpansion = (positionId: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(positionId)) {
        newSet.delete(positionId);
      } else {
        newSet.add(positionId);
      }
      return newSet;
    });
  };

  const renderTabs = () => (
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
  );

  const renderActionButtons = () => (
    <View className="flex-row px-1 py-1 mt-1 bg-[#100E0F]">
      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-green-500"
        onPress={handleSyncTrades}
      >
        <Text className="text-success-400 text-center text-sm font-InterSemiBold">Sync Trades</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-green-500"
        onPress={handleCloseProfits}
      >
        <Text className="text-success-400 text-center text-sm font-InterSemiBold">Close Profits</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-red-500"
        onPress={handleCloseLosses}
      >
        <Text className="text-danger-500 text-center text-sm font-InterSemiBold">Close Losses</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 py-1 px-1 mr-1 rounded-md border border-red-500"
        onPress={handleCloseAll}
      >
        <Text className="text-danger-500 text-center text-sm font-InterSemiBold">Close All</Text>
      </TouchableOpacity>
    </View>

  );


  const renderContent = () => {
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
  };

  return (
    <SafeAreaView className="flex-1 bg-[#100E0F]">
      <Header />
      {renderTabs()}
      {activeTab === 'positions' && renderActionButtons()}
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
        history={selectedPosition}
        onClose={closeScreenShotModal}
        onScreenShot={(history) => {
          console.log('Taking screenshot for history:', history);
          closeScreenShotModal();
        }
        }
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
            {/* Animated Loader */}
            <View className="relative mb-4">
              <ActivityIndicator size="large" color="#8B5CF6" />
              <View className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-30 animate-pulse" />
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};



export default Positions