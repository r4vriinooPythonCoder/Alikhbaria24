// assets/supabaseClient.js
const SUPABASE_URL = "https://fufbqsarmoivnjpxxqkf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VDh630w6moi7fznDqTrF0g_EoSYzGVA";

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "alikhbaria24_auth"
  }
});