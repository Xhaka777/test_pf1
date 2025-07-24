// import { QueryKeys } from "@/api/types";
// import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// import { ReactNode, useState } from "react";
// import { Alert, Platform } from "react-native";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

// //Error types for better error handling
// interface ApiError {
//     status?: number;
//     message?: string;
//     code?: string;
//     errors?: Array<{ message: string }>;
// }

// //check for authentication error here...
// const isAuthError = (error: any): boolean => {
//     if (!error) return false;

//     const authIndicators = [
//         'Unauthorized',
//         'Authentication failed',
//         'Invalid token',
//         'Token expired',
//         'Access denied',
//         'Login required'
//     ]

//     //check for error message here..
//     const errorMessage = error.message || error.toString();
//     return authIndicators.some(indicator =>
//         errorMessage.toLowerCase().includes(indicator.toLowerCase())
//     )
// }

// //check if error is a client error
// const isClientError = (error: any): boolean => {
//     return error?.status >= 400 && error?.status < 500;
// }

// //chek if error is a server error
// const isServerError = (error: any): boolean => {
//     return error?.status >= 500 && error?.status < 600;
// }

// //check if erro is a network error
// const isNetworkError = (error: any): boolean => {
//     if (!error) return false;

//     const networkIndicators = [
//         'Network request failed',
//         'fetch failed',
//         'Connection refused',
//         'Network Error',
//         'ERR_NETWORK',
//         'ERR_INTERNET_DISCONNECTED'
//     ];

//     const errorMessage = error.message || error.toString();
//     return networkIndicators.some(indicator =>
//         errorMessage.toLowerCase().includes(indicator.toLowerCase())
//     );
// };

// // Format error message for display
// const formatErrorMessage = (error: any): string => {
//     if (!error) return 'An unknown error occurred';

//     // Handle structured API errors
//     if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
//         return error.errors[0].message || 'Validation error';
//     }

//     // Handle direct message
//     if (error.message) {
//         return error.message;
//     }

//     // Handle status-based messages
//     if (error.status) {
//         switch (error.status) {
//             case 400:
//                 return 'Bad request - please check your input';
//             case 401:
//                 return 'Authentication required - please log in';
//             case 403:
//                 return 'Access denied - insufficient permissions';
//             case 404:
//                 return 'Resource not found';
//             case 429:
//                 return 'Too many requests - please try again later';
//             case 500:
//                 return 'Server error - please try again';
//             case 503:
//                 return 'Service unavailable - please try again later';
//             default:
//                 return `Request failed with status ${error.status}`;
//         }
//     }

//     return error.toString();
// };

// //Show this error to user
// const showErrorToUser = (error: any, context: 'query' | 'mutation') => {
//     const message = formatErrorMessage(error);

//     if (__DEV__ && isAuthError(error)) {
//         console.warn(`[${context.toUpperCase()}] Auth error:`, message);
//         return;
//     }

//     //dont sjow alers for certain client errors
//     if (error?.status === 404) {
//         console.warn(`[${context.toUpperCase()}] Resource not found:`, message);
//         return;
//     }

//     //Show alert for server errors and network issues
//     if (isServerError(error) || isNetworkError(error)) {
//         Alert.alert(
//             context === 'query' ? 'Loading Error' : 'Activtion Failed',
//             message,
//             [{ text: 'OK', style: 'default' }]
//         )
//         return;
//     }

//     console.error(`[${context.toUpperCase()}] Error:`, error);
// }


// export function QueryProvider(props: { children: ReactNode }) {
//     const [queryClient] = useState(() => new QueryClient({
//         //Query Cache
//         queryCache: new QueryCache({
//             onError: (error, query) => {
//                 console.error('[QUERY ERROR]', {
//                     queryKey: query.queryKey,
//                     error: formatErrorMessage(error),
//                     status: (error as any)?.status
//                 });

//                 // Show error to user for certain types
//                 showErrorToUser(error, 'query');
//             },
//             onSuccess: (data, query) => {
//                 if (__DEV__) {
//                     console.log('[QUERY SUCCESS]', {
//                         queryKey: query.queryKey,
//                         dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'primitive'
//                     });
//                 }
//             }
//         }),

//         //Mutation Cache - handles user actions (POST, PUT, DELETE)
//         mutationCache: new MutationCache({
//             onError: (error, variables, context, mutation) => {
//                 console.error('[MUTATION ERROR]', {
//                     mutationKey: mutation.options.mutationKey,
//                     error: formatErrorMessage(error),
//                     status: (error as any)?.status,
//                     variables: __DEV__ ? variables : '[hidden]'
//                 });

