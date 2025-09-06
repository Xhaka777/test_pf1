import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AccountBalanceCardProps {
  accountType: string;
  accounts: any[]; // Array of accounts for the selected type
  totalPL: number;
  totalPLPercentage: number;
  dailyPL: number;
  dailyPLPercentage: number;
}

const AccountBalanceCard = ({
  accountType,
  accounts = [],
  totalPL = 0,
  totalPLPercentage = 0,
  dailyPL = 0,
  dailyPLPercentage = 0,
}: AccountBalanceCardProps) => {

  // Calculate total balance dynamically from all accounts of this type
  const totalBalance = useMemo(() => {
    if (!accounts || accounts.length === 0) return 0;

    return accounts.reduce((sum, account) => {
      // Handle different account data structures
      const balance = account.balance || account.starting_balance || account.startingBalance || 0;
      return sum + balance;
    }, 0);
  }, [accounts]);

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
          padding: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          elevation: 3,
        }}
      >
        {/* Inner container with dark background */}
        <View className="bg-gray-800 rounded-lg p-3">
          {/* Title */}
          <Text className="text-gray-400 text-sm font-Inter mb-2">
            Total {getFormattedAccountType(accountType)} Balance
          </Text>

          {/* Balance Amount - Now showing total from all accounts */}
          <Text className="text-white text-2xl font-InterBold mb-6">
            ${formatCurrency(totalBalance)}
          </Text>

          {/* Bottom Row - Total P/L and Daily P/L */}
          <View className="flex-row justify-between items-start">
            {/* Total P/L Section */}
            <View className="flex-1">
              <Text className="text-gray-400 text-sm font-Inter mb-1">
                Total P&L
              </Text>
              <Text className={`text-base font-InterSemiBold ${
                totalPL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {totalPL >= 0 ? '' : '-'}${Math.abs(totalPL).toLocaleString()}
              </Text>
            </View>

            {/* Vertical Separator */}
            <View className="w-px h-11 bg-gray-600 mx-5" />

            {/* Daily P/L Section */}
            <View className="flex-1 items-start">
              <Text className="text-gray-400 text-sm font-Inter mb-1">
                Daily P&L
              </Text>
              <Text className={`text-base font-InterSemiBold ${
                dailyPLPercentage >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
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