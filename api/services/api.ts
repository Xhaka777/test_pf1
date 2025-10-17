import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '@clerk/clerk-expo';
import { clerkTokenManager } from '@/utils/clerk-token-manager';

export function getAPIBaseUrl() {
  return process.env.EXPO_PUBLIC_SERVER_URL;
}

type FetchApiOptions = AxiosRequestConfig & {
  formData?: FormData;
  returnMethod?: 'json' | 'blob';
  _retryCount?: number;
};

const MAX_AUTH_RETRIES = 2;

export function useAuthenticatedApi<T>() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchFromApi = async (
    endpoint: string,
    options: FetchApiOptions = {},
  ): Promise<T> => {
    const {
      formData,
      returnMethod = 'json',
      body,
      data,
      _retryCount = 0,
      ...axiosOptions
    } = options;

    if (!isLoaded) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isLoaded) {
        throw new Error('Authentication is still loading. Please try again.');
      }
    }

    if (!isSignedIn) {
      throw new Error('Please sign in to continue.');
    }

    let clerkToken: string | null;

    try {
      // ✅ Add more debugging and better token handling
      console.log('[API] Requesting token from Clerk...');

      clerkToken = await clerkTokenManager.getToken(async () => {
        const token = await getToken({ skipCache: _retryCount > 0 });
        console.log('[API] Clerk token received:', token ? 'SUCCESS' : 'NULL');
        return token;
      });

      if (!clerkToken) {
        console.error('[API] ClerkTokenManager returned null token');
        throw new Error('Could not obtain authentication token.');
      }

    } catch (tokenError) {
      console.error('[API] Token fetch failed:', tokenError);
      throw new Error('Authentication error. Please sign in again.');
    }

    if (!clerkToken) {
      throw new Error('Could not obtain authentication token.');
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
      baseURL: getAPIBaseUrl(),
      url: endpoint,
      responseType: returnMethod === 'blob' ? 'blob' : 'json',
      timeout: 30000,
      validateStatus: (status) => status < 500,
    };

    try {
      const response: AxiosResponse<T> = await axios(axiosConfig);

      if (response.status === 401 || response.status === 403) {
        console.warn(`[API] ${response.status} error on ${endpoint}`);

        if (_retryCount < MAX_AUTH_RETRIES) {
          console.log(`[API] Auto-retry ${_retryCount + 1}/${MAX_AUTH_RETRIES}`);

          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 300));

          return fetchFromApi(endpoint, {
            ...options,
            _retryCount: _retryCount + 1,
          });
        }

        // Max retries exceeded
        await clerkTokenManager.clearCache();
        throw new Error('Session expired. Please sign in again.');
      }

      if (response.status >= 400) {
        const errorMessage =
          response.data?.message ||
          response.data?.error ||
          `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        // Auto-retry auth errors
        if ((status === 401 || status === 403) && _retryCount < MAX_AUTH_RETRIES) {
          console.log('[API] Caught auth error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 300));

          return fetchFromApi(endpoint, {
            ...options,
            _retryCount: _retryCount + 1,
          });
        }

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Request failed';

        throw new Error(errorMessage);
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