//                 showErrorToUser(error, 'mutation');
//             },
//             onSuccess: (data, variables, context, mutation) => {
//                 if (__DEV__) {
//                     console.log('[MUTATION SUCCESS]', {
//                         mutationKey: mutation.options.mutationKey,
//                         dataKey: data && typeof data === 'object' ? Object.keys(data) : 'primitive'
//                     })
//                 }
//             }
//         }),

//         defaultOptions: {
//             queries: {
//                 //Stale time - how long data is considered fresh
//                 staleTime: 5 * 60 * 1000, //5 minutes

//                 //garbage collection time - how long unused data stays in cache
//                 gcTime: 10 * 60 * 1000, // 10minutes

//                 //dont refetch on window focus
//                 refetchOnWindowFocus: false,

//                 //font refetch on reconnect to default
//                 refetchOnReconnect: 'always',

//                 //retry logic with smart error handling
//                 retry: (failureCount: number, error: any) => {
//                     //never retry auth errors
//                     if (isAuthError(error)) {
//                         console.log('[QUERY] Not retrying auth error');
//                         return false;
//                     }

//                     //dont retry most client errors
//                     if (isClientError(error)) {
//                         if (error.status === 408 || error.status === 429) {
//                             return failureCount < 2;
//                         }
//                         console.log('[QUERY] Not retrying client error:', error.status);
//                         return false;
//                     }

//                     if (isNetworkError(error) || isServerError(error)) {
//                         return failureCount < 3;
//                     }

//                     //default retry for unknown errors
//                     return failureCount < 2;
//                 },
//                 // Retry delay with exponential backoff
//                 retryDelay: (attemptIndex: number, error: any) => {
//                     // Longer delay for rate limiting
//                     if (error?.status === 429) {
//                         return Math.min(5000 * Math.pow(2, attemptIndex), 60000); // 5s, 10s, 20s, up to 60s
//                     }

//                     // Shorter delay for network errors
//                     if (isNetworkError(error)) {
//                         return Math.min(1000 * Math.pow(1.5, attemptIndex), 10000); // 1s, 1.5s, 2.25s, up to 10s
//                     }

//                     // Standard exponential backoff
//                     return Math.min(1000 * Math.pow(2, attemptIndex), 30000); // 1s, 2s, 4s, up to 30s
//                 },

//                 // Network mode - how to handle offline scenarios
//                 networkMode: 'online',

//             },

//             mutations: {
//                 // Retry logic for mutations (more conservative)
//                 retry: (failureCount: number, error: any) => {
//                     // Never retry auth errors
//                     if (isAuthError(error)) {
//                         console.log('[MUTATION] Not retrying auth error');
//                         return false;
//                     }

//                     // Don't retry client errors (user-initiated actions shouldn't auto-retry most 4xx)
//                     if (isClientError(error)) {
//                         // Only retry 408 (Request Timeout)
//                         if (error.status === 408) {
//                             return failureCount < 1;
//                         }
//                         console.log('[MUTATION] Not retrying client error:', error.status);
//                         return false;
//                     }

//                     // Retry network errors once
//                     if (isNetworkError(error)) {
//                         return failureCount < 1;
//                     }

//                     // Retry server errors once (be conservative with mutations)
//                     if (isServerError(error)) {
//                         return failureCount < 1;
//                     }

//                     // Don't retry unknown errors for mutations
//                     return false;
//                 },
//                 // Shorter retry delay for mutations
//                 retryDelay: (attemptIndex: number) => {
//                     return Math.min(2000 * Math.pow(1.5, attemptIndex), 8000); // 2s, 3s, 4.5s, up to 8s
//                 },

//                 // Network mode for mutations
//                 networkMode: 'online',
//             }
//         }
//     }));

//     //Determine if we should show DevTools
//     const showDevTools = __DEV__ && Platform.OS !== 'web';

//     return (
//         <QueryClientProvider client={queryClient}>
//             {props.children}
//             {/* {showDevTools && (
//                 <ReactQueryDevtools
//                     initialIsOpen={false}
//                     buttonPosition="bottom-left"
//                     position="bottom"
//                 />
//             )} */}
//         </QueryClientProvider>
//     )
// }

export function QueryProvider(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                refetchOnWindowFocus: false,
                retry: (failureCount, error) => {
                    //Dont retry auth errors
                    if (error?.message?.includes('Unauthorized') ||
                        error?.message?.includes('Authentication failed')) {
                        return false;
                    }
                    return failureCount < 3;
                },
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
            },
            mutations: {
                retry: 1,
                retryDelay: 1000
            }
        }
    }));

    // const showDevtools = __DEV__ && Platform.OS !== 'web';

    return (
        <QueryClientProvider
            client={queryClient}
        >
            {props.children}
            {/* {showDevtools && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    buttonPosition="bottom-left"
                />
            )} */}
        </QueryClientProvider>
    )
}