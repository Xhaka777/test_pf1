
import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, Touchable, Image, Button, Alert, Pressable } from 'react-native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import icons from '@/constants/icons';
import { Stack, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';

const ResetPasswordScreen = ({ navigation }) => {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [activeStep, setActiveStep] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  //Request a password reset code by email
  const onRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;

      setIsLoading(true);
    }
    try {
      await signIn!.create({
        strategy: 'reset_password_email_code',
        identifier: email
      });
      setSuccessfulCreation(true);
      setActiveStep(2);
    } catch (error: any) {
      alert(error.errors[0].message);
    } finally {
      setIsLoading(false);
    }
  }

  //Reset the password with the code and the new password
  const onReset = async () => {
    if (!code || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields')
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', "Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn!.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password
      });

      Alert.alert('Success', 'Password reset successfully');
      router.replace('/(auth)/login');
      // console.log(result);
      // alert('Password reset successfully');
      //Set the user session active, which will log in the user automatically

      // await setActive!({ session: result.createdSessionId })
    } catch (error: any) {
      alert(error.errors[0].message)
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View className='flex-1 bg-black px-5'>
      <View className='mt-14 mb-2'>
        <TouchableOpacity
          onPress={() => router.back()}
          className='flex flex-row items-center mb-6'
        >
          <Image
            source={icons.leftArrow}
            resizeMode='contain'
            className='w-5 h-5'
          />
          <Text className='text-white text-base flex-1 text-center font-Inter'>Back to Login</Text>
        </TouchableOpacity>
        <Text className='text-white text-2xl font-InterBold mb-2'>Reset Your Password</Text>
      </View>

      {activeStep === 1 ? (
        //Step 1: Email input
        <>
          <Text className='text-gray-400 text-sm mb-6 font-Inter'>
            Enter the email associated with your account to receive a verification code.
          </Text>
          <View className='mb-5'>
            <Text className='text-sm text-white mb-2 font-Inter'>Email Address</Text>
            <TextInput
              className='bg-zinc-900 text-white rounded-lg px-4 py-3'
              value={email}
              onChangeText={setEmail}
              placeholder='your.email@example.com'
              placeholderTextColor="#666"
              keyboardType='email-address'
              autoCapitalize='none'
            />
          </View>
          <TouchableOpacity
            className='bg-primary rounded-lg px-4 py-4 items-center mb-4'
            onPress={onRequestReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#000' />
            ) : (
              <Text className='text-black font-bold'>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className='text-gray-400 text-sm mb-6 font-InterSemiBold'>
            Create and confirm your new password.
          </Text>
          <View className='mb-5'>
            <Text className='text-sm text-white mb-2 font-Inter'>Verification Code</Text>
            <TextInput
              className='bg-zinc-900 text-white rounded-lg px-4 py-3'
              value={code}
              onChangeText={setCode}
              placeholder='123456'
              placeholderTextColor='#666'
              keyboardType='numeric'
              maxLength={6}
            />
          </View>

          <View className='mb-5'>
            <Text className='text-sm text-white mb-2 font-Inter'>New Password</Text>
            <View className='relative'>
              <TextInput
                className='bg-zinc-900 text-white rounded-lg px-4 py-3'
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder='••••••'
                placeholderTextColor='#666'
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
            <Text className='text-gray-500 text-xs font-Inter'>
              Must be at least 8 characters
            </Text>
          </View>

          <View className='mb-6'>
            <Text className='text-sm text-white mb-2 font-Inter'>Confirm New Password</Text>
            <View className='relative'>
              <TextInput
                className='bg-zinc-900 text-white rounded-lg px-4 py-3'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder='••••••'
                placeholderTextColor='#666'
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className='bg-primary rounded-lg px-4 py-4 items-center mb-4'
            onPress={onReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='#000' />
            ) : (
              <Text className='text-black font-InterBold'>Reset Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveStep(1)}
          >
            <Text className='text-primary text-center font-InterSemiBold'>
              Didn't receive a code? Resend
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

export default ResetPasswordScreen