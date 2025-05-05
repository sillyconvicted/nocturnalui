import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This is crucial for Electron to load assets properly
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Make sure output can be found by Electron
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Keep it simple for Electron
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
