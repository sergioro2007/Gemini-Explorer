
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY globally for the client build to use VITE_GOOGLE_API_KEY
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY),
    },
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
