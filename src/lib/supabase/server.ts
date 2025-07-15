/**
 * @fileoverview Supabase server clients for Next.js server components
 * @module lib/supabase/server
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

/**
 * Create authenticated Supabase client for server components
 * @returns {Promise<SupabaseClient>} Authenticated Supabase client
 * @example
 * ```ts
 * // In a server component or API route
 * const supabase = await createClient();
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*');
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { getToken } = await auth();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
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
}

/**
 * Create Supabase client with service role (full admin access)
 * @returns {SupabaseClient} Service role Supabase client
 * @warning Use with extreme caution - bypasses all RLS policies
 * @example
 * ```ts
 * // Only use for admin operations that need to bypass RLS
 * const supabase = createServiceClient();
 * const { data, error } = await supabase
 *   .from('users')
 *   .delete()
 *   .eq('id', userId);
 * ```
 */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}