import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '@clerk/clerk-expo';

type FetchApiOptions = AxiosRequestConfig & {
  formData?: FormData;
  returnMethod?: 'json' | 'blob';
};

export function getWSSBaseUrl() {
  const baseUrl = process.env.PUBLIC_SERVER_URL;
  return baseUrl?.replace(/^http/, 'ws')

}

export function useAuthenticatedApi<T>() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchFromApi = async (
    endpoint: string,
    options: FetchApiOptions = {},
  ): Promise<T> => {
    const { formData, returnMethod, ...axiosOptions } = options;

    if (!isLoaded || !isSignedIn) {
      throw new Error('Unauthorized: User not authenticated.');
    }

    const clerkToken = await getToken();
    if (!clerkToken) {
      throw new Error('Clerk token not available.');
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
      data: formData || axiosOptions.data,
      // baseURL: 'https://staging-server.propfirmone.com',
      baseURL: process.env.PUBLIC_SERVER_URL,
      url: endpoint,
      responseType: returnMethod === 'blob' ? 'blob' : 'json',
    };

    try {
      const response: AxiosResponse<T> = await axios(axiosConfig);
      console.log('API Response:', response);

      return returnMethod === 'blob' ? response.data : response.data;
    } catch (error) {
      console.error(`API call failed (${endpoint}):`, error);

      // Better error handling with axios
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        const status = error.response?.status || 0;
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