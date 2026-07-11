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
});
