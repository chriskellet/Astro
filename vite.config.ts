import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Astro/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Optimize for mobile performance
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Chunk optimization for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
        },
      },
    },
  },
  // Optimize dev server for mobile testing
  server: {
    host: true, // Listen on all addresses for mobile testing
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
