import { View, Text, Alert, Image } from 'react-native'
import React, { useCallback, useState } from 'react'
import CustomButton from './CustomButton';
import icons from '@/constants/icons';
import { router } from 'expo-router';
import { useOAuth, useSignIn } from '@clerk/clerk-expo';

interface OAuthProps {
    isSignUp?: boolean;
}

const OAuth = ({ isSignUp = false }: OAuthProps) => {

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const { isLoaded } = useSignIn();

    const actionText = isSignUp ? 'Sign up' : 'Sign in';
    const dividerText = `or ${actionText} with Email`;

    const [googleLoading, setGoogleLoading] = useState(false);

    const onGoogleSignInPress = useCallback(async () => {
        if (!isLoaded) return;

        setGoogleLoading(true);

        try {
            const { createdSessionId, setActive } = await startOAuthFlow();

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

    return (
        <View>
            <View className='flex flex-row justify-center items-center mt-4 gap-x-3'>
                <View className='flex-1 h-[1px] bg-gray-600' />
                <Text className='text-xs text-gray-500 font-INter'>{dividerText}</Text>
                <View className='flex-1 h-[1px] bg-gray-600' />
            </View>
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
            />
        </View>
    )
}

export default OAuth