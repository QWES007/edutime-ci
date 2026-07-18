import type { Database } from "@/lib/types/database";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createBrowserClient<Database>(url, key);
}
export function isMockMode(): boolean {
  // On force le mode démo à FAUX pour utiliser ta vraie base de données
  return false;
}
