import { Text } from 'react-native';

type DirectionValueProps = {
  prefix?: string;
  suffix?: string;
  className?: string;
  value: number | string;
  colorized?: boolean;
};

export function DirectionValue({
  prefix = '',
  suffix = '',
  className = '',
  value,
  colorized = false,
}: DirectionValueProps) {
  const numericValue = Number(value);
  const isPositive = numericValue > 0;
  const isNegative = numericValue < 0;

  let colorClass = '';
  if (colorized) {
    if (isPositive) {
      colorClass = 'text-green-theme';
    } else if (isNegative) {
      colorClass = 'text-red-theme';
    }
  }

  return (
    <Text
      className={`text-xs text-white font-InterMedium ${colorClass} ${className}`}
    >
      {isNegative ? '-' : ''}
      {prefix}
      {Math.abs(Number(numericValue.toFixed(2))).toLocaleString()}
      {suffix}
    </Text>
  );
}
