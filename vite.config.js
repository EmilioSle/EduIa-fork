import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimizaciones de build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Code splitting para mejor cache
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-d3': ['d3'],
          'vendor-gsap': ['gsap'],
          'vendor-recharts': ['recharts'],
        },
        // Nombres con hash para cache busting
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Tamaño máximo de chunk warning
    chunkSizeWarningLimit: 500,
    // Sourcemaps solo en desarrollo
    sourcemap: false,
  },
  // Optimizaciones de dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'd3', 'gsap', 'recharts', 'papaparse'],
  },
  // Prefetch de módulos
  server: {
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/sections/*.jsx',
        './src/components/charts/*.jsx',
      ],
    },
  },
})
