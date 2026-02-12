import { QueryClient } from "@tanstack/react-query";

/**
 * Default QueryClient configuration for TanStack Query
 * Provides sensible defaults for caching, retries, and stale time
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
