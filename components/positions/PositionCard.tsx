import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronUp, Pencil, X } from 'lucide-react-native';
import images from '@/constants/images';
import { getCurrencyFlags, CurrencyCodeEnum } from '@/api/utils/currency-trade';

interface Position {
  id?: string;
  order_id: string;
  symbol: string;
  position_type: 'LONG' | 'SHORT';
  quantity: number;
  pl: number;
  entry: number;
  fees: number;
  tp?: number | null;
  sl?: number | null;
  roi: number;
  open_time: string;
}

interface PositionCardProps {
  position: Position;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onEdit: (position: Position) => void;
  onClose: (position: Position) => void;
}

const getCurrencyFlagImage = (currency: CurrencyCodeEnum) => {
  //
  const flagMap = {
    [CurrencyCodeEnum.USD]: images.usa_png,
    [CurrencyCodeEnum.EUR]: images.eur_png,
    [CurrencyCodeEnum.GBP]: images.gbp_png,
    [CurrencyCodeEnum.JPY]: images.jpy_png,
    [CurrencyCodeEnum.AUD]: images.aud_png,
    [CurrencyCodeEnum.CAD]: images.cad_png,
    [CurrencyCodeEnum.CHF]: images.chf_png,
    [CurrencyCodeEnum.NZD]: images.nzd_png,
    [CurrencyCodeEnum.BTC]: images.btc_png,
    [CurrencyCodeEnum.USDT]: images.usdt_png,
    [CurrencyCodeEnum.UKNOWN]: images.usa_png,
  }
  return flagMap[currency] || images.usa_png;
}

const DirectionValue: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  colorized?: boolean;
  decimals?: number;
}> = ({ value, prefix = '', suffix = '', colorized = false, decimals = 2 }) => {
  const isPositive = value >= 0;
  const colorClass = colorized
    ? (isPositive ? 'text-success-main' : 'text-red-500')
    : 'text-white';

  return (
    <Text className={`font-InterRegular ${colorClass}`}>
      {prefix}{value.toFixed(decimals)} {suffix}
    </Text>
  )
}

const PositionTypeValue: React.FC<{ type: 'LONG' | 'SHORT' }> = ({ type }) => {
  const colorClass = type === 'LONG' ? 'text-success-main' : 'text-red-500';
  return (
    <Text className={`font-InterRegular ${colorClass}`}>
      {type}
    </Text>
  )
}

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return dateString;
  }
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  isExpanded,
  onToggleExpansion,
  onEdit,
  onClose
}) => {
  //
  const positionId = position.order_id || position.id || '';
  const isProfitable = position.pl > 0;

  const { from, to } = getCurrencyFlags(position.symbol);
  //
  const fromFlagImage = getCurrencyFlagImage(from);
  const toFlagImage = getCurrencyFlagImage(to);

  const handleToggleExpansion = () => {
    onToggleExpansion(positionId);
  }

  const handleEdit = () => {
    setTimeout(() => {
      onEdit(position);
    }, 100);
  }

  const handleClose = () => {
    setTimeout(() => {
      onClose(position);
    }, 100);
  }

  return (
    <View className="bg-propfirmone-300 rounded-md m-2 shadow-lg">
      {/* Main Position Row */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-4"
        onPress={handleToggleExpansion}
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            {/* Dynamic flag display using actual currency flags */}
            <View style={{ flexDirection: 'row' }}>
              <Image
                source={fromFlagImage}
                style={{ width: 18, height: 18 }}
              />
              <Image
                source={toFlagImage}
                style={{ width: 18, height: 18, marginLeft: -6 }}
              />
            </View>
            <Text className="text-white font-InterSemiBold text-base ml-2">
              {position.symbol}
            </Text>
          </View>

          {/* Bottom row - Position Type and Size with enhanced formatting */}
          <View className="flex-row items-center">
            <PositionTypeValue type={position.position_type} />
            <Text className="text-gray-400 font-InterRegular mx-1">/</Text>
            <Text className="text-white font-InterRegular">{position.quantity}</Text>
            <Text className="text-gray-400 font-InterRegular ml-1">Size</Text>
          </View>
        </View>

        {/* Right side - P/L and Actions */}
        <View className="items-end">
          <View className="flex-row items-center mb-2">
            <DirectionValue
              value={position.pl}
              prefix="$"
              colorized
              decimals={2}
            />
            <Text className="text-gray-400 font-InterRegular ml-1 text-xs">P/L</Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              className="w-8 h-8 border border-gray-800 rounded-lg items-center justify-center mr-1"
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Pencil size={12} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-8 h-8 border border-gray-700 rounded-lg items-center justify-center mr-1"
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={12} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-8 h-8 rounded items-center justify-center"
              onPress={handleToggleExpansion}
              activeOpacity={0.7}
            >
              {isExpanded ?
                <ChevronUp size={16} color="white" /> :
                <ChevronDown size={16} color="white" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Enhanced Expanded Details with better formatting */}
      {isExpanded && (
        <View className="px-4 pb-4 bg-gray-850 border-t border-gray-700">
          <View className="mt-3 space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">Entry:</Text>
              <DirectionValue
                value={position.entry}
                prefix="$"
                decimals={2}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">Fees:</Text>
              <DirectionValue
                value={position.fees}
                prefix="$"
                colorized
                decimals={2}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">TP:</Text>
              <Text className="text-white font-InterMedium text-sm">
                {position.tp ? position.tp.toFixed(2) : (
                  <Text className="text-gray-400">-</Text>
                )}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">SL:</Text>
              <Text className="text-white font-InterMedium text-sm">
                {position.sl ? position.sl.toFixed(2) : (
                  <Text className="text-gray-400">-</Text>
                )}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">ROI:</Text>
              <DirectionValue
                value={position.roi}
                suffix="%"
                colorized
                decimals={2}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 font-InterMedium text-sm">Open (GMT):</Text>
              <Text className="text-white font-InterMedium text-sm">
                {formatDateTime(position.open_time)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PositionCard;
