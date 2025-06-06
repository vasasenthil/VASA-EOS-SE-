import { createBrowserClient } from "@supabase/ssr"

// Define a function to create the client
// This function can be called anywhere a Supabase client is needed on the client-side
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log an error or throw if you want to be strict,
    // but for client-side, it might be better to let components handle this.
    console.warn("Supabase URL or Anon Key is missing. Client-side Supabase client will not be initialized.")
    // Depending on your app's needs, you might return null or a non-functional client.
    // For createBrowserClient, it expects strings, so we might have to throw or handle upstream.
    // However, createBrowserClient itself will likely throw if these are undefined.
    // Let's assume for now that if they are missing, components using this will fail gracefully or show an error.
    // A more robust approach would be to check these in a context provider or at app initialization.
  }

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Optionally, you can export a singleton instance if preferred for some use cases,
// but creating it on demand or via context is often better.
// const supabase = createSupabaseBrowserClient();
// export default supabase;
