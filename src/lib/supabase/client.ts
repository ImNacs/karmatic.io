'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@clerk/nextjs';
import { useMemo } from 'react';

export function useSupabaseClient() {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            // Get the Clerk session token (without template for native integration)
            const clerkToken = await getToken();

            // Create new headers
            const headers = new Headers(options?.headers);
            
            // Set the authorization header with the Clerk token
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }

            // Return the modified fetch
            return fetch(url, {
              ...options,
              headers,
            });
          },
        },
      }
    );
  }, [getToken]);

  return supabase;
}