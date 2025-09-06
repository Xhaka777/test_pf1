import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AccountBalanceCardProps {
  accountType: string;
  balance: number;
  totalPL: number;
  totalPLPercentage: number;
  dailyPL: number;
  dailyPLPercentage: number;
}

const AccountBalanceCard = ({
  accountType,
  balance = 0,
  totalPL = 0,
  totalPLPercentage = 0,
  dailyPL = 0,
  dailyPLPercentage = 0,
}: AccountBalanceCardProps) => {

  // Format account type for display
  const getFormattedAccountType = (type: string) => {
    switch (type) {
      case 'evaluation':
        return 'Evaluation';
      case 'funded':
        return 'Funded';
      case 'live':
        return 'Live';
      case 'demo':
        return 'Demo';
      default:
        return 'Evaluation';
    }
  };

  const formatCurrency = (value: number) => {
    return `${Math.abs(value).toLocaleString()}`;
  };

  // Format percentage values
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };


  return (
    <View className="px-2 mt-2">
      <LinearGradient
        colors={['#9061F9', '#7EDCE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 8,
          padding: 1.3, // Slightly thicker for better gradient border visibility
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          elevation: 3,
        }}
      >
        {/* Inner container with dark background */}
        <View
          style={{
            backgroundColor: '#1E1E2E', // Dark background
            borderRadius: 8, // Slightly smaller to show gradient border
            padding: 10,
          }}
        >
          {/* Title */}
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 13,
              fontWeight: '400',
              marginBottom: 8,
            }}
          >
            Total {getFormattedAccountType(accountType)} Balance
          </Text>

          {/* Balance Amount */}
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 26,
              fontWeight: 'bold',
              marginBottom: 24,
            }}
          >
            {formatCurrency(balance)}
          </Text>

          {/* Bottom Row - Total P/L and Daily P/L */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {/* Total P/L Section */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '400',
                  marginBottom: 4,
                }}
              >
                Total P&L
              </Text>
              <Text
                style={{
                  color: (totalPL ?? '').toString().startsWith('-') ? '#EF4444' : '#10B981',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {totalPL >= 0 ? '' : '-'}${Math.abs(totalPL).toLocaleString()}
              </Text>

            </View>

            {/* Vertical Separator */}
            <View
              style={{
                width: 1,
                height: 44, // Height to match the content height
                backgroundColor: '#4B5563', // Gray color
                marginHorizontal: 20,
              }}
            />

            {/* Daily P/L Section */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '400',
                  marginBottom: 4,
                }}
              >
                Daily P&L
              </Text>
              <Text
                style={{
                  color: dailyPLPercentage < 0 ? '#EF4444' : '#10B981',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {formatPercentage(dailyPLPercentage)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default AccountBalanceCard;