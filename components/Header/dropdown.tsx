// import { View } from "lucide-react-native";
import { useEffect } from "react";
import { View, Dimensions, Image, Linking, Platform, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import images from '@/constants/images';


interface DropdownProps {
    visible: boolean;
    onClose: () => void;
}

export function Dropdown({ visible, onClose }: DropdownProps) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const { width } = Dimensions.get('window');

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
            scale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.5,
            })
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.9, { duration: 150 })
        }
    }, [visible, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }))

    if (!visible && opacity.value === 0) {
        return null;
    }

    const handleFirstImagePress = async () => {
        try {
            await Linking.openURL('https://propfirmmatch.com/');
            await new Promise(resolve => setTimeout(resolve, 300));
            onClose();
        } catch (error) {
            console.error('Error opeing URL:', error);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={onClose}>
            <View className="absolute top-14 left-0 right-0 bottom-0 z-50">
                <TouchableWithoutFeedback>
                    <Animated.View
                        className="absolute top-2 left-2 bg-[#1A1819] rounded-xl p-2 shadow-lg z-50"
                        style={[
                            animatedStyle,
                            {
                                width: width * 0.8,
                                ...(Platform.OS === 'web' ? { transform: 'traslateZ(0)' } : {})
                            }
                        ]}
                    >
                        <TouchableOpacity
                            className="w-full h-32 rounded-xl mb-3 overflow-hidden bg-[#230a3a]"
                            activeOpacity={0.7}
                            onPress={handleFirstImagePress}
                        >
                            <Image
                                source={images.frame}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="w-full h-32 rounded-xl overflow-hidden "
                            activeOpacity={0.7}
                            onPress={() => {
                                onClose();
                            }}
                        >
                            <Image
                                source={images.pf1_frame}
                                className="w-full h-full"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    )
}