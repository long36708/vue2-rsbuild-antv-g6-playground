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
    exclude: ['@antv/layout-wasm'],
  },
  server: {
    // 显式使用 localhost，确保浏览器视为可信 origin，COOP/COEP 头才能生效
    // （SharedArrayBuffer / WASM 多线程依赖跨域隔离）
    host: 'localhost',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
