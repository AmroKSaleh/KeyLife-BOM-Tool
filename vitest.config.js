import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // ------------------------------------
  // Add this 'test' configuration block:
  // ------------------------------------
  test: {
    globals: true, // Makes global functions like 'describe', 'it', 'expect' available without imports
    environment: 'happy-dom', // Use the virtual DOM environment for component testing
    setupFiles: './setupTests.js', // File path for test setup (Step 2b)
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '**/App.jsx', '**/main.jsx'], // Exclude large folders and specific files
    coverage: { // Optional: configure code coverage reporting
        provider: 'v8', 
        reporter: ['text', 'json', 'html'],
    },
  }
});