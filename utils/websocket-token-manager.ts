import { clerkTokenManager } from './clerk-token-manager';

class WebSocketTokenManager {
  private static instance: WebSocketTokenManager;
  private wsTokenCache: { token: string; expiresAt: number } | null = null;
  private tokenPromise: Promise<string> | null = null;

  private constructor() { }

  public static getInstance(): WebSocketTokenManager {
    if (!WebSocketTokenManager.instance) {
      WebSocketTokenManager.instance = new WebSocketTokenManager();
    }
    return WebSocketTokenManager.instance;
  }

  public async getToken(getClerkToken: () => Promise<string | null>): Promise<string> {
    // Check if we have a valid WebSocket token
    if (this.wsTokenCache && Date.now() < this.wsTokenCache.expiresAt - 2000) {
      // console.log('[WSTokenManager] Using cached WebSocket token');
      return this.wsTokenCache.token;
    }

    // If there's already a token request in progress, wait for it
    if (this.tokenPromise) {
      // console.log('[WSTokenManager] Waiting for existing WebSocket token request');
      return this.tokenPromise;
    }

    // Create new token request using the enhanced Clerk token
    // console.log('[WSTokenManager] Requesting new WebSocket token');
    this.tokenPromise = this.fetchNewToken(getClerkToken);

    try {
      const token = await this.tokenPromise;
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchNewToken(getClerkToken: () => Promise<string | null>): Promise<string> {
    // Use the enhanced token manager for Clerk token
    const clerkToken = await clerkTokenManager.getToken(getClerkToken);
    if (!clerkToken) throw new Error('No auth token');

    const response = await fetch(`${process.env.EXPO_PUBLIC_SERVER_URL}/generate_ws_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 429) {
      throw new Error('Rate limited - too many token requests. Please wait a moment.');
    }

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error('Invalid token response');
    }

    // Cache the WebSocket token (expires in 10 seconds according to docs)
    this.wsTokenCache = {
      token: data.token,
      expiresAt: Date.now() + 8000 // 8 seconds to be safe
    };

    // console.log('[WSTokenManager] New WebSocket token cached');
    return data.token;
  }

  public clearCache(): void {
    // console.log('[WSTokenManager] Clearing WebSocket token cache');
    this.wsTokenCache = null;
    this.tokenPromise = null;
  }
}

export const tokenManager = WebSocketTokenManager.getInstance();