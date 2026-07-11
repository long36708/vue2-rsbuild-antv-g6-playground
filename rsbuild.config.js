// @ts-check
import { defineConfig } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginVue2()],
  html: {
    template: './public/index.html',
  },
  source: {
    entry: {
      index: './src/main.js',
    },
    alias: {
      '@': './src/',
    },
  },
});
