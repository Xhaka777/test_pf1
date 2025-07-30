import { DashboardAccountType } from "@/app/(tabs)/account";
import { AccountTypeEnum } from "@/shared/enums";
import { useMemo } from "react";
import { Text, View } from "react-native";
import MetricCard from "./MetricCard";
import { DirectionValue } from "./DirectionValue";


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

    return (
        <View className="flex flex-col gap-2 p-1">
            <View className="flex-row flex-wrap gap-2">
                {dashboardAccountType === DashboardAccountType.PROP_FIRM && (
                    <>
                        <MetricCard>
                            <View className="flex items-center justify-center rounded-lg bg-card p-2">
                                <View className="w-full">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-[10px] text-foreground-tertiary font-normal">
                                            {t('Daily Loss')}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <DirectionValue
                                                className="text-[10px]"
                                                value={dailyPL < 0 ? dailyPL : 0}
                                                prefix="$"
                                                colorized
                                            />
                                            {maxDailyLoss > 0 && (
                                                <DirectionValue
                                                    className="text-[10px] text-white"
                                                    value={maxDailyLoss}
                                                    prefix="/ -$"
                                                />
                                            )}
                                        </View>
                                    </View>

                                    <DailyLossBar
                                        showMinimumLimit
                                        value={convertedDailyLoss}
                                        minimumLimit={-maxDailyDd}
                                        maximumLimit={0}
                                        valueLabel=""
                                        valuePosition={ValuePositionEnum.Bottom}
                                    />
                                </View>
                            </View>
                        </MetricCard>

                        <MetricCard>
                            <View className="flex items-center rounded-lg p-2">
                                <View className="w-full">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-[10px] text-foreground-tertiary">
                                            {t('Max Drawdown')}
                                        </Text>
                                        <Text className="text-[10px] text-foreground-tertiary">
                                            {t('Profit Target')}
                                        </Text>
                                    </View>


                                    {/* instead of the MaxDrawdownBar we need to call the ProfitLossIndicator   */}
                                    <MaxDrawdownBar
                                        showMinimumLimit
                                        value={netPlInUnits}
                                        minimumLimit={-maxDrawdownInUnits}
                                        maximumLimit={profitTargetInUnits}
                                        valueLabel=""
                                        positiveValueLabel={
                                            accountType === AccountTypeEnum.COMPETITION ? '∞' : null
                                        }
                                        valuePosition={ValuePositionEnum.Bottom}
                                    />
                                </View>
                            </View>
                        </MetricCard>
                    </>
                )}

                {dashboardAccountType === DashboardAccountType.OWN_BROKER && (
                    <>
                        <MetricCard title={t('Avg Win/Loss')}>
                        {/* here instead of AvgWinLossBar I need to call the WinLossStats component... */}
                            <AvgWinLossBar avgLoss={averageLoss} avgWin={averageProfit} />
                        </MetricCard>

                        <MetricCard
                            title={t('Win Rate')}
                            value={winRate}
                            valueSuffix="%"
                            colorize
                        />
                    </>
                )}
            </View>

            <View className="flex-row space-x-2">
                <MetricCard
                    title={t('Daily P/L')}
                    value={dailyPL}
                    valuePrefix="$"
                    colorize
                />
                <MetricCard
                    title={t('Total P/L')}
                    value={totalPL}
                    valuePrefix="$"
                    colorize
                />
            </View>
        </View>
    );
}