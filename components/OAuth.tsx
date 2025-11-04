import { View, Text, Alert, Image, Platform } from 'react-native'
import React, { useCallback, useState } from 'react'
import CustomButton from './CustomButton';
import icons from '@/constants/icons';
import { router } from 'expo-router';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Apple } from 'lucide-react-native';
import { useWarmUpBrowser } from '@/lib/useWarmUpBrowser';

interface OAuthProps {
    isSignUp?: boolean;
}

const OAuth = ({ isSignUp = false }: OAuthProps) => {

    useWarmUpBrowser(); // pre-warm browser

    const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
    const { isLoaded } = useSignIn();

    const actionText = isSignUp ? 'Sign up' : 'Sign in';
    const dividerText = `or ${actionText} with Email`;

    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    const onGoogleSignInPress = useCallback(async () => {
        if (!isLoaded) return;

        setGoogleLoading(true);

        try {
            const { createdSessionId, setActive } = await startGoogleOAuthFlow();

            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                router.replace('/(tabs)/overview');
            }
        } catch (error: any) {
            Alert.alert('Error', error.errors ? error.errors[0].longMessage : "Google sign-in failed")
            console.log(JSON.stringify(error, null, 2));
        } finally {
            setGoogleLoading(false);
        }
    }, [isLoaded]);

    const onAppleSignInPress = useCallback(async () => {
        if (!isLoaded) return;

        setAppleLoading(true);

        try {
            const { createdSessionId, setActive } = await startAppleOAuthFlow();

            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                router.replace('/(tabs)/overview');
            }
        } catch (error: any) {
            Alert.alert('Error', error.errors ? error.errors[0].longMessage : "Apple sign-in failed")
            console.log(JSON.stringify(error, null, 2));
        } finally {
            setAppleLoading(false);
        }
    }, [isLoaded]);

    // Check if Apple Sign-In is available (iOS 13+ required)
    const isAppleSignInAvailable = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 13;

    return (
        <View>
            <View className='flex flex-row justify-center items-center mt-4 gap-x-3'>
                <View className='flex-1 h-[1px] bg-gray-600' />
                <Text className='text-xs text-gray-500 font-Inter'>{dividerText}</Text>
                <View className='flex-1 h-[1px] bg-gray-600' />
            </View>

            {/* Google Sign-In Button */}
            <CustomButton
                title={`${actionText} with Google`}
                className="mt-5 w-full"
                IconLeft={() => (
                    <Image
                        source={icons.google}
                        resizeMode='contain'
                        className='w-5 h-5 mx-2'
                    />
                )}
                bgVariant="outline"
                onPress={onGoogleSignInPress}
                loading={googleLoading}
            />

            {/* Apple Sign-In Button - Only show on iOS 13+ */}
            {isAppleSignInAvailable && (
                <CustomButton
                    title={`${actionText} with Apple `}
                    className="mt-3 w-full"
                    IconLeft={() => (
                        <Image
                            source={icons.apple}
                            resizeMode='contain'
                            className='w-6 h-6 mx-2'
                        />
                    )}
                    bgVariant="outline"
                    onPress={onAppleSignInPress}
                    loading={appleLoading}
                />
            )}
        </View>
    )
}

export default OAuth