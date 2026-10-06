import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({plugins:[react(),tailwind()],server:{port:5173},build:{rollupOptions:{output:{manualChunks(id){if(!id.includes('/node_modules/'))return; if(id.includes('/@firebase/')||id.includes('/firebase/'))return 'firebase';if(id.includes('/react/')||id.includes('/react-dom/')||id.includes('/react-router'))return 'react';}}}}});
