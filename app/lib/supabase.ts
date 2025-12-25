import { createClient } from "@supabase/supabase-js";

// Check if we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// IMPORTANT:
// Do not throw at module-import time. Next.js can import route handlers during build
// (e.g. "collect page data"), and missing env vars would break builds even when
// those routes aren't exercised. We'll fail at runtime when the client is used.
const hasPublicConfig = Boolean(supabaseUrl && supabaseAnonKey);
const hasServiceRoleConfig = Boolean(supabaseUrl && supabaseServiceRoleKey);

if (!hasPublicConfig && process.env.NODE_ENV !== "production") {
  console.warn(
    "Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
  );
}

// Client for browser (uses anon key)
export const supabase = hasPublicConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as ReturnType<typeof createClient>);

// Client for server-side operations (uses service role key)
// Only create this on the server side
export const supabaseAdmin =
  typeof window === "undefined" && hasServiceRoleConfig
    ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : supabase; // Fallback (routes using admin will fail at runtime if not configured)

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
