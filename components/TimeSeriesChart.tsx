import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import * as d3 from 'd3';
import { timeframes } from './timeframe-selector';
import { AccountTypeEnum } from '@/constants/enums';

// ✅ Support multiple data source types
interface ApiDataPoint {
  balance: number;
  date: string; // "2025-05-19 09:46:58+00"
}

interface BrokerOverviewDataPoint {
  balance: number;
  date: string;
}

interface PropFirmOverviewDataPoint {
  balance: number;
  date: string;
}

// Union type for different API responses
type ApiResponse = 
  | { details: ApiDataPoint[]; status: string }
  | { details: BrokerOverviewDataPoint[]; status: string }
  | { details: PropFirmOverviewDataPoint[]; status: string };

// Chart data interface
interface ChartDataPoint {
  time: string;
  value: number;
  originalDate: string;
}

interface TimeSeriesChartProps {
  data?: ApiResponse;
  height?: number;
  width?: number;
  lineColor?: string;
  areaColor?: string;
  backgroundColor?: string;
  showLabels?: boolean;
  accountType?: 'broker' | 'propfirm' | 'demo' | AccountTypeEnum;
  timeframe?: (typeof timeframes)[number];
  loading?: boolean;
  error?: string | null;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  height = 200,
  width = Dimensions.get('window').width - 32,
  lineColor = '#c21e8c',
  areaColor = '#d13f99',
  backgroundColor = 'black',
  showLabels = true,
  accountType = 'demo',
  timeframe = '1M',
  loading = false,
  error = null,
}) => {

  const colorTheme = useMemo(() => {
    switch (accountType) {
      case 'broker':
      case AccountTypeEnum.LIVE:
        return {
          lineColor: '#10B981', // Green for broker/live accounts
          areaColor: '#34D399',
          gradientId: 'broker-gradient'
        };
      case 'propfirm':
      case AccountTypeEnum.FUNDED:
      case AccountTypeEnum.EVALUATION:
        return {
          lineColor: '#8B5CF6', // Purple for prop firm accounts
          areaColor: '#A78BFA',
          gradientId: 'propfirm-gradient'
        };
      default:
        return {
          lineColor: lineColor,
          areaColor: areaColor,
          gradientId: 'default-gradient'
        };
    }
  }, [accountType, lineColor, areaColor]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data?.details?.length) return [];

    try {
      return data.details.map((item: any) => {
        // Parse the date string properly
        const date = new Date(item.date.replace(' ', 'T').replace('+00', 'Z'));
        let timeLabel = '';

        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', item.date);
          return null;
        }

        // Format time based on timeframe
        switch (timeframe) {
          case '1D':
            timeLabel = date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            break;
          case '1W':
            timeLabel = date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'numeric',
              day: 'numeric'
            });
            break;
          case '1M':
            timeLabel = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            break;
          case 'All Time':
            timeLabel = date.toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric'
            });
            break;
          default:
            timeLabel = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
        }

        return {
          time: timeLabel,
          value: item.balance || 0,
          originalDate: item.date,
        };
      }).filter(Boolean) as ChartDataPoint[];
    } catch (error) {
      console.error('Error transforming chart data:', error);
      return [];
    }
  }, [data, timeframe]);

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // ✅ Improved time labels with better spacing
  const timeLabels = useMemo(() => {
    if (chartData.length === 0) return [];

    const firstDataPoint = chartData[0];
    const lastDataPoint = chartData[chartData.length - 1];

    if (!firstDataPoint || !lastDataPoint) return [];

    const startDate = new Date(firstDataPoint.originalDate.replace(' ', 'T').replace('+00', 'Z'));
    const endDate = new Date(lastDataPoint.originalDate.replace(' ', 'T').replace('+00', 'Z'));

    const labels: { time: string; position: number }[] = [];

    switch (timeframe) {
      case '1D': {
        // Show key hours throughout the day
        const keyHours = [0, 6, 12, 18, 23];
        keyHours.forEach((hour, index) => {
          const position = (index / (keyHours.length - 1)) * 100;
          const hourLabel = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : 
                           hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
          labels.push({ time: hourLabel, position });
        });
        break;
      }

      case '1W': {
        // Show days of the week
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        weekdays.forEach((day, index) => {
          const position = (index / (weekdays.length - 1)) * 100;
          labels.push({ time: day, position });
        });
        break;
      }

      case '1M': {
        // Show weekly markers
        const weeksInMonth = 4;
        for (let week = 0; week < weeksInMonth; week++) {
          const weekDate = new Date(startDate);
          weekDate.setDate(startDate.getDate() + (week * 7));
          
          if (weekDate <= endDate) {
            const position = (week / (weeksInMonth - 1)) * 100;
            const label = weekDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });
            labels.push({ time: label, position });
          }
        }
        break;
      }

      case 'All Time': {
        // Show year markers
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const yearRange = endYear - startYear + 1;
        
        for (let i = 0; i < Math.min(yearRange, 5); i++) {
          const year = startYear + Math.floor(i * (yearRange - 1) / 4);
          const position = (i / 4) * 100;
          labels.push({ time: year.toString(), position });
        }
        break;
      }

      default: {
        // Fallback to data points
        const maxLabels = 4;
        const step = Math.max(1, Math.floor(chartData.length / maxLabels));
        
        for (let i = 0; i < chartData.length; i += step) {
          const position = (i / (chartData.length - 1)) * 100;
          labels.push({
            time: chartData[i].time,
            position
          });
        }
      }
    }

    return labels;
  }, [chartData, timeframe]);

  // Create scales
  const xScale = useMemo(() => {
    if (chartData.length === 0) return d3.scalePoint().domain([]).range([0, chartWidth]);

    return d3.scaleLinear()
      .domain([0, chartData.length - 1])
      .range([0, chartWidth]);
  }, [chartData, chartWidth]);

  const yScale = useMemo(() => {
    if (chartData.length === 0) return d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);

    const values = chartData.map(d => d.value);
    const maxValue = d3.max(values) || 100;
    const minValue = d3.min(values) || 0;

    // Add some padding (5% on each side)
    const range = maxValue - minValue;
    const padding = range > 0 ? range * 0.05 : maxValue * 0.05;

    return d3.scaleLinear()
      .domain([minValue - padding, maxValue + padding])
      .range([chartHeight, 0]);
  }, [chartData, chartHeight]);

  // Create the path string for the line
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';

    const line = d3.line<ChartDataPoint>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    return line(chartData) || '';
  }, [chartData, xScale, yScale]);

  // Create path for area under the line
  const areaPath = useMemo(() => {
    if (chartData.length === 0) return '';

    const area = d3.area<ChartDataPoint>()
      .x((d, i) => xScale(i))
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    return area(chartData) || '';
  }, [chartData, xScale, yScale, chartHeight]);

  // ✅ Show loading state
  if (loading) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="rounded-lg relative justify-center items-center h-[200px]">
          <Text className="text-gray-400 text-sm">Loading chart data...</Text>
        </View>
      </View>
    );
  }

  // ✅ Show error state
  if (error) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="bg-gray-800 rounded-lg p-3 justify-center items-center h-[200px]">
          <Text className="text-red-400 text-sm">Chart Error: {error}</Text>
        </View>
      </View>
    );
  }

  // ✅ Show no data state
  if (!data || chartData.length === 0) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="rounded-lg p-3 justify-center items-center h-[200px]">
          <Text className="text-gray-400 text-sm">
            No chart data available for {accountType} accounts
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-xl m-2">
      {/* ✅ Chart title based on account type */}
      {showLabels && (
        <View className="mb-2">
          <Text className="text-white text-sm font-Inter">
            {accountType === 'broker' ? 'Broker Account Performance' :
             accountType === 'propfirm' ? 'Prop Firm Account Performance' :
             'Account Performance'}
          </Text>
        </View>
      )}

      {/* Chart Area */}
      <View className="rounded-lg relative">
        <Svg width={width} height={height}>
          <Defs>
            {/* Dynamic gradients based on account type */}
            <LinearGradient id={`${colorTheme.gradientId}-line`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colorTheme.lineColor} stopOpacity={1} />
              <Stop offset="100%" stopColor={colorTheme.lineColor} stopOpacity={0.8} />
            </LinearGradient>

            <LinearGradient id={`${colorTheme.gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colorTheme.areaColor} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={colorTheme.areaColor} stopOpacity={0.01} />
            </LinearGradient>
          </Defs>

          <G translateX={margin.left} translateY={margin.top}>
            {/* Area below the line */}
            <Path
              d={areaPath}
              fill={`url(#${colorTheme.gradientId}-area)`}
            />

            {/* Chart line */}
            <Path
              d={linePath}
              fill="none"
              stroke={`url(#${colorTheme.gradientId}-line)`}
              strokeWidth={2.5}
            />
          </G>
        </Svg>

        {/* Time labels */}
        {showLabels && timeLabels.length > 0 && (
          <View className="relative -mt-6">
            {timeLabels.map((label, i) => {
              let adjustedPosition = label.position;
              
              // Prevent label cutoff
              if (i === 0) {
                adjustedPosition = Math.max(8, label.position);
              } else if (i === timeLabels.length - 1) {
                adjustedPosition = Math.min(92, label.position);
              }
              
              return (
                <View
                  key={i}
                  className="absolute ml-4 mb-3"
                  style={{
                    left: `${adjustedPosition}%`,
                    transform: [{ translateX: -50 }]
                  }}
                >
                  <Text className="text-gray-400 text-xs text-center font-Inter">
                    {label.time}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ✅ Chart summary info */}
      {showLabels && chartData.length > 0 && (
        <View className="flex-row justify-between mt-2 px-4">
          <Text className="text-gray-500 text-xs font-Inter">
            {chartData.length} data points
          </Text>
          <Text className="text-gray-500 text-xs font-Inter">
            {timeframe} timeframe
          </Text>
        </View>
      )}
    </View>
  );
};

export default TimeSeriesChart;