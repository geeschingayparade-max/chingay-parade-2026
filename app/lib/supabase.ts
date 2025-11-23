import { createClient } from "@supabase/supabase-js";

// Check if we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

// Client for browser (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations (uses service role key)
// Only create this on the server side
export const supabaseAdmin =
  typeof window === "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : (supabase as any); // Fallback to regular client on browser (won't be used)

// Database types
export interface Submission {
  id: string;
  template_id: string;
  template_name: string;
  image_url: string;
  created_at: string;
  metadata?: {
    drawingTime?: number;
    [key: string]: any;
  };
}
