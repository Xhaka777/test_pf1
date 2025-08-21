import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { clerkTokenManager } from '@/utils/clerk-token-manager';

type FetchApiOptions = AxiosRequestConfig & {
  formData?: FormData;
  returnMethod?: 'json' | 'blob';
};

export function useAuthenticatedApi<T>() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchFromApi = async (
    endpoint: string,
    options: FetchApiOptions = {},
  ): Promise<T> => {
    const { formData, returnMethod, body, data, ...axiosOptions } = options;

    if (!isLoaded) {
      console.warn('[API] Clerk not loaded yet');
      throw new Error('Authentication not initialized. Please wait...');
    }

    if (!isSignedIn) {
      console.warn('[API] User not signed in');
      throw new Error('User not authenticated. Please sign in.');
    }

    // Use the enhanced token manager for fast token retrieval
    let clerkToken: string | null = null;
    try {
      clerkToken = await clerkTokenManager.getToken(getToken);
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
      hasData: !!requestData
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
        
        if (status === 401 || status === 403) {
          // Token might be invalid, force refresh on next call
          await clerkTokenManager.clearCache();
          throw new Error('Authentication failed. Please sign in again.');
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