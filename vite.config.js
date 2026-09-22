import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { proxy: { '/api/conversation': { target: 'ws://localhost:4174', ws: true }, '/api': 'http://localhost:4174' } } });
