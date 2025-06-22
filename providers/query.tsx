import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from "react";
import { Platform } from "react-native";

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