import { createClient } from "@supabase/supabase-js";

// Fall back to harmless placeholders when the env vars aren't set (e.g. a
// local build/prerender with no .env.local) so createClient() doesn't throw
// and break static generation for pages that don't even touch auth — every
// page is wrapped in AuthProvider (see src/lib/AuthContext.tsx), which calls
// supabase.auth.getSession() on mount. Real requests against the placeholder
// URL simply fail at runtime instead of at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
