import { Text, TouchableOpacity, View } from "react-native";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";

export const timeframes = ['1D', '1W', '1M', 'All Time'] as const;

interface TimeframeSelectorProps {
    selected: (typeof timeframes)[number];
    onSelect: (timeframe: (typeof timeframes)[number]) => void;
}

export function getDateRangeFromTimeframe(
    timeframe: (typeof timeframes)[number]
): { start_date: string; end_date: string } {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
        case '1D':
            startDate = subDays(now, 1);
            break;
        case '1W':
            startDate = subWeeks(now, 1);
            break;
        case '1M':
            startDate = subMonths(now, 1);
            break;
        case 'All Time':
            startDate = new Date(0); // Start from epoch    
            break;
        default:
            throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    const formatDate = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss');

    return {
        start_date: formatDate(startDate),
        end_date: formatDate(now),
    }
}

export function TimeframeSelector({
    selected,
    onSelect
}: TimeframeSelectorProps) {
    return (
        <View className="flex-row gap-2">
            {timeframes.map((timeframe) => (
                <TouchableOpacity
                    className={`px-3 py-2 rounded-lg mr-1 ${selected === timeframe ? 'bg-[#2F2C2D] border border-[#2F2C2D]' : 'bg-propfirmone-300 border border-[#4F494C]'}`}
                    key={timeframe}
                    onPress={() => onSelect(timeframe)}
                >
                    <Text className={`text-sm font-InterSemiBold ${selected === timeframe ? 'text-white' : 'text-gray-400'}`}>
                        {timeframe}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )
}