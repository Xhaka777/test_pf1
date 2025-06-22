import React, { useMemo, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import * as d3 from 'd3';
import { getDateRangeFromTimeframe, timeframes, TimeframeSelector } from './timeframe-selector';
import { useFetchAccountsOverviewDetails } from '@/hooks/api/useFetchAccountsOverviewDetails';
import { AccountTypeEnum } from '@/constants/enums';
interface ApiDataPoint {
  balance: number;
  date: string; // "2025-05-19 09:46:58+00"
}

interface ApiDataPoint {
  balance: number;
  date: string; // "2025-05-19 09:46:58+00"
}

interface ApiResponse {
  details: ApiDataPoint[];
  status: string;
}

// Chart data interface
interface ChartDataPoint {
  time: string;
  value: number;
  originalDate: string;
}

interface TimeSeriesChartProps {
  height?: number;
  width?: number;
  lineColor?: string;
  areaColor?: string;
  backgroundColor?: string;
  showLabels?: boolean;
  accountType?: AccountTypeEnum;
  timeframe?: (typeof timeframes)[number];
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  height = 200,
  width = Dimensions.get('window').width - 32,
  lineColor = '#c21e8c',
  areaColor = '#d13f99',
  backgroundColor = 'black',
  showLabels = true,
  accountType = AccountTypeEnum.DEMO,
  timeframe = 'All Time', // Default timeframe
}) => {
  // const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>('1M');

  // Get date range based on timeframe
  const dateRange = useMemo(() => {
    return getDateRangeFromTimeframe(timeframe);
  }, [timeframe]);

  // Fetch data based on timeframe
  const { data, loading, error } = useFetchAccountsOverviewDetails({
    account_type: accountType,
    ...dateRange,
  });

  // Transform API data to chart format
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data?.details?.length) return [];

    return data.details.map((item: ApiDataPoint) => {
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
        value: item.balance,
        originalDate: item.date,
      };
    }).filter(Boolean) as ChartDataPoint[]; // Remove null entries
  }, [data, timeframe]);

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

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
        // Show hourly labels (e.g., 3PM, 4PM, 5PM, etc.)
        const currentHour = new Date(startDate);
        currentHour.setMinutes(0, 0, 0); // Start at the beginning of the hour

        let labelCount = 0;
        const maxLabels = 7; // Show max 7 hour labels

        while (currentHour <= endDate && labelCount < maxLabels) {
          const hourLabel = currentHour.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
          });

          // Calculate position based on time progression
          const totalDuration = endDate.getTime() - startDate.getTime();
          const currentDuration = currentHour.getTime() - startDate.getTime();
          const position = (currentDuration / totalDuration) * 100;

          labels.push({
            time: hourLabel,
            position: Math.max(0, Math.min(100, position))
          });

          currentHour.setHours(currentHour.getHours() + 1);
          labelCount++;
        }
        break;
      }

      case '1W': {
        // Show daily labels (Mon, Tue, Wed, etc.)
        const currentDay = new Date(startDate);
        currentDay.setHours(0, 0, 0, 0); // Start at beginning of day

        // Go to the start of the week (Monday)
        const dayOfWeek = currentDay.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        currentDay.setDate(currentDay.getDate() - daysToMonday);

        for (let i = 0; i < 7; i++) {
          const dayLabel = currentDay.toLocaleDateString('en-US', {
            weekday: 'short'
          });

          // Calculate position for each day
          const position = (i / 6) * 100; // Spread across 7 days

          labels.push({
            time: dayLabel,
            position
          });

          currentDay.setDate(currentDay.getDate() + 1);
        }
        break;
      }

      case '1M': {
        // Show weekly labels or key dates
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const interval = Math.max(1, Math.floor(totalDays / 4)); // Show ~4 labels

        const currentDate = new Date(startDate);
        let labelCount = 0;

        while (currentDate <= endDate && labelCount < 5) {
          const dateLabel = currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          const totalDuration = endDate.getTime() - startDate.getTime();
          const currentDuration = currentDate.getTime() - startDate.getTime();
          const position = (currentDuration / totalDuration) * 100;

          labels.push({
            time: dateLabel,
            position: Math.max(0, Math.min(100, position))
          });

          currentDate.setDate(currentDate.getDate() + interval);
          labelCount++;
        }
        break;
      }

      case 'All Time': {
        // Show yearly labels
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
          const yearDate = new Date(year, 0, 1); // January 1st of the year

          if (yearDate >= startDate && yearDate <= endDate) {
            const totalDuration = endDate.getTime() - startDate.getTime();
            const currentDuration = yearDate.getTime() - startDate.getTime();
            const position = (currentDuration / totalDuration) * 100;

            labels.push({
              time: year.toString(),
              position: Math.max(0, Math.min(100, position))
            });
          }
        }

        // If we have very few years, add the end year
        if (labels.length < 2) {
          labels.push({
            time: endYear.toString(),
            position: 100
          });
        }
        break;
      }

      default: {
        // Fallback: use existing data points with better spacing
        const maxLabels = 4;
        const step = Math.max(1, Math.floor(chartData.length / maxLabels));

        for (let i = 0; i < chartData.length; i += step) {
          const position = (i / (chartData.length - 1)) * 100;
          labels.push({
            time: chartData[i].time,
            position
          });
        }

        // Always include the last point
        if (labels[labels.length - 1]?.position !== 100) {
          labels.push({
            time: chartData[chartData.length - 1].time,
            position: 100
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

  // Show loading state
  if (loading) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="rounded-lg relative justify-center items-center h-[200px]">
          <Text className="text-gray-400 text-sm">Loading chart data...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="bg-gray-800 rounded-lg p-3 justify-center items-center h-[200px]">
          <Text className="text-red-400 text-sm">Error: {error}</Text>
        </View>
      </View>
    );
  }

  // Show no data state
  if (!data || chartData.length === 0) {
    return (
      <View className="rounded-xl p-4 m-2">
        <View className="rounded-lg p-3 justify-center items-center h-[200px]">
          <Text className="text-gray-400 text-sm">No data available for selected timeframe</Text>
        </View>
      </View>
    );
  }

return (
    <View className="p-4 rounded-xl m-2">
      {/* Chart Area */}
      <View className="rounded-lg relative">
        <Svg width={width} height={height}>
          <Defs>
            {/* Line gradient - darker pink */}
            <LinearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lineColor} stopOpacity={1} />
              <Stop offset="100%" stopColor={lineColor} stopOpacity={0.8} />
            </LinearGradient>

            {/* Area gradient - light pink that fades */}
            <LinearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={areaColor} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={areaColor} stopOpacity={0.01} />
            </LinearGradient>
          </Defs>

          <G translateX={margin.left} translateY={margin.top}>
            {/* Area below the line */}
            <Path
              d={areaPath}
              fill="url(#area-gradient)"
            />

            {/* Chart line */}
            <Path
              d={linePath}
              fill="none"
              stroke="url(#line-gradient)"
              strokeWidth={2.5}
            />
          </G>
        </Svg>

        {/* Time labels */}
        {showLabels && timeLabels.length > 0 && (
          <View className="relative -mt-6">
            {timeLabels.map((label, i) => {
              // Adjust positioning to account for padding and prevent cutoff
                let adjustedPosition = label.position;
                
                // For first and last labels, adjust to prevent cutoff
                if (i === 0) {
                  adjustedPosition = Math.max(8, label.position); // Min 8% from left edge
                } else if (i === timeLabels.length - 1) {
                  adjustedPosition = Math.min(92, label.position); // Max 92% from left edge
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    overflow: 'hidden'
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
    // paddingHorizontal: 2,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginTop: -10,
  }
})

export default TimeSeriesChart;