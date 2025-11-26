import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase the warning limit to 3MB because ML models are heavy
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Separate third-party libraries into their own files for better caching and loading
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ml': ['handtrackjs', '@google/genai']
        }
      }
    }
  }
})