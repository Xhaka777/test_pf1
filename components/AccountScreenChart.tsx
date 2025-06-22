import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// import { AreaChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import Svg, {
    Path,
    Line,
    Text as SvgText,
    Defs,
    LinearGradient,
    Stop,
    G
} from 'react-native-svg';
import * as d3 from 'd3';


const { width: screenWidth } = Dimensions.get('window');

const AccountScreenChart = () => {
    // Sample data - replace with your actual trading data
    const data = [
        16000, 12000, 19000, 14000, 11500, 15800, 17200, 12800,
        17500, 16200, 15900, 16700, 15500, 8000, 14800, 15200,
        12900, 15100, 14700, 15300, 12000, 14600, 11400, 14200,
        13800, 5000
    ];

    const dates = ['May 21', 'May 23', 'May 25', 'May 27'];
    const profitTarget = 18000;
    const maxLoss = 2000;

    const margin = { top: 20, right: 0, bottom: 0, left: 0 };
    const chartWidth = screenWidth - 30 - margin.left - margin.right;
    const chartHeight = 100;

    const minValue = Math.min(Math.min(...data), maxLoss) - 1000;
    const maxValue = Math.max(Math.max(...data), profitTarget) + 1000;


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

                            <Path d={areaPath || ''} fill="url(#area-gradient)" />
                            <Path d={linePath || ''} fill="none" stroke="url(#line-gradient)" strokeWidth={2.5} />


                            <View className="flex-row items-center mt-3">
                                <Text className="bg-green-300 px-2 py-0.5 rounded text-xs text-black font-Inter">
                                    Profit Target <Text className="bg-black text-white px-2 py-0.5 text-xs font-Inter">$18,000</Text>
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
                        </G>
                    </Svg>

                    <View className="">
                        <View className="flex-row items-center">
                            <Text className="bg-red-500 px-2 py-0.5 rounded text-xs text-white">
                                Max Loss <Text className="bg-black text-white px-2 py-0.5 text-xs">$2,000</Text>
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
                    </View>

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