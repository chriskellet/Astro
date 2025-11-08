import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Astro/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
