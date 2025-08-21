import { DashboardAccountType } from "@/app/(tabs)/account";
import { AccountTypeEnum } from "@/shared/enums";
import { useMemo } from "react";
import { Text, View } from "react-native";
import MetricCard from "./MetricCard";
import { DirectionValue } from "./DirectionValue";
import ProfitLossIndicator from "./ProfitLossIndicator";
import { WinLossStats } from "./overview/WinLossStats";

// Add translation function - replace with your actual implementation
const t = (key: string) => key;

interface AccountMetricsProps {
    maxDrawdown: number;
    profitTarget: number;
    dailyPL: number;
    totalPL: number;
    netPl: number;
    accountMaxDailyLoss: number;
    dashboardAccountType: DashboardAccountType | null;
    winRate: number;
    averageProfit: number;
    averageLoss: number;
    dailyLoss: number;
    maxDailyLoss: number;
    maxDailyDd: number;
    totalDd: number;
    startingBalance: number;
    accountType: AccountTypeEnum | undefined;
}

export function AccountMetrics({
    maxDrawdown,
    profitTarget,
    dailyPL,
    totalPL,
    netPl,
    dashboardAccountType,
    winRate,
    averageProfit,
    averageLoss,
    maxDailyLoss,
    maxDailyDd,
    startingBalance,
    accountType,
}: AccountMetricsProps) {

    const maxDrawdownInUnits = useMemo(() => {
        return (maxDrawdown / 100) * startingBalance;
    }, [maxDrawdown, startingBalance]);

    const profitTargetInUnits = useMemo(() => {
        return ((profitTarget > 0 ? profitTarget : 15) / 100) * startingBalance;
    }, [profitTarget, startingBalance]);

    const netPlInUnits = useMemo(() => {
        let result = (netPl / 100) * startingBalance;

        if (result === 0) {
            return result;
        }

        if (result > 0) {
            result = Math.min(result, profitTargetInUnits);
        } else {
            result = Math.max(result, -maxDrawdownInUnits);
        }
        return result;
    }, [maxDrawdownInUnits, netPl, profitTargetInUnits, startingBalance]);

    const convertedDailyLoss = useMemo(() => {
        const dailyLoss =
            ((dailyPL < 0 ? dailyPL : 0) / Number(maxDailyLoss)) * 100 * -1;

        return dailyLoss <= 100 ? dailyLoss : 100;
    }, [dailyPL, maxDailyLoss]);

    // Calculate win/loss percentages for the bar
    const lossRate = useMemo(() => {
        return 100 - winRate;
    }, [winRate]);

    return (
        <View className="flex flex-col">
            {/* Full Width Avg Win/Loss Bar */}
            <WinLossStats
                winPercentage={winRate}
                lossPercentage={lossRate}
                winAmount={Math.abs(averageProfit)}
                lossAmount={Math.abs(averageLoss)}
            />

            {/* Row of Cards Below */}
            <View className="flex-row gap-2 px-2 mt-2">
                {/* Daily Loss Card */}
                <View className="flex-1">
                    <View className="bg-propfirmone-300 rounded-lg p-2">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-400 text-sm font-InterMedium">
                                {t('Daily Loss')}
                            </Text>
                            <View className="flex-row items-center">
                                <Text className="text-red-500 text-xs font-InterMedium">
                                    -5%
                                </Text>
                                <Text className="text-gray-400 text-xs font-InterMedium ml-1">
                                    0%
                                </Text>
                            </View>
                        </View>

                        <ProfitLossIndicator
                            companyName=""
                            totalValue={startingBalance}
                            percentageChange={convertedDailyLoss}
                            dailyPL={dailyPL}
                            startingBalance={startingBalance}
                            showLabels={false}
                        />
                    </View>
                </View>

                {/* Max Drawdown Card */}
                <View className="flex-1">
                    <View className="bg-propfirmone-300 rounded-lg p-2">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-400 text-sm font-InterMedium">
                                {t('Max Drawdown')}
                            </Text>
                            <View className="flex-row items-center">
                                <Text className="text-red-500 text-xs font-InterMedium">
                                    -${Math.abs(netPlInUnits).toLocaleString()}
                                </Text>
                                <Text className="text-green-500 text-xs font-InterMedium ml-1">
                                    ${profitTargetInUnits.toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <ProfitLossIndicator
                            companyName=""
                            totalValue={startingBalance}
                            percentageChange={Math.abs(netPl)}
                            dailyPL={netPlInUnits}
                            startingBalance={startingBalance}
                            showLabels={false}
                        />
                    </View>
                </View>
            </View>

            {/* Daily P/L and Total P/L Row */}
            <View className="flex-row gap-2 mt-2 px-2">
                <View className="flex-1">
                    <View className="bg-propfirmone-300 rounded-lg p-2">
                        <Text className="text-gray-400 text-sm font-InterMedium mb-1">
                            {t('Daily P/L')}
                        </Text>
                        <Text className={`text-sm font-InterBold ${dailyPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {dailyPL >= 0 ? '' : '-'}${Math.abs(dailyPL).toLocaleString()}
                        </Text>
                    </View>
                </View>
                <View className="flex-1">
                    <View className="bg-propfirmone-300 rounded-lg p-2">
                        <Text className="text-gray-400 text-sm font-InterMedium mb-1">
                            {t('Total P/L')}
                        </Text>
                        <Text className={`text-sm font-InterBold ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {totalPL >= 0 ? '' : '-'}${Math.abs(totalPL).toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}