import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, {
    Path,
    Line,
    Defs,
    LinearGradient,
    Stop,
    G
} from 'react-native-svg';
import * as d3 from 'd3';
import { Metrics } from '@/api/schema/metrics';
import { DashboardAccountType } from '@/app/(tabs)/account';

const { width: screenWidth } = Dimensions.get('window');

interface AccountScreenChartProps {
    metricsData: Metrics | undefined;
    dashboardAccountType: DashboardAccountType | null;
    startingBalance: number;
    profitTarget: number;
    maxTotalDd: number;
}

const AccountScreenChart = ({
    metricsData,
    dashboardAccountType,
    startingBalance,
    profitTarget,
    maxTotalDd,
}: AccountScreenChartProps) => {

    const profitTargetValue = useMemo(() => {
        if (!profitTarget || !startingBalance) {
            return null;
        }
        return startingBalance * (profitTarget / 100);
    }, [profitTarget, startingBalance]);

    const maxLoss = useMemo(() => {
        if (!startingBalance || !maxTotalDd) {
            return null;
        }
        return startingBalance * (maxTotalDd / 100);
    }, [maxTotalDd, startingBalance]);

    const chartData = useMemo(() => {
        if (!metricsData?.daily_summary) return [];
        
        const trades = Object.values(metricsData.daily_summary).flatMap((summary) =>
            summary.trades_summary.map((trade) => ({
                balance: trade.balance,
                ticket: trade.order_id,
                pl: trade.pl,
                tradeNumber: 0,
            })),
        );

        return [
            {
                balance: startingBalance ?? 0,
                ticket: 'Starting Balance',
                pl: startingBalance ?? 0,
                tradeNumber: 0,
            },
            ...trades,
        ].map((trade, index) => ({
            ...trade,
            tradeNumber: index,
        }));
    }, [metricsData?.daily_summary, startingBalance]);

    // Extract balance values for the chart
    const balanceData = useMemo(() => {
        return chartData.map(item => item.balance);
    }, [chartData]);

    // Generate sample dates based on chart data length or use actual dates if available
    const dates = useMemo(() => {
        if (!metricsData?.daily_summary) {
            return ['Jan 21', 'Jan 23', 'Jan 25', 'Jan 27'];
        }
        
        const dateKeys = Object.keys(metricsData.daily_summary).sort().slice(0, 4);
        if (dateKeys.length === 0) {
            return ['Jan 21', 'Jan 23', 'Jan 25', 'Jan 27'];
        }
        
        return dateKeys.map(dateStr => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        });
    }, [metricsData?.daily_summary]);

    // Use actual data if available, otherwise fallback to sample data
    const data = balanceData.length > 0 ? balanceData : [
        16000, 12000, 19000, 14000, 11500, 15800, 17200, 12800,
        17500, 16200, 15900, 16700, 15500, 8000, 14800, 15200,
        12900, 15100, 14700, 15300, 12000, 14600, 11400, 14200,
        13800, 5000
    ];

    // Calculate actual profit target and max loss values for display
    const displayProfitTarget = profitTargetValue 
        ? (profitTargetValue + startingBalance) 
        : 18000;
    
    const displayMaxLoss = maxLoss 
        ? (startingBalance - maxLoss) 
        : 2000;

    const margin = { top: 20, right: 0, bottom: 0, left: 0 };
    const chartWidth = screenWidth - 30 - margin.left - margin.right;
    const chartHeight = 100;

    const minValue = Math.min(Math.min(...data), displayMaxLoss) - 1000;
    const maxValue = Math.max(Math.max(...data), displayProfitTarget) + 1000;

    const xScale = d3.scaleLinear()
        .domain([0, data.length - 1])
        .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range([chartHeight, 0]);

    const linePath = d3.line()
        .x((_, i) => xScale(i))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX)(data);

    const areaPath = d3.area()
        .x((_, i) => xScale(i))
        .y0(chartHeight)
        .y1(d => yScale(d))
        .curve(d3.curveMonotoneX)(data);

    const yTicks = d3.ticks(minValue, maxValue, 6).map(value => ({
        value,
        y: yScale(value)
    }));

    const xTicks = dates.map((date, index) => ({
        date,
        x: (index / (dates.length - 1)) * chartWidth
    }));

    // Show reference lines only for PROP_FIRM accounts when we have data
    const showReferenceLines = dashboardAccountType === DashboardAccountType.PROP_FIRM && 
        chartData?.length > 0 && 
        profitTargetValue !== maxLoss;

    return (
        <View className="rounded-xl m-2.5">
            <View className="flex-row">
                <View className="flex-1 relative">
                    <Svg width={chartWidth + margin.left + margin.right} height={chartHeight + margin.top + margin.bottom}>
                        <Defs>
                            <LinearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0%" stopColor="#d13f99" stopOpacity={1} />
                                <Stop offset="100%" stopColor="#d13f99" stopOpacity={0.1} />
                            </LinearGradient>
                            <LinearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0%" stopColor="#c21e8c" stopOpacity={0.3} />
                                <Stop offset="100%" stopColor="#c21e8c" stopOpacity={0.9} />
                            </LinearGradient>
                        </Defs>

                        <G translateX={margin.left} translateY={margin.top}>
                            {/* Grid lines */}
                            {yTicks.map((tick, index) => (
                                <Line
                                    key={`grid-${index}`}
                                    x1="0"
                                    y1={tick.y}
                                    x2={chartWidth}
                                    y2={tick.y}
                                    stroke="#333"
                                    strokeWidth="1"
                                    opacity="0.3"
                                />
                            ))}

                            {/* Reference lines for PROP_FIRM accounts */}
                            {showReferenceLines && profitTargetValue && (
                                <Line
                                    x1="0"
                                    y1={yScale(displayProfitTarget)}
                                    x2={chartWidth}
                                    y2={yScale(displayProfitTarget)}
                                    stroke="rgb(34, 197, 94)"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                    opacity="0.8"
                                />
                            )}

                            {showReferenceLines && maxLoss && !isNaN(maxLoss) && (
                                <Line
                                    x1="0"
                                    y1={yScale(displayMaxLoss)}
                                    x2={chartWidth}
                                    y2={yScale(displayMaxLoss)}
                                    stroke="rgb(239, 68, 68)"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                    opacity="0.8"
                                />
                            )}

                            {/* Area and line */}
                            <Path d={areaPath || ''} fill="url(#area-gradient)" />
                            <Path d={linePath || ''} fill="none" stroke="url(#line-gradient)" strokeWidth={2.5} />
                        </G>
                    </Svg>

                    {/* Profit Target Label - only show for PROP_FIRM */}
                    {showReferenceLines && profitTargetValue && (
                        <View className="flex-row items-center mt-3">
                            <Text className="bg-green-500 px-2 py-0.5 rounded text-xs text-white font-Inter">
                                Profit Target{' '}
                                <Text className="bg-black text-white px-2 py-0.5 text-xs font-Inter">
                                    ${displayProfitTarget.toLocaleString()}
                                </Text>
                            </Text>
                            <Svg height="2" style={{ flex: 1, marginLeft: 8 }}>
                                <Line
                                    x1="0"
                                    y1="1"
                                    x2="100%"
                                    y2="1"
                                    stroke="#4ade80"
                                    strokeWidth="1"
                                    strokeDasharray="4,4"
                                />
                            </Svg>
                        </View>
                    )}

                    {/* Max Loss Label - only show for PROP_FIRM */}
                    {showReferenceLines && maxLoss && !isNaN(maxLoss) && (
                        <View className="flex-row items-center mt-2">
                            <Text className="bg-red-500 px-2 py-0.5 rounded text-xs text-white font-Inter">
                                Max Loss{' '}
                                <Text className="bg-black text-white px-2 py-0.5 text-xs font-Inter">
                                    -${maxLoss.toLocaleString()}
                                </Text>
                            </Text>
                            <Svg height="2" style={{ flex: 1, marginLeft: 8 }}>
                                <Line
                                    x1="0"
                                    y1="1"
                                    x2="100%"
                                    y2="1"
                                    stroke="#ef4444"
                                    strokeWidth="1"
                                    strokeDasharray="6,4"
                                />
                            </Svg>
                        </View>
                    )}

                    {/* Date Labels */}
                    <View className="h-8 relative mt-2.5">
                        {xTicks.map((tick, index) => (
                            <Text
                                key={index}
                                className="text-gray-400 text-xs absolute text-center w-10 ml-1"
                                style={{ left: tick.x - 20 }}
                            >
                                {tick.date}
                            </Text>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default AccountScreenChart;