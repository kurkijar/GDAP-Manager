import { defineConfig, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// FIX: Define __dirname for an ES module context.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    main: {
      build: {
        rollupOptions: {
          external: [
            '@azure/msal-node-extensions',
            'keytar',
            'dpapi',
            'fs',
            'path',
            'os',
            'crypto'
          ]
        }
      }
    },
    preload: {
      build: {
        rollupOptions: {
          external: ['electron']
        }
      }
    },
    renderer: {
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src/renderer/src')
        }
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        chunkSizeWarningLimit: 500,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'vendor-react'
                }
                return 'vendor'
              }
            }
          }
        }
      }
    }
  }
})
