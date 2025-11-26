import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Define environment variables for client-side usage
  // We map VITE_ variables to process.env as a fallback for environments where import.meta.env might be flaky
  const defineEnv: Record<string, string> = {
    'process.env.API_KEY': JSON.stringify(env.API_KEY),
  };
  
  // Also expose VITE_ variables on process.env for fallback compatibility
  Object.keys(env).forEach(key => {
    if (key.startsWith('VITE_')) {
      defineEnv[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  });

  return {
    plugins: [react()],
    // Securely inject environment variables at build time
    define: defineEnv,
    server: {
      port: 8080,
      host: '0.0.0.0',
    },
    preview: {
      port: 8080,
      host: '0.0.0.0',
    },
  };
});