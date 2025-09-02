// utils/splash-manager.ts - FIXED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const SPLASH_KEYS = {
  FIRST_LAUNCH: 'app_first_launch',
  LAST_VERSION: 'app_last_version',
  LAST_ANIMATED_SPLASH: 'last_animated_splash'
};

export class SplashManager {
  private static instance: SplashManager;
  
  public static getInstance(): SplashManager {
    if (!SplashManager.instance) {
      SplashManager.instance = new SplashManager();
    }
    return SplashManager.instance;
  }

  /**
   * Determines if animated splash should be shown
   */
  public async shouldShowAnimatedSplash(): Promise<boolean> {
    try {
      const [isFirstLaunch, hasVersionChanged, lastAnimatedDate] = await Promise.all([
        this.isFirstLaunch(),
        this.hasVersionChanged(),
        this.getLastAnimatedSplashDate()
      ]);

      // Show animated splash if:
      // 1. First time opening the app
      // 2. App was updated
      // 3. Haven't shown animated splash in last 7 days (optional)
      
      if (isFirstLaunch || hasVersionChanged) {
        return true;
      }

      // Optional: Show animated splash once per week for engagement
      if (lastAnimatedDate && this.daysSince(lastAnimatedDate) >= 7) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SplashManager] Error determining splash type:', error);
      return false; // Default to static splash on error
    }
  }

  private async isFirstLaunch(): Promise<boolean> {
    const firstLaunch = await AsyncStorage.getItem(SPLASH_KEYS.FIRST_LAUNCH);
    if (!firstLaunch) {
      await AsyncStorage.setItem(SPLASH_KEYS.FIRST_LAUNCH, 'false');
      return true;
    }
    return false;
  }

  private async hasVersionChanged(): Promise<boolean> {
    // Use Expo Constants instead of requiring package.json
    const currentVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
    const lastVersion = await AsyncStorage.getItem(SPLASH_KEYS.LAST_VERSION);
    
    if (lastVersion !== currentVersion) {
      await AsyncStorage.setItem(SPLASH_KEYS.LAST_VERSION, currentVersion);
      return true;
    }
    return false;
  }

  private async getLastAnimatedSplashDate(): Promise<Date | null> {
    const dateString = await AsyncStorage.getItem(SPLASH_KEYS.LAST_ANIMATED_SPLASH);
    return dateString ? new Date(dateString) : null;
  }

  public async markAnimatedSplashShown(): Promise<void> {
    await AsyncStorage.setItem(SPLASH_KEYS.LAST_ANIMATED_SPLASH, new Date().toISOString());
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}