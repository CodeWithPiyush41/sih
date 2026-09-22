import { supabase } from './client';

/**
 * Checks if valid Supabase environment variables are provided.
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url === 'https://placeholder.supabase.co' || url === 'https://your-project-id.supabase.co') return false;
  if (key === 'placeholder' || key === 'your-anon-key-here') return false;

  return true;
}

/**
 * Tests connection to Supabase instance.
 * Returns true if configured and reachable.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are missing or set to placeholder values.',
    };
  }

  try {
    const { error } = await supabase.from('_dummy_health_check_').select('count').limit(0);
    // If we get an error that is not network related (e.g. table doesn't exist 42P01 or bad API key),
    // connection to Supabase service itself reached.
    if (error && error.code === 'PGRST301') {
      return { connected: false, message: `Supabase connection error: ${error.message}` };
    }
    return { connected: true, message: 'Supabase client configured and reachable.' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during connection test';
    return { connected: false, message: `Failed to connect to Supabase: ${errorMessage}` };
  }
}
