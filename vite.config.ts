
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Use process.cwd() with type assertion to bypass the error where 'cwd' is not recognized on the 'Process' type in certain environments.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      'process.env.SECONDARY_API_KEY': JSON.stringify(env.SECONDARY_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.PAYPAL_CLIENT_ID': JSON.stringify(env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || ''),
      'process.env.PAYPAL_PLAN_BASIC': JSON.stringify(env.PAYPAL_PLAN_BASIC || process.env.PAYPAL_PLAN_BASIC || ''),
      'process.env.PAYPAL_PLAN_PRO': JSON.stringify(env.PAYPAL_PLAN_PRO || process.env.PAYPAL_PLAN_PRO || ''),
      'process.env.PAYPAL_PLAN_UPGRADE': JSON.stringify(env.PAYPAL_PLAN_UPGRADE || process.env.PAYPAL_PLAN_UPGRADE || '')
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ai': ['@google/genai'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    }
  };
});
