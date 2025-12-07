import { AccountDetails } from "@/api/schema";
import { Metrics } from "@/api/schema/metrics";
import { useOpenPositionsWS } from "@/providers/open-positions";
import { AccountStatusEnum, AccountTypeEnum, ExchangeTypeEnum } from "@/shared/enums";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { DirectionValue } from "./DirectionValue";
import { AccountStatus } from "./AccountStatus";
import ProfitLossIndicator from "./ProfitLossIndicator";

// ---------- Helpers ----------
const safeNum = (value: any, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const format = (value: any, decimals = 2) => {
  return safeNum(value).toFixed(decimals);
};

export function AccountInfo({
  accountDetails,
  metricsData,
}: {
  accountDetails: AccountDetails | undefined;
  metricsData: Metrics | undefined;
}) {
  const { data: openTrades } = useOpenPositionsWS();

  // Prevent rendering if we don't have required data yet
  if (
    !accountDetails ||
    !metricsData ||
    accountDetails.balance === undefined ||
    metricsData.starting_balance === undefined
  ) {
    return (
      <View className="mt-2 p-4">
        <Text className="text-gray-400 text-sm font-Inter">
          Loading account information...
        </Text>
      </View>
    );
  }

  // console.log('AccountInfo - Account ID:', accountDetails?.account_type);

  // ---------- Computed Values ----------
  const openProfitLoss = useMemo(() => {
    try {
      if (!openTrades?.open_trades?.length) return 0;
      return openTrades.open_trades.reduce(
        (acc, trade) => acc + safeNum(trade?.pl),
        0
      );
    } catch {
      return 0;
    }
  }, [openTrades]);

  const balance = safeNum(accountDetails.balance);
  const equity = balance + openProfitLoss;

  const maxLoss = useMemo(() => {
    if (!metricsData?.starting_balance) return 0;
    return equity >= metricsData.starting_balance
      ? 0
      : equity - safeNum(metricsData.starting_balance);
  }, [equity, metricsData]);

  const maxTotalLoss = safeNum(metricsData?.max_total_dd) > 0
    ? (safeNum(metricsData.max_total_dd) / 100) * safeNum(metricsData.starting_balance)
    : 0;

  const accountLeverage = useMemo(() => {
    if (!accountDetails?.leverage) return 1;

    const key =
      [
        ExchangeTypeEnum.MT5,
        ExchangeTypeEnum.DXTrade,
        ExchangeTypeEnum.CTrader,
      ].includes(accountDetails.exchange)
        ? "EURUSD"
        : "BTCUSDT";

    return safeNum(accountDetails.leverage?.[key], 1);
  }, [accountDetails]);

  const dailyLoss = useMemo(() => {
    if (!metricsData) return 0;
    const starting_day_balance =
      safeNum(metricsData.starting_balance) - safeNum(metricsData.daily_pl);
    return metricsData.daily_pl > 0
      ? 0
      : (safeNum(metricsData.daily_pl) / starting_day_balance) * 100;
  }, [metricsData]);

  const maxDailyLoss = ((safeNum(accountDetails.max_daily_loss) / 100) * safeNum(metricsData.starting_balance));

  const profitTargetInUnits = ((safeNum(metricsData?.profit_target, 15) / 100) * safeNum(metricsData.starting_balance));

  const maxDrawdownInUnits = ((safeNum(metricsData?.max_total_dd) / 100) * safeNum(metricsData.starting_balance));

  const netPlInUnits = useMemo(() => {
    if (!metricsData) return 0;

    let result = (safeNum(metricsData?.net_pl) / 100) * safeNum(metricsData?.starting_balance);

    if (result > 0) {
      result = Math.min(result, profitTargetInUnits);
    } else {
      result = Math.max(result, -maxDrawdownInUnits);
    }
    return result;
  }, [metricsData, profitTargetInUnits, maxDrawdownInUnits]);

  return (
    <View className="mt-2 px-2">
      <View className="flex flex-wrap justify-between p-1 space-y-3">

        {/* Balance & Equity */}
        <View className="space-y-3 mb-2">
          <InfoRow label="Balance">
            <DirectionValue value={safeNum(balance)} prefix="$" />
          </InfoRow>

          <InfoRow label="Equity">
            <DirectionValue value={safeNum(equity)} prefix="$" />
          </InfoRow>
        </View>

        <View className="w-full h-[1px] bg-[#2F2C2D]" />

        {/* Program & Trading Days */}
        <View className="space-y-3">
          <InfoRow label="Program">
            <Text className="text-white text-sm font-Inter">1 Step</Text>
          </InfoRow>

          <InfoRow label="Trading Days">
            <Text className="text-white text-sm font-Inter">
              {safeNum(metricsData.trading_days)} / {safeNum(metricsData.min_trading_days)}
            </Text>
          </InfoRow>
        </View>

        {/* Status */}
        <View className="space-y-3">
          <InfoRow label="Status">
            <AccountStatus isActive={accountDetails.account_status === AccountStatusEnum.ACTIVE} />
          </InfoRow>
        </View>

        <View className="w-full h-[1px] bg-[#2F2C2D]" />

        {/* Loss + Risk */}
        <View className="space-y-3">
          <InfoRow label="Leverage">
            <Text className="text-white text-sm font-Inter">{accountLeverage}X</Text>
          </InfoRow>

          <InfoRow label="Daily Loss">
            <DirectionValue value={dailyLoss} prefix="$" colorized />
            <DirectionValue value={maxDailyLoss} prefix="/ -$" />
          </InfoRow>

          <InfoRow label="Max Loss">
            <DirectionValue value={safeNum(maxLoss)} prefix="$" colorized />
            {metricsData.max_total_dd > 0 && (
              <DirectionValue value={maxTotalLoss} prefix="/ -$" />
            )}
          </InfoRow>

          <InfoRow label="Profit Target">
            <DirectionValue value={netPlInUnits} prefix="$" colorized />
            <DirectionValue value={profitTargetInUnits} prefix=" / $" />
          </InfoRow>
        </View>

        <View className="w-full h-[1px] bg-[#2F2C2D]" />

        {/* Progress */}
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


// ---------- UI Helper ----------
function InfoRow({ label, children }: { label: string; children: any }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-gray-400 text-sm mb-1 font-Inter">{label}:</Text>
      <View className="flex-row items-center">{children}</View>
    </View>
  );
}
