import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(root, '../package.json'), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  root,
  plugins: [react()],
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@fldr/agentation': path.resolve(root, '../src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
