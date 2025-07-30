import { AccountDetails } from "@/api/schema";
import { Metrics } from "@/api/schema/metrics";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { AccountStatusEnum, AccountTypeEnum, ExchangeTypeEnum } from "@/shared/enums";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { DirectionValue } from "./DirectionValue";
import { InfoRow } from "./InfoRow";
import { AccountStatus } from "./AccountStatus";


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


    return (
        <View className="mt-2">
            <View className="flex flex-row flex-wrap justify-between p-1 gap-y-2">
                <InfoRow
                    label={'Balance'}
                    value={
                        <DirectionValue
                            value={Number(accountDetails.balance.toFixed(2))}
                            prefix="$"
                        />
                    }
                />
                <InfoRow
                    label={'Equity'}
                    value={
                        <DirectionValue
                            value={Number(
                                (accountDetails.balance + openProfitLoss).toFixed(2)
                            )}
                            prefix="$"
                        />
                    }
                />

                <View className="w-full mb-1.5" />

                <InfoRow label={'Program'} value="1 Step" />

                <InfoRow
                    label={'Trading Days'}
                    value={
                        <View className="flex-row">
                            <Text>{metricsData.trading_days}&nbsp;</Text>
                            {metricsData.min_trading_days > 0 && (
                                <Text className="text-foreground-tertiary">
                                    / {metricsData.min_trading_days}
                                </Text>
                            )}
                        </View>
                    }
                />

                <InfoRow
                    label={'Status'}
                    value={
                        <AccountStatus
                            isActive={
                                accountDetails.account_status === AccountStatusEnum.ACTIVE
                            }
                        />
                    }
                />

                <View className="w-full mb-1.5" />

                <InfoRow
                    label={'Leverage'}
                    value={`${accountLeverage ?? 1}X`}
                />

                <InfoRow
                    label={'Daily Loss'}
                    value={
                        <View className="flex-row">
                            <DirectionValue value={dailyLoss} prefix="$" colorized />
                            {accountDetails.max_daily_loss > 0 && (
                                <DirectionValue value={maxDailyLoss} prefix="/ -$" />
                            )}
                        </View>
                    }
                />

                <InfoRow
                    label={'Max Loss'}
                    value={
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
                    }
                />

                <InfoRow
                    label={'Profit Target'}
                    value={
                        <View className="flex-row items-center">
                            <DirectionValue value={netPlInUnits} prefix="$" colorized />
                            {metricsData.profit_target > 0 ? (
                                <DirectionValue value={targetInUnits} prefix=" / $" />
                            ) : accountDetails.account_type ===
                                AccountTypeEnum.COMPETITION ? (
                                <>
                                    <Text className="text-foreground-tertiary">/</Text>
                                    <Text className="text-green-theme text-sm">&nbsp;∞</Text>
                                </>
                            ) : null}
                        </View>
                    }
                />

                <InfoRow
                    label={'Trading Days'}
                    value={
                        <View className="flex-row">
                            <Text>{metricsData.trading_days}&nbsp;</Text>
                            {metricsData.min_trading_days > 0 && (
                                <Text className="text-foreground-tertiary">
                                    / {metricsData.min_trading_days}
                                </Text>
                            )}
                        </View>
                    }
                />

                <View className="w-full mb-1.5" />

                <View className="flex-row items-center justify-between w-full pb-2">
                    <Text className="text-xs font-normal text-foreground-tertiary">
                        {'Progress'}:
                    </Text>
                </View>

                <View className="w-full overflow-hidden">
                    {/* instead of this MaxDrawdownbar we need to call the  */}
                    <MaxDrawdownBar
                        showMinimumLimit
                        value={netPlInUnits}
                        minimumLimit={-maxDrawdownInUnits}
                        maximumLimit={targetInUnits}
                        valueLabel=""
                        positiveValueLabel={
                            accountDetails.account_type === AccountTypeEnum.COMPETITION
                                ? '∞'
                                : null
                        }
                        valuePosition={ValuePositionEnum.Inline}
                    />
                </View>
            </View>
        </View>
    );

}