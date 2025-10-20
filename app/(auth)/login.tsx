import { useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    Alert,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { ChevronDown, Eye, EyeOff } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import OAuth from '@/components/OAuth'; // Ensure OAuth component accepts the 'entry' prop
import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '@/lib/useWarmUpBrowser';
import { LogoDropdown } from '@/components/LogoDropdown';
import { usePostHogTracking } from '@/hooks/usePostHogTracking'; // Add PostHog tracking

export default function LoginScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { trackScreenView, trackAuthAction, trackError } = usePostHogTracking(); // Add tracking hooks
    
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

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

    // Track screen view when component mounts
    useEffect(() => {
        trackScreenView('login_screen');
    }, [trackScreenView]);

    const onGoogleSignInPress = useCallback(async () => {
        if (!isLoaded) return;

        trackAuthAction('google_login_attempted', { method: 'google_oauth' });

        setGoogleLoading(true);
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();

            if (createdSessionId) {
                await setActive({ session: createdSessionId });
                
                trackAuthAction('login_success', { 
                    method: 'google_oauth',
                    success: true 
                });
                
                router.replace('/(tabs)/overview');
            }
        } catch (err: any) {
            const errorMessage = err.errors ? err.errors[0].longMessage : "Google sign-in failed";
            
            trackAuthAction('login_failed', { 
                method: 'google_oauth',
                success: false,
                error: errorMessage
            });
            
            trackError(errorMessage, {
                screen: 'login',
                function: 'onGoogleSignInPress'
            });
            
            Alert.alert("Error", errorMessage);
            console.error(JSON.stringify(err, null, 2));
        } finally {
            setGoogleLoading(false);
        }
    }, [isLoaded, trackAuthAction, trackError]);

    const onSignInPress = useCallback(async () => {
        if (!isLoaded) return;
        
        trackAuthAction('email_login_attempted', { method: 'email_password' });
        
        console.log('po hin mrena!')
        try {
            console.log('form.email', form.email)
            console.log('form.password', form.password)

            const signInAttempt = await signIn.create({
                identifier: form.email,
                password: form.password,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });
                
                trackAuthAction('login_success', { 
                    method: 'email_password',
                    success: true 
                });
                
                router.replace('/(tabs)/overview');
            } else {
                console.log(JSON.stringify(signInAttempt, null, 2));
                
                trackAuthAction('login_failed', { 
                    method: 'email_password',
                    success: false,
                    error: 'Login incomplete'
                });
                
                Alert.alert("Error", "Log in failed. Please try again.")
            }
        } catch (error: any) {
            console.log(JSON.stringify(error, null, 2));
            const errorMessage = error.errors[0].longMessage;
            
            trackAuthAction('login_failed', { 
                method: 'email_password',
                success: false,
                error: errorMessage
            });
            
            trackError(errorMessage, {
                screen: 'login',
                function: 'onSignInPress'
            });
            
            Alert.alert("Error", errorMessage)
        }
    }, [isLoaded, form, trackAuthAction, trackError])

    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    const closeDropdown = () => {
        setIsDropdownVisible(false);
    }

    return (
        <View className="flex-1 bg-black px-5">
            <View className="pt-12">
                <LogoDropdown />
            </View>
            <View className="mt-5 mb-8">
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
                        onChangeText={(value) => setForm({ ...form, email: value })}
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

                <TouchableOpacity
                    className='bg-primary-100 rounded-lg px-4 py-4 items-center mb-2'
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