class WebSocketTokenManager {
    private static instance: WebSocketTokenManager;
    private tokenCache: { token: string; expiresAt: number } | null = null;
    private tokenPromise: Promise<string> | null = null;
  
    private constructor() {}
  
    public static getInstance(): WebSocketTokenManager {
      if (!WebSocketTokenManager.instance) {
        WebSocketTokenManager.instance = new WebSocketTokenManager();
      }
      return WebSocketTokenManager.instance;
    }
  
    public async getToken(getClerkToken: () => Promise<string | null>): Promise<string> {
      // If we already have a valid token, return it
      if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - 2000) { // 2 second buffer
        console.log('[TokenManager] Using cached token');
        return this.tokenCache.token;
      }
  
      // If there's already a token request in progress, wait for it
      if (this.tokenPromise) {
        console.log('[TokenManager] Waiting for existing token request');
        return this.tokenPromise;
      }
  
      // Create new token request
      console.log('[TokenManager] Requesting new token');
      this.tokenPromise = this.fetchNewToken(getClerkToken);
  
      try {
        const token = await this.tokenPromise;
        return token;
      } finally {
        this.tokenPromise = null;
      }
    }
  
    private async fetchNewToken(getClerkToken: () => Promise<string | null>): Promise<string> {
      const clerkToken = await getClerkToken();
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
  
      // Cache the token (expires in 10 seconds according to docs)
      this.tokenCache = {
        token: data.token,
        expiresAt: Date.now() + 8000 // 8 seconds to be safe
      };
  
      console.log('[TokenManager] New token cached');
      return data.token;
    }
  
    public clearCache(): void {
      console.log('[TokenManager] Clearing token cache');
      this.tokenCache = null;
      this.tokenPromise = null;
    }
  }
  
  export const tokenManager = WebSocketTokenManager.getInstance();