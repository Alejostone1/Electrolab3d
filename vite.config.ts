/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          plotly: ['plotly.js-dist-min', 'react-plotly.js'],
          katex: ['katex'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/{mathematics,electrical,simulation,circuitos}/**/*.test.ts'],
  },
});
