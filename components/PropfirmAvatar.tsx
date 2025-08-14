import { View, Image, Text } from 'react-native';

type PropfirmAvatarProps = {
  logo: string | null | undefined;
  name: string;
  className?: string;
};

export function PropfirmAvatar({ logo, name, className }: PropfirmAvatarProps) {
  const hasLogo = !!logo;

  return (
    <View
      className={`w-10 h-10 rounded-sm overflow-hidden border border-[0.5px] bg-muted justify-center items-center ${className ?? ''}`}
    >
      {hasLogo ? (
        <Image
          source={{ uri: logo! }}
          className="w-full h-full"
          resizeMode="cover"
          onError={() => {
            // Optional: log or fallback state
          }}
        />
      ) : (
        <Text className="text-sm font-semibold text-white">
          {name ? name.toUpperCase().slice(0, 2) : ''}
        </Text>
      )}
    </View>
  );
}
