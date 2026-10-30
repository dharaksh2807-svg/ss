import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: JSON.stringify(mode === 'development'),
  },
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'es2022',
    sourcemap: true
  }
}));
