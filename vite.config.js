import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        buyNow: 'Buynow.html',
        login: 'LOGIN.html',
        register: 'formdnhap/formdnhap.html'
      }
    }
  }
});
