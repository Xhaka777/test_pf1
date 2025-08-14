import React from 'react';
import { View, Text } from 'react-native';
import { Loader, TrendingUp } from 'lucide-react-native';
import { useAccountDetails } from '@/providers/account-details';
import { useAccounts } from '@/providers/accounts';
import { useActiveSymbol } from '@/hooks/use-active-symbol';
import { useUser } from '@clerk/clerk-expo';
import TradingViewChart from '@/components/TradingViewChart';
import { ChartTradingDialogProvider } from './ChartTradingDialogProvider';

export function TradingChartWrapper() {
  const { accountDetails } = useAccountDetails();
  const { selectedAccountId } = useAccounts();
  const [activeSymbol] = useActiveSymbol();
  const details = useUser();

  if (!details.isLoaded || !details.user) {
    return null;
  }

  if (
    !selectedAccountId ||
    !activeSymbol ||
    !accountDetails ||
    !details.isLoaded ||
    !details.user
  ) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0f0f0f] gap-3">
        <TrendingUp size={32} color="#00d4aa" />
        <Text className="text-base text-gray-400 font-medium">Loading chart...</Text>
      </View>
    );
  }

  return (
    <ChartTradingDialogProvider>
      <TradingViewChart
        symbol={activeSymbol}
        selectedAccountId={selectedAccountId}
        accountDetails={accountDetails}
        userId={`${details.user.id}`}
      />
    </ChartTradingDialogProvider>
  );
}