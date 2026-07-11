import path from 'node:path'
import { pluginVue2 } from '@rsbuild/plugin-vue2'
import { defineConfig } from '@rstest/core'

// Docs: https://rstest.rs/config/
export default defineConfig({
  plugins: [
    pluginVue2({
      vueLoaderOptions: {
        isServerBuild: false,
      },
    }),
  ],
  testEnvironment: 'jsdom',
  setupFiles: ['./rstest.setup.js'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
