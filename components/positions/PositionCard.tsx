import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react-native';
import images from '@/constants/images';

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

interface PositionCardProps {
  position: Position;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onEdit: (position: Position) => void;
  onClose: (position: Position) => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  isExpanded,
  onToggleExpansion,
  onEdit,
  onClose
}) => {
  const isProfitable = position.pnl > 0;

  return (
    <View className="bg-propfirmone-300 rounded-md m-2 shadow-lg">
      {/* Main Position Row */}
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={images.usa_png}
                style={{ width: 18, height: 18 }}
              />
              <Image
                source={images.usa_png}
                style={{ width: 18, height: 18, marginLeft: -6 }}
              />
            </View>
            <Text className="text-white font-InterSemiBold text-base">{position.symbol}</Text>
          </View>

          {/* Bottom row - Position Type and Size */}
          <View className="flex-row items-center">
            <Text className={`font-InterRegular text-base mr-2 ${position.type === 'LONG' ? 'text-success-main' : 'text-red-500'}`}>
              {position.type}
            </Text>
            <Text className="text-gray-400 font-InterRegular">/ {position.size.toFixed(2)} Size</Text>
          </View>
        </View>

        {/* Right side - P/L and Actions */}
        <View className="items-end">
          <Text className={`font-InterSemiBold text-base mb-2 ${isProfitable ? 'text-success-main' : 'text-red-500'}`}>
            ${position.pnl.toFixed(2)} P/L
          </Text>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="w-8 h-8 border border-gray-800 rounded-lg items-center justify-center mr-1"
              onPress={() => onEdit(position)}
            >
              <Pencil size={12} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center"
              onPress={() => onClose(position)}
            >
              <X size={12} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-8 h-8 rounded items-center justify-center"
              onPress={() => onToggleExpansion(position.id)}
            >
              {isExpanded ? 
                <ChevronDown size={12} color="white" /> : 
                <ChevronUp size={12} color="white" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <View className="px-4 pb-4 bg-gray-850">
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">Entry:</Text>
              <Text className="text-white font-InterMedium text-sm">{position.entry.toFixed(2)}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">Fees:</Text>
              <Text className="text-white font-InterMedium text-sm">${position.fees.toFixed(2)}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
              <Text className="text-white font-InterMedium text-sm">{position.tp ? position.tp.toFixed(2) : '-'}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
              <Text className="text-white font-InterMedium text-sm">{position.sl ? position.sl.toFixed(2) : '-'}</Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">ROI:</Text>
              <Text className={`font-InterMedium text-sm ${position.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {position.roi.toFixed(2)}%
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400 font-InterMedium text-sm">Open (GMT):</Text>
              <Text className="text-white font-InterMedium text-sm">{position.openTime}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PositionCard;