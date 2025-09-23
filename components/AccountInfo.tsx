import { AccountDetails } from "@/api/schema";
import { Metrics } from "@/api/schema/metrics";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { AccountStatusEnum, AccountTypeEnum, ExchangeTypeEnum } from "@/shared/enums";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { DirectionValue } from "./DirectionValue";
import { InfoRow } from "./InfoRow";
import { AccountStatus } from "./AccountStatus";
import ProfitLossIndicator from "./ProfitLossIndicator";

export function AccountInfo({
    accountDetails,
    metricsData,
}: {
    accountDetails: AccountDetails | undefined;
    metricsData: Metrics | undefined;
}) {
    const { data: openTrades } = useOpenPositionsWS();

    const openProfitLoss = useMemo(() => {
        if (!openTrades) {
            return 0;
        }

        return openTrades.open_trades.reduce((acc, trade) => {
            return acc + trade.pl;
        }, 0);
    }, [openTrades]);

    const maxLoss = useMemo(() => {
        if (!accountDetails || !metricsData) {
            return 0;
        }

        const equity = accountDetails?.balance + openProfitLoss;
        if (equity >= metricsData?.starting_balance) {
            return 0;
        } else {
            return equity - metricsData?.starting_balance;
        }
    }, [accountDetails, metricsData, openProfitLoss]);

    const maxTotalLoss = useMemo(() => {
        if (!metricsData?.max_total_dd || !metricsData?.starting_balance) {
            return 0;
        }
        return metricsData?.max_total_dd > 0
            ? (metricsData?.max_total_dd / 100) * metricsData?.starting_balance
            : 0;
    }, [metricsData?.max_total_dd, metricsData?.starting_balance]);

    const accountLeverage = useMemo(() => {
        if (!accountDetails) {
            return 0;
        }

        return [
            ExchangeTypeEnum.MT5,
            ExchangeTypeEnum.DXTrade,
            ExchangeTypeEnum.CTrader,
        ].includes(accountDetails.exchange)
            ? accountDetails.leverage['EURUSD']
            : accountDetails.leverage['BTCUSDT'];
    }, [accountDetails]);

    const dailyLoss = useMemo(() => {
        if (!metricsData) {
            return 0;
        }

        const starting_day_balance =
            metricsData.starting_balance - metricsData.daily_pl;
        return metricsData.daily_pl > 0
            ? 0
            : (metricsData.daily_pl / starting_day_balance) * 100;
    }, [metricsData]);

    const maxDailyLoss = useMemo(() => {
        if (!accountDetails || !metricsData) {
            return 0;
        }

        const maxDailyLossInUnits =
            (accountDetails.max_daily_loss / 100) * metricsData.starting_balance;
        return maxDailyLossInUnits.toFixed(2);
    }, [accountDetails, metricsData]);

    const targetInUnits = useMemo(() => {
        if (!metricsData) {
            return 0;
        }
        return (
            ((metricsData.profit_target > 0 ? metricsData.profit_target : 15) / 100) *
            metricsData.starting_balance
        );
    }, [metricsData]);

    const profitTargetInUnits = useMemo(() => {
        if (!metricsData) {
            return 0;
        }

        return (
            ((metricsData?.profit_target > 0 ? metricsData?.profit_target : 15) /
                100) *
            metricsData?.starting_balance
        );
    }, [metricsData]);

    const maxDrawdownInUnits = useMemo(() => {
        if (!metricsData) {
            return 0;
        }

        return (metricsData?.max_total_dd / 100) * metricsData?.starting_balance;
    }, [metricsData]);

    const netPlInUnits = useMemo(() => {
        if (!metricsData) {
            return 0;
        }

        let result = (metricsData?.net_pl / 100) * metricsData?.starting_balance;

        if (result === 0) {
            return result;
        }

        if (result > 0) {
            result = Math.min(result, profitTargetInUnits);
        } else {
            result = Math.max(result, -maxDrawdownInUnits);
        }
        return result;
    }, [maxDrawdownInUnits, metricsData, profitTargetInUnits]);

    // Add debugging - remove this in production
    console.log('AccountInfo - accountDetails:', accountDetails);
    console.log('AccountInfo - metricsData:', metricsData);

    // Early return if no data
    if (!accountDetails || !metricsData) {
        return (
            <View className="mt-2 p-4">
                <Text className="text-gray-400 text-sm font-Inter">Loading account information...</Text>
            </View>
        );
    }

    return (
        <View className="mt-2 px-2">
            <View className="flex justify-between flex-wrap p-1">
                {/* Balance & Equity Section */}
                <View className="space-y-3 mb-2">
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm mb-1 font-Inter">Balance:</Text>
                        <DirectionValue
                            value={Number(accountDetails.balance.toFixed(2))}
                            prefix="$"
                        />
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm mb-1 font-Inter">Equity:</Text>
                        <DirectionValue
                            value={Number((accountDetails.balance + openProfitLoss).toFixed(2))}
                            prefix="$"
                        />
                    </View>
                </View>

                <View className="w-full h-[1px] bg-[#2F2C2D]" />

                {/* Program & Trading Days Section */}
                <View className="space-y-3 mt-2">
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm mb-1 font-Inter">Program:</Text>
                        <Text className="text-white text-sm font-Inter">1 Step</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm mb-1 font-Inter">Trading Days:</Text>
                        <View className="flex-row">
                            <Text className="text-white text-base font-Inter">{metricsData.trading_days}&nbsp;</Text>
                            {metricsData.min_trading_days > 0 && (
                                <Text className="text-gray-400 text-sm font-Inter">
                                    / {metricsData.min_trading_days}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Status Section */}
                <View className="space-y-3">
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-400 text-sm mb-1 font-Inter">Status:</Text>
                        <AccountStatus
                            isActive={accountDetails.account_status === AccountStatusEnum.ACTIVE}
                        />
                    </View>
                </View>

                <View className="w-full h-[1px] bg-[#2F2C2D]" />

                {/* Leverage Section */}

                {/* Loss & Profit Metrics */}
                <View className="space-y-3">
                    <View className="space-y-3 mt-2">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 text-sm mb-1 font-Inter">Leverage:</Text>
                            <Text className="text-white text-sm font-Inter">{accountLeverage ?? 1}X</Text>
                        </View>
                    </View>
                    {/* Daily Loss */}
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm font-Inter">Daily Loss:</Text>
                        <View className="flex-row">
                            <DirectionValue value={dailyLoss} prefix="$" colorized />
                            {accountDetails.max_daily_loss > 0 && (
                                <DirectionValue value={maxDailyLoss} prefix="/ -$" />
                            )}
                        </View>
                    </View>

                    {/* Max Loss */}
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm font-Inter">Max Loss:</Text>
                        <View className="flex-row">
                            <DirectionValue
                                value={maxLoss.toFixed(2)}
                                prefix="$"
                                colorized
                            />
                            {metricsData.max_total_dd > 0 && (
                                <DirectionValue value={maxTotalLoss} prefix="/ -$" />
                            )}
                        </View>
                    </View>

                    {/* Profit Target */}
                    <View className="flex-row justify-between">
                        <Text className="text-gray-400 text-sm font-Inter">Profit Target:</Text>
                        <View className="flex-row items-center">
                            <DirectionValue value={netPlInUnits} prefix="$" colorized />
                            {metricsData.profit_target > 0 ? (
                                <DirectionValue value={targetInUnits} prefix=" / $" />
                            ) : accountDetails.account_type === AccountTypeEnum.COMPETITION ? (
                                <>
                                    <Text className="text-gray-400">/</Text>
                                    <Text className="text-green-500 text-sm">&nbsp;∞</Text>
                                </>
                            ) : null}
                        </View>
                    </View>

                    {/* Trading Days (duplicate - you might want to remove this) */}
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-gray-400 text-sm font-Inter">Trading Days:</Text>
                        <View className="flex-row">
                            <Text className="text-white text-sm font-Inter">{metricsData.trading_days}&nbsp;</Text>
                            {metricsData.min_trading_days > 0 && (
                                <Text className="text-gray-400 text-sm font-Inter">
                                    / {metricsData.min_trading_days}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <View className="w-full h-[1px] bg-[#2F2C2D]" />

                {/* Progress Section */}
                <View className="flex-row items-center justify-between rounded-lg mt-2">
                    <View className="flex-1 bg-propfirmone-300 py-3 px-2 rounded-lg justify-center">
                        <Text className="text-gray-400 text-xs ml-1 font-Inter">Progress:</Text>
                        <ProfitLossIndicator
                            value={netPlInUnits}
                            minimumLimit={-maxDrawdownInUnits}
                            maximumLimit={profitTargetInUnits}
                            showLabels={false}
                            isCompetition={accountDetails.account_type === AccountTypeEnum.COMPETITION}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}