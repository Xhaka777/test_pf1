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

  // Clerk tokens typically last 1 hour, but we'll refresh at 50 minutes to be safe
  private readonly TOKEN_LIFETIME_MS = 50 * 60 * 1000; // 50 minutes
  private readonly STORAGE_KEY = 'clerk_token_persistent';
  private readonly BUFFER_TIME_MS = 5 * 60 * 1000; // 5 minutes buffer

  private constructor() { }

  public static getInstance(): ClerkTokenManager {
    if (!ClerkTokenManager.instance) {
      ClerkTokenManager.instance = new ClerkTokenManager();
    }
    return ClerkTokenManager.instance;
  }

  /**
   * Initialize the token manager - call this early in app lifecycle
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // console.log('[ClerkTokenManager] Initializing...');

      // Try to load existing token from storage
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);

      if (storedData) {
        const parsed: TokenData = JSON.parse(storedData);

        // Check if token is still valid (not expired + buffer)
        const now = Date.now();
        const isValid = now < (parsed.expiresAt - this.BUFFER_TIME_MS);

        if (isValid) {
          this.tokenData = parsed;
          // console.log('[ClerkTokenManager] Loaded valid token from storage');
          // console.log('[ClerkTokenManager] Token expires in:', Math.round((parsed.expiresAt - now) / 60000), 'minutes');
        } else {
          // console.log('[ClerkTokenManager] Stored token expired, will refresh');
          await AsyncStorage.removeItem(this.STORAGE_KEY);
        }
      } else {
        console.log('[ClerkTokenManager] No stored token found');
      }

      this.isInitialized = true;
    } catch (error) {
      // console.error('[ClerkTokenManager] Initialization error:', error);
      this.isInitialized = true; // Don't block the app
    }
  }

  /**
   * Get a valid token - returns immediately if cached, otherwise fetches new one
   */
  public async getToken(getClerkTokenFn: () => Promise<string | null>): Promise<string | null> {
    await this.initialize();

    // If we have a valid cached token, return it immediately
    if (this.hasValidToken()) {
      // console.log('[ClerkTokenManager] Returning cached token');
      return this.tokenData!.token;
    }

    // Need to fetch a new token
    // console.log('[ClerkTokenManager] Fetching new token from Clerk');
    return this.refreshToken(getClerkTokenFn);
  }

  /**
   * Check if current token is valid
   */
  private hasValidToken(): boolean {
    if (!this.tokenData) return false;

    const now = Date.now();
    const isNotExpired = now < (this.tokenData.expiresAt - this.BUFFER_TIME_MS);

    return isNotExpired;
  }

  /**
   * Refresh the token from Clerk and persist it
   */
  public async refreshToken(getClerkTokenFn: () => Promise<string | null>): Promise<string | null> {
    try {
      const newToken = await getClerkTokenFn();

      if (!newToken) {
        // console.warn('[ClerkTokenManager] Clerk returned null token');
        return null;
      }

      // Create new token data
      const now = Date.now();
      const newTokenData: TokenData = {
        token: newToken,
        issuedAt: now,
        expiresAt: now + this.TOKEN_LIFETIME_MS,
      };

      // Update memory cache
      this.tokenData = newTokenData;

      // Persist to storage
      await this.persistToken(newTokenData);

      // console.log('[ClerkTokenManager] New token cached and persisted');
      // console.log('[ClerkTokenManager] Token expires in:', Math.round(this.TOKEN_LIFETIME_MS / 60000), 'minutes');

      return newToken;
    } catch (error) {
      // console.error('[ClerkTokenManager] Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Persist token to storage
   */
  private async persistToken(tokenData: TokenData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
    } catch (error) {
      // console.error('[ClerkTokenManager] Error persisting token:', error);
      // Don't throw - token is still in memory
    }
  }

  /**
   * Force refresh token (useful when you know it's invalid)
   */
  public async forceRefresh(getClerkTokenFn: () => Promise<string | null>): Promise<string | null> {
    // console.log('[ClerkTokenManager] Force refresh requested');
    this.tokenData = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    return this.refreshToken(getClerkTokenFn);
  }

  /**
   * Clear all cached data
   */
  public async clearCache(): Promise<void> {
    // console.log('[ClerkTokenManager] Clearing cache');
    this.tokenData = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get token info for debugging
   */
  public getTokenInfo(): { hasToken: boolean; expiresIn?: number; isValid?: boolean } {
    if (!this.tokenData) {
      return { hasToken: false };
    }

    const now = Date.now();
    const expiresIn = Math.max(0, this.tokenData.expiresAt - now);
    const isValid = this.hasValidToken();

    return {
      hasToken: true,
      expiresIn: Math.round(expiresIn / 60000), // in minutes
      isValid
    };
  }
}

export const clerkTokenManager = ClerkTokenManager.getInstance();