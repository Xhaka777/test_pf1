import { useCallback, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import OAuth from '@/components/OAuth'; // Ensure OAuth component accepts the 'entry' prop
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '@/lib/useWarmUpBrowser';
import icons from '@/constants/icons';
import * as WebBrowser from 'expo-web-browser';

// WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    
    const { signIn, setActive, isLoaded } = useSignIn();
    //Warm up the browser for OAuth (improves performance)
    useWarmUpBrowser();    

    const [form, setForm] = useState({
        email: "",
        password: "",
    })

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google'});

    const onGoogleSignInPress = useCallback(async () => {
        if (!isLoaded) return;
        
        setGoogleLoading(true);
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();
            
            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                router.replace('/(tabs)/overview');
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors ? err.errors[0].longMessage : "Google sign-in failed");
            console.error(JSON.stringify(err, null, 2));
        } finally {
            setGoogleLoading(false);
        }
    }, [isLoaded]);

    
    const onSignInPress = useCallback(async () => {
        if(!isLoaded) return;
        console.log('po hin mrena!')
        try {
            console.log('form.email', form.email)
            console.log('form.password', form.password)

            const signInAttempt = await signIn.create({
                identifier: form.email,
                password: form.password,
            });

            if(signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });
                router.replace('/(tabs)/overview');
            }else {
                console.log(JSON.stringify(signInAttempt, null, 2));
                Alert.alert("Error", "Log in failed. Please try again.")
            }
        } catch (error: any) {
            console.log(JSON.stringify(error, null, 2));
            Alert.alert("Error", error.errors[0].longMessage)
        }
    }, [isLoaded, form])

    return (
        <View className="flex-1 bg-black px-5">
            <View className="mt-14 mb-8">
                <Text className="text-2xl font-InterBold text-white mb-2">Login</Text>
                <Text className="text-base text-gray-500 font-InterSemiBold">
                    Welcome back!
                </Text>
            </View>

            <View className="flex-1">
                <View className="mb-5">
                    <Text className="text-sm text-white mb-2 font-Inter">Email</Text>
                    <TextInput
                        className="bg-zinc-900 rounded-lg px-4 py-3 text-base text-white"
                        placeholder="bonie.green@gmail.com"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(value) => setForm({...form, email: value})}
                    />
                </View>

                <View className="mb-5">
                    <Text className="text-sm text-white mb-2 font-Inter">Password</Text>
                    <View className="relative">
                        <TextInput
                            className="bg-zinc-900 rounded-lg px-4 py-3 text-base text-white pr-12"
                            placeholder="••••••••••"
                            placeholderTextColor="#666"
                            secureTextEntry={!showPassword}
                            value={form.password}
                            onChangeText={(value) => setForm({ ...form, password: value })}
                        />
                        <Pressable
                            className="absolute right-3 top-3"
                            onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <EyeOff size={20} color="#666" />
                            ) : (
                                <Eye size={20} color="#666" />
                            )}
                        </Pressable>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center">
                        <Pressable
                            className="w-5 h-5 border-2 border-gray-500 rounded mr-2.5"
                            onPress={() => setAgreedToTerms(!agreedToTerms)}
                        >
                            <View
                                className={`flex-1 m-0.5 rounded ${agreedToTerms ? 'bg-primary-100' : ''}`}
                            />
                        </Pressable>
                        <Text className="text-white font-InterSemiBold">Remember me</Text>
                    </View>

                    <Link href="/(auth)/reset-password" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary-100">Forgot password</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                <TouchableOpacity className='bg-primary-100 rounded-lg px-4 py-4 items-center mb-2'
                    // onPress={() => router.push('/(tabs)/overview')}
                    onPress={onSignInPress}
                >
                    <Text className='text-base text-black font-InterSemiBold'>Log in</Text>
                </TouchableOpacity>
                <View className='items-center'>
                    <Text className='text-white font-InterSemiBold'>Don't have an account?<Link href='/(auth)/signup' className='text-primary-100 font-InterSemiBold'> Create Account</Link></Text>
                </View>

                <View className='flex-1' />

                <View className='mb-7'>
                    <OAuth isSignUp={false} />
                </View>

            </View>
        </View>
    );
}