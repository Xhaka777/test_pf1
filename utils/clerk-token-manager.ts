import AsyncStorage from '@react-native-async-storage/async-storage';

interface TokenData {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

class ClerkTokenManager {
  private static instance: ClerkTokenManager;
  private tokenData: TokenData | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private refreshLock: Promise<string | null> | null = null;

  // Clerk JWT tokens last 1 hour, refresh at 55 minutes
  private readonly TOKEN_LIFETIME_MS = 55 * 60 * 1000;
  private readonly STORAGE_KEY = 'clerk_token_cache';
  private readonly SAFETY_BUFFER_MS = 2 * 60 * 1000; // 2 minutes safety buffer

  private constructor() { }

  public static getInstance(): ClerkTokenManager {
    if (!ClerkTokenManager.instance) {
      ClerkTokenManager.instance = new ClerkTokenManager();
    }
    return ClerkTokenManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const parsed: TokenData = JSON.parse(stored);
          if (this.isTokenValid(parsed)) {
            this.tokenData = parsed;
            console.log('[ClerkToken] Restored valid token from cache');
          } else {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('[ClerkToken] Init error:', error);
      } finally {
        this.isInitialized = true;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private isTokenValid(tokenData: TokenData | null): boolean {
    if (!tokenData) return false;
    return Date.now() < (tokenData.expiresAt - this.SAFETY_BUFFER_MS);
  }

  public async getToken(
    getClerkTokenFn: () => Promise<string | null>
  ): Promise<string | null> {
    await this.initialize();

    // Return cached token if valid
    if (this.isTokenValid(this.tokenData)) {
      return this.tokenData!.token;
    }

    // Wait for existing refresh if in progress (prevents duplicate requests)
    if (this.refreshLock) {
      console.log('[ClerkToken] Waiting for active refresh...');
      return this.refreshLock;
    }

    // Start new refresh with lock
    this.refreshLock = this.performRefresh(getClerkTokenFn);

    try {
      return await this.refreshLock;
    } finally {
      this.refreshLock = null;
    }
  }

  private async performRefresh(
    getClerkTokenFn: () => Promise<string | null>
  ): Promise<string | null> {
    try {
      console.log('[ClerkToken] Refreshing token...');
      
      // Get fresh token from Clerk (skipCache ensures fresh token)
      const newToken = await getClerkTokenFn();

      if (!newToken) {
        console.error('[ClerkToken] Clerk returned null token');
        this.tokenData = null;
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        return null;
      }

      const now = Date.now();
      this.tokenData = {
        token: newToken,
        issuedAt: now,
        expiresAt: now + this.TOKEN_LIFETIME_MS,
      };

      // Persist to storage (fire and forget)
      AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tokenData)).catch(
        err => console.error('[ClerkToken] Cache save failed:', err)
      );

      console.log('[ClerkToken] ✅ Token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('[ClerkToken] Refresh failed:', error);
      this.tokenData = null;
      return null;
    }
  }

  public async clearCache(): Promise<void> {
    console.log('[ClerkToken] Clearing cache');
    this.tokenData = null;
    this.refreshLock = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY).catch(() => {});
  }

  public getTokenInfo() {
    if (!this.tokenData) return { hasToken: false };
    
    return {
      hasToken: true,
      isValid: this.isTokenValid(this.tokenData),
      expiresIn: Math.round((this.tokenData.expiresAt - Date.now()) / 60000)
    };
  }
}

export const clerkTokenManager = ClerkTokenManager.getInstance();