import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Cho phép code sử dụng process.env.API_KEY hoạt động trên trình duyệt
      // Cập nhật: Chấp nhận cả API_KEY, VITE_API_KEY và GEMINI_API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || env.GEMINI_API_KEY)
    }
  };
});