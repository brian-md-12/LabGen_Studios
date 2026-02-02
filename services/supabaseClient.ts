
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseUrl !== '';

if (!isConfigured) {
  console.warn(
    "LabGen Notice: Supabase environment variables are missing. Authentication will fall back to mock mode.\n" +
    "To enable Google Sign-In and Database sync:\n" +
    "1. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.\n" +
    "2. See SUPABASE_AUTH_GUIDE.md for OAuth instructions."
  );
}

export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

export const getSupabaseDiagnostics = async () => {
  if (!isConfigured) {
    return {
      status: 'unconfigured',
      error: 'Environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing.',
      url: supabaseUrl || 'Not set'
    };
  }

  try {
    // Destructure 'status' from the result because 'error' is of type 'PostgrestError' which does not have a 'status' property.
    const { data, error, status } = await supabase!.from('_non_existent_table_check').select('count').limit(1);
    // 404/401/400 are actually "good" signs that we hit the API gateway
    if (error && (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('not found') || status === 401)) {
      return { status: 'connected', details: 'Successfully reached Supabase API Gateway.' };
    }
    if (error) throw error;
    return { status: 'connected', details: 'Full database handshake successful.' };
  } catch (err: any) {
    return {
      status: 'failed',
      error: err.message || 'Network error / Timeout',
      url: supabaseUrl
    };
  }
};
