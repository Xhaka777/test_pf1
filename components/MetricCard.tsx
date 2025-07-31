import React, { PropsWithChildren, ReactNode } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import icons from '@/constants/icons';
import { PositionColorEnum } from '@/api/schema';
import { trendColor } from '@/utils/trend-color';

export type MetricCardProps = PropsWithChildren & {
  title?: string;
  value?: string;
  colorize?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  icon?: ReactNode;
  valueClassName?: string;
}

function MetricCard({
  title,
  value,
  colorize,
  valuePrefix,
  valueSuffix,
  children,
  icon,
  valueClassName
}: MetricCardProps) {
  const colorClass: PositionColorEnum = trendColor(value);

  return (
    <View className="flex-1 flex flex-col justify-between p-2 rounded-lg bg-propfirmone-300">
      {icon ? <View>{icon}</View> : null}

      <View className="flex flex-col gap-1">
        {title && (
          <Text className="text-xs text-white text-foreground-tertiary">{title}</Text>
        )}

        {children ?? (
          <Text
            className={`text-xs font-semibold ${valueClassName ?? ''} ${colorize ? colorClass : ''
              }`}
          >
            {typeof value === 'number' ? (value < 0 ? '-' : '') : ''}
            {valuePrefix}
            {Math.abs(value ?? 0).toLocaleString()}
            {valueSuffix}
          </Text>
        )}
      </View>
    </View>
  );
}

export default MetricCard;