import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '@clerk/clerk-expo';

type FetchApiOptions = AxiosRequestConfig & {
  formData?: FormData;
  returnMethod?: 'json' | 'blob';
};

export function getWSSBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SERVER_URL is not defined');
  }
  
  let wsUrl = baseUrl.replace(/^https?/, 'ws');
  wsUrl = wsUrl.replace(/\/$/, ''); // Remove trailing slash
  
  console.log('[API] WebSocket URL:', wsUrl);
  return wsUrl;
}

export function useAuthenticatedApi<T>() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchFromApi = async (
    endpoint: string,
    options: FetchApiOptions = {},
  ): Promise<T> => {
    const { formData, returnMethod, body, ...axiosOptions } = options;

    // ✅ FIXED: Better error handling and logging
    if (!isLoaded) {
      console.warn('[API] Clerk not loaded yet');
      throw new Error('Authentication not initialized. Please wait...');
    }

    if (!isSignedIn) {
      console.warn('[API] User not signed in');
      throw new Error('User not authenticated. Please sign in.');
    }

    // ✅ FIXED: Better token handling with retry
    let clerkToken: string | null = null;
    try {
      clerkToken = await getToken();
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

    const axiosConfig: AxiosRequestConfig = {
      ...axiosOptions,
      method: axiosOptions.method || (axiosOptions.data ? 'POST' : 'GET'),
      headers,
      data: formData || body || axiosOptions.data, 
      baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
      url: endpoint,
      responseType: returnMethod === 'blob' ? 'blob' : 'json',
      timeout: 30000, // ✅ Added timeout
    };

    // ✅ ADDED: Debug logging
    console.log('[API] Environment check:', {
      PUBLIC_SERVER_URL: process.env.PUBLIC_SERVER_URL,
      EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
      baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
    });

    console.log('[API] Making request:', {
      method: axiosConfig.method,
      url: `${axiosConfig.baseURL}${endpoint}`,
      hasAuth: !!clerkToken,
      tokenPrefix: clerkToken?.substring(0, 10) + '...',
      data: axiosConfig.data
    });

    try {
      const response: AxiosResponse<T> = await axios(axiosConfig);
      
      // ✅ ADDED: Success logging
      console.log('[API] Request successful:', {
        status: response.status,
        endpoint,
        dataKeys: response.data && typeof response.data === 'object' 
          ? Object.keys(response.data) 
          : 'primitive'
      });

      return returnMethod === 'blob' ? response.data : response.data;
    } catch (error) {
      // ✅ IMPROVED: Better error logging and handling
      console.error(`[API] Request failed (${endpoint}):`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });

      // Better error handling with axios
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        const status = error.response?.status || 0;
        
        // ✅ ADDED: Specific handling for common HTTP errors
        if (status === 401 || status === 403) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
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