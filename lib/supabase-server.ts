import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Next.js automatically loads environment variables from .env.local
// For standalone worker scripts, load dotenv at the top of the worker file instead

let adminClient: SupabaseClient | null = null;

function getSupabaseEnv() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL for workers).'
    );
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { supabaseUrl, serviceRoleKey };
}

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

// Lazy proxy avoids import-time crashes in worker scripts.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminClient() as object, prop, receiver);
  },
}) as SupabaseClient;

/**
 * Creates a new server-side Supabase client instance
 * Use this in API routes to ensure fresh connections
 */
export function getSupabaseServer(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getSupabaseEnv();
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
