// @ts-check
import { defineConfig } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginVue2()],
  html: {
    template: './public/index.html',
  },
  resolve:{
    alias: {
      '@': './src/',
    },
  },
  source: {
    entry: {
      index: './src/index.js',
    },
  },
  server: {
    // WASM 多线程需要 SharedArrayBuffer，需启用 COOP/COEP 实现跨域隔离
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
