import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    proxy: {
      '/dashboard-state': 'http://localhost:5000',
      '/sensor-data': 'http://localhost:5000',
      '/health-score': 'http://localhost:5000',
      '/alerts': 'http://localhost:5000',
      '/ai-analysis': 'http://localhost:5000',
      '/reports': 'http://localhost:5000',
      '/generate-report': 'http://localhost:5000',
    },
  },
});
