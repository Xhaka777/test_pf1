import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  Button,
  StyleSheet,
  Linking
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Link, router, Stack } from 'expo-router';
import OAuth from '@/components/OAuth';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { ReactNativeModal } from "react-native-modal";
import { LogoDropdown } from '@/components/LogoDropdown';

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const openTermsOfService = () => {
    Linking.openURL('https://propfirmone.com/terms-of-service');
  }

  const openPrivacyPolicy = () => {
    Linking.openURL('https://propfirmone.com/privacy-policy')
  }

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (!agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the Terms of Use and Privacy Policy");
      return;
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        // firstName: form.name.split(" ")[0]
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      console.log(JSON.stringify(err, null, 2));
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        // Smooth navigation after session is ready
        setTimeout(() => {
          router.replace("/(tabs)/overview");
        }, 300);
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors?.[0]?.longMessage ?? "An error occurred",
        state: "failed",
      });
    }
  };


  return (
    <View className="flex-1 bg-black px-5">
      {/* Main Sign Up Form */}
      {verification.state !== "pending" && (
        <>
          <View className="pt-12 pb-4">
            <LogoDropdown />
          </View>

          <View className="mt-5 mb-8">
            <Text className="text-2xl font-InterBold text-white mb-2">Create Account</Text>
            <Text className="text-base text-gray-500 font-InterSemiBold">
              Unlock limitless trading opportunities.
            </Text>
          </View>

          <View className="flex-1">
            <View className="mb-5">
              <Text className="text-sm text-white mb-2 font-InterSemiBold">Full Name</Text>
              <TextInput
                className="bg-zinc-900 rounded-lg px-4 py-3 text-base text-white"
                placeholder="Bonnie Green"
                placeholderTextColor="#666"
                value={form.name}
                onChangeText={(value) => setForm({ ...form, name: value })}
              />
            </View>

            <View className="mb-5">
              <Text className="text-sm text-white mb-2 font-InterSemiBold">Email</Text>
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
              <Text className="text-sm text-white mb-2 font-InterSemiBold">Password</Text>
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

            <View className="flex-row items-start mb-5">
              <Pressable
                className="w-5 h-5 border-2 border-gray-500 rounded mr-2.5 mt-0.5"
                onPress={() => setAgreedToTerms(!agreedToTerms)}>
                <View
                  className={`flex-1 m-0.5 rounded ${agreedToTerms ? 'bg-primary-100' : ''
                    }`}
                />
              </Pressable>
              <Text className="flex-1 text-gray-500 leading-5 font-InterSemiBold">
                By signing up, you agree to our{' '}
                <Text
                  className="text-primary-100 font-Inter"
                  onPress={openTermsOfService}
                >
                  Terms of Use
                </Text> and{' '}
                <Text
                  className="text-primary-100 font-Inter"
                  onPress={openPrivacyPolicy}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary-100 rounded-lg px-4 py-4 items-center mb-2"
              onPress={onSignUpPress}
            >
              <Text className="text-base font-InterBold text-black">Sign Up</Text>
            </TouchableOpacity>
            <View className='items-center'>
              <Text className='text-white font-InterBold'>Already have an account?<Link href='/(auth)/login' className='text-primary-100 font-InterBold'> Log in</Link></Text>
            </View>

            <View className='flex-1' />

            <View className='mb-7'>
              <OAuth isSignUp={true} />
            </View>
          </View>
        </>
      )}

      {/* Verification Modal */}
      <ReactNativeModal isVisible={verification.state === "pending"}>
        <View className="bg-zinc-900 px-7 py-9 rounded-2xl min-h-[300px]">
          <Text className="font-InterBold text-2xl mb-2 text-white">Verification</Text>
          <Text className="text-gray-400 mb-5 font-InterSemiBold">
            We've sent a verification code to {form.email}.
          </Text>
          <View className="mb-5">
            <Text className="text-sm text-white mb-2 font-InterSemiBold">Verification Code</Text>
            <TextInput
              className="bg-zinc-800 rounded-lg px-4 py-3 text-base text-white"
              placeholder="123456"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={verification.code}
              onChangeText={(code) => setVerification({ ...verification, code })}
            />
          </View>
          {verification.error && (
            <Text className="text-red-500 text-sm mt-1 font-InterSemiBold">
              {verification.error}
            </Text>
          )}
          <TouchableOpacity
            className="bg-primary-100 rounded-lg px-4 py-4 items-center mt-5"
            onPress={onPressVerify}
          >
            <Text className="text-base font-InterBold text-black">Verify Email</Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>

      {/* Success Modal */}
      <ReactNativeModal isVisible={showSuccessModal}>
        <View className="bg-zinc-900 px-7 py-9 rounded-2xl min-h-[300px] items-center justify-center">
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-5">
            <Text className="text-4xl">✓</Text>
          </View>
          <Text className="text-3xl font-InterBold text-white text-center mb-2">Verified</Text>
          <Text className="text-base text-gray-400 text-center font-InterSemiBold">
            You have successfully verified your account.
          </Text>
          <TouchableOpacity
            className="bg-primary-100 rounded-lg px-4 py-4 items-center w-full mt-8"
            onPress={() => router.push(`/(tabs)/overview`)}
          >
            <Text className="text-base font-InterBold text-black">Browse Home</Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: '#6c47ff',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#fff'
  },
  button: {
    margin: 8,
    alignItems: 'center'
  }
});
