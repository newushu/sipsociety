import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./config";

export const createBrowserClient = () => {
  assertSupabaseEnv();
  return createClient(supabaseUrl, supabaseAnonKey);
};
