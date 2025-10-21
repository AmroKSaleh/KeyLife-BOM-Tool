import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensures the built assets use relative paths for easy serving by Express
  base: './', 
  build: {
    outDir: 'dist', // Express server will look here
  }
});
