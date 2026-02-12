import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseAnonKey, supabaseUrl } from "./config";

let browserClient: SupabaseClient | null = null;

export const createBrowserClient = () => {
  assertSupabaseEnv();
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
};
