import { Text, View } from 'react-native';

interface AvgWinLossBarProps {
  avgWin: number;
  avgLoss: number;
}

export function AvgWinLossBar({ avgWin, avgLoss }: AvgWinLossBarProps) {
  const total = avgWin + Math.abs(avgLoss);
  const winWidth = (avgWin / total) * 100;
  const lossWidth = (Math.abs(avgLoss) / total) * 100;

  return (
    <View className="space-y-2">
      <View className="flex-row items-center">
        <View className="flex-row w-full h-2 overflow-hidden bg-muted rounded space-x-1">
          {avgWin > 0 && (
            <View
              className="bg-green-theme h-full"
              style={{ width: `${winWidth}%` }}
            />
          )}
          {avgLoss < 0 && (
            <View
              className="bg-red-theme h-full"
              style={{ width: `${lossWidth}%` }}
            />
          )}
        </View>
      </View>

      <View className="flex-row justify-between">
        <Text className="text-xs text-green-theme">
          {avgWin.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          })}
        </Text>
        <Text className="text-xs text-red-theme">
          {avgLoss.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>
    </View>
  );
}
