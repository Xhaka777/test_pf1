import { Text, View } from "react-native";


interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    tooltip?: string;
    className?: string;
}

export function InfoRow({ label, value, tooltip, className }: InfoRowProps) {
    return (
      <View className={`flex pb-2 items-center justify-between w-full ${className || ''}`}>
        <Text className="flex text-xs font-normal text-foreground-tertiary">
          {label}:
        </Text>
        <Text className="text-xs font-medium">{value}</Text>
      </View>
    );
  }
  