import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    build: {
        // Chunk splitting optimization
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks - separate large dependencies
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['framer-motion', 'swiper'],
                    'vendor-utils': ['date-fns', 'clsx', 'zustand'],
                    'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-telegram': ['@telegram-apps/sdk-react'],
                },
            },
        },
        // Code minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        // Asset optimization
        assetsInlineLimit: 4096,
        cssCodeSplit: true,
        sourcemap: false,
        // Output directory
        outDir: 'dist',
        emptyOutDir: true,
        // Chunk size warning limit (in kB)
        chunkSizeWarningLimit: 600,
    },
    // CSS optimization
    css: {
        devSourcemap: false,
    },
});
