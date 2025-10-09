import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { clerkTokenManager } from '@/utils/clerk-token-manager';

type FetchApiOptions = AxiosRequestConfig & {
  formData?: FormData;
  returnMethod?: 'json' | 'blob';
  _retryCount?: number; // Internal retry counter
};

const MAX_RETRY_ATTEMPTS = 1; // Only retry once for 401

export function useAuthenticatedApi<T>() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();

  const fetchFromApi = async (
    endpoint: string,
    options: FetchApiOptions = {},
  ): Promise<T> => {
    const { 
      formData, 
      returnMethod, 
      body, 
      data, 
      _retryCount = 0,
      ...axiosOptions 
    } = options;

    if (!isLoaded) {
      console.warn('[API] Clerk not loaded yet');
      throw new Error('Authentication not initialized. Please wait...');
    }

    if (!isSignedIn) {
      console.warn('[API] User not signed in');
      throw new Error('User not authenticated. Please sign in.');
    }

    // Get token (with retry logic for 401)
    let clerkToken: string | null = null;
    try {
      // If this is a retry after 401, force a fresh token
      const shouldForceRefresh = _retryCount > 0;
      
      if (shouldForceRefresh) {
        console.log('[API] 🔄 Forcing token refresh after 401...');
        await clerkTokenManager.clearCache();
        clerkToken = await getToken({ skipCache: true });
      } else {
        clerkToken = await clerkTokenManager.getToken(getToken);
      }
    } catch (tokenError) {
      console.error('[API] Failed to get Clerk token:', tokenError);
      throw new Error('Failed to get authentication token');
    }

    if (!clerkToken) {
      console.error('[API] Clerk token is null');
      throw new Error('Authentication token not available');
    }

    const headers = {
      ...(formData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${clerkToken}`,
      ...(axiosOptions.headers || {}),
    };

    const requestData = data || formData || (body ? JSON.parse(body) : undefined);

    const axiosConfig: AxiosRequestConfig = {
      ...axiosOptions,
      method: axiosOptions.method || (requestData ? 'POST' : 'GET'),
      headers,
      data: requestData,
      baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
      url: endpoint,
      responseType: returnMethod === 'blob' ? 'blob' : 'json',
      timeout: 30000,
      validateStatus: (status) => status < 500,
    };

    console.log('[API] Making request:', {
      method: axiosConfig.method,
      url: `${axiosConfig.baseURL}${endpoint}`,
      hasAuth: !!clerkToken,
      tokenPrefix: clerkToken?.substring(0, 10) + '...',
      hasData: !!requestData,
      retryCount: _retryCount,
    });

    try {
      const response: AxiosResponse<T> = await axios(axiosConfig);
      
      console.log('[API] Request successful:', {
        status: response.status,
        endpoint,
        dataKeys: response.data && typeof response.data === 'object' 
          ? Object.keys(response.data) 
          : 'primitive'
      });

      // ✨ AUTOMATIC TOKEN REFRESH LOGIC ✨
      if (response.status === 401) {
        console.warn('[API] 🔐 Received 401 Unauthorized');
        
        // Check if we should retry
        if (_retryCount < MAX_RETRY_ATTEMPTS) {
          console.log('[API] 🔄 Attempting automatic token refresh and retry...');
          
          // Recursive call with incremented retry count
          return fetchFromApi(endpoint, {
            ...options,
            _retryCount: _retryCount + 1,
          });
        } else {
          // Max retries reached - sign out user
          console.error('[API] ❌ Token refresh failed after retries. Signing out...');
          await clerkTokenManager.clearCache();
          
          // Sign out the user
          try {
            await signOut();
          } catch (signOutError) {
            console.error('[API] Error during sign out:', signOutError);
          }
          
          throw new Error('Session expired. Please sign in again.');
        }
      }

      if (response.status === 403) {
        console.warn('[API] 🚫 Received 403 Forbidden');
        throw new Error('Access denied. You do not have permission to access this resource.');
      }

      if (response.status >= 400) {
        const errorMessage = response.data?.message || `HTTP ${response.status} error`;
        throw new Error(errorMessage);
      }

      return returnMethod === 'blob' ? response.data : response.data;
    } catch (error) {
      console.error(`[API] Request failed (${endpoint}):`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        const status = error.response?.status || 0;
        
        // Handle 401 in error response (shouldn't reach here due to validateStatus, but just in case)
        if (status === 401 && _retryCount < MAX_RETRY_ATTEMPTS) {
          console.log('[API] 🔄 Caught 401 in error handler, retrying...');
          return fetchFromApi(endpoint, {
            ...options,
            _retryCount: _retryCount + 1,
          });
        }
        
        if (status === 401) {
          await clerkTokenManager.clearCache();
          try {
            await signOut();
          } catch (signOutError) {
            console.error('[API] Error during sign out:', signOutError);
          }
          throw new Error('Session expired. Please sign in again.');
        } else if (status === 403) {
          throw new Error('Access denied. You do not have permission.');
        } else if (status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        } else if (status === 429) {
          throw new Error('Too many requests. Please try again later.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(`API Error (${status}): ${errorMessage}`);
      }

      throw error;
    }
  };

  return { fetchFromApi, isLoaded, isSignedIn };
}

export enum StatusEnum {
  SUCCESS = 'success',
  ERROR = 'error'
}
