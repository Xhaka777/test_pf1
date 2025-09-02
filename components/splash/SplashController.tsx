import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { SplashManager } from '@/utils/splash-manager';

interface SimpleSplashControllerProps {
  children: React.ReactNode;
}

export function SimpleSplashController({ children }: SimpleSplashControllerProps) {
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(false);
  const [splashChecked, setSplashChecked] = useState(false);

  useEffect(() => {
    const checkSplash = async () => {
      try {
        // Small delay to ensure app is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const shouldShow = await SplashManager.getInstance().shouldShowAnimatedSplash();
        setShowAnimatedSplash(shouldShow);
        setSplashChecked(true);
      } catch (error) {
        console.error('[SimpleSplashController] Error:', error);
        setSplashChecked(true);
      }
    };

    checkSplash();
  }, []);

  const handleAnimationComplete = async () => {
    await SplashManager.getInstance().markAnimatedSplashShown();
    setShowAnimatedSplash(false);
  };

  // Still checking what to show
  if (!splashChecked) {
    return null; // Let the native splash continue showing
  }

  // Show animated splash
  if (showAnimatedSplash) {
    return (
      <View style={styles.container}>
        <LottieView
          source={require('../../assets/animations/splash-animation.json')}
          style={styles.animation}
          autoPlay
          loop={false}
          onAnimationFinish={handleAnimationComplete}
        />
      </View>
    );
  }

  // Show the main app
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100E0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
});
