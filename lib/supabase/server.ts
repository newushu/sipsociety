import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./config";

export const createServerClient = () => {
  assertSupabaseEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
