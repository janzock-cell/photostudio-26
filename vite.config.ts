import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  const apiKey = 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.GEMINI_API_KEY || 
    env.VITE_API_KEY || 
    env.API_KEY || 
    env.GOOGLE_API_KEY || 
    env.GEMINI_API_KEY || 
    '';

  return {
    plugins: [react()],
    define: {
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        VITE_API_KEY: apiKey,
        NODE_ENV: mode,
      }),
      '__APP_API_KEY__': JSON.stringify(apiKey),
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      port: 3000
    }
  };
});