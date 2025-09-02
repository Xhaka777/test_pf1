import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

export function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Hide the native splash screen once our component is ready
    SplashScreen.hideAsync();
    
    // Start the animation
    animationRef.current?.play();
  }, []);

  const handleAnimationFinish = () => {
    console.log('[AnimatedSplash] Animation completed');
    onAnimationFinish();
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/splash-animation.json')}
        style={styles.animation}
        autoPlay={true}
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100E0F', // Match your app's background
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: Dimensions.get('window').width * 0.8,
    height: Dimensions.get('window').width * 0.8,
  },
});

