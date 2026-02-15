import { createClient } from '@supabase/supabase-js';

// Next.js automatically loads environment variables from .env.local
// For standalone worker scripts, load dotenv at the top of the worker file instead

// Server-side Supabase client with service role key (has elevated permissions)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
