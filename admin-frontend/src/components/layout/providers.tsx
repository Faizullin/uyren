'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { globalQueryErrorHandler } from '@/lib/error-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useTheme } from 'next-themes';
import { PropsWithChildren, useState } from 'react';
import { ActiveThemeProvider } from '../common/active-theme';

export default function Providers({
    activeThemeValue,
    children
}: PropsWithChildren<{
    activeThemeValue: string;
}>) {
    // we need the resolvedTheme value to set the baseTheme for clerk based on the dark or light theme
    const { resolvedTheme } = useTheme();

    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        gcTime: 10 * 60 * 1000, // 10 minutes
                        retry: (failureCount, error) => {
                            // Handle errors globally
                            if (failureCount === 0) {
                                globalQueryErrorHandler(error);
                            }

                            // Don't retry on 4xx errors (client errors)
                            if (error && typeof error === 'object' && 'status' in error) {
                                const status = (error as any).status;
                                if (status >= 400 && status < 500) {
                                    return false;
                                }
                            }
                            // Retry up to 3 times for server errors
                            return failureCount < 3;
                        },
                    },
                    mutations: {
                        onError: globalQueryErrorHandler,
                    }
                },
            })
    );


    return (
        <>
            <ActiveThemeProvider initialTheme={activeThemeValue}>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        {children}
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <ReactQueryDevtools buttonPosition='bottom-left' />
                            </>
                        )}
                    </AuthProvider>
                </QueryClientProvider>
            </ActiveThemeProvider>
        </>
    );
}