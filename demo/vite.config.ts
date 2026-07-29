import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import * as sass from 'sass';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';

const root = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(root, '../package.json'), 'utf-8')) as {
  version: string;
};

const VIRTUAL_PREFIX = '\0scss-css-export:';

/** In-memory store for the last mail-back feedback POST (demo only). */
function feedbackApiPlugin(): Plugin {
  let lastPayload: unknown = null;

  const readBody = (req: Connect.IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });

  return {
    name: 'demo-feedback-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/feedback') {
          next();
          return;
        }

        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'GET') {
          res.statusCode = 200;
          res.end(JSON.stringify({ payload: lastPayload }));
          return;
        }

        if (req.method === 'POST') {
          try {
            const raw = await readBody(req);
            lastPayload = raw ? JSON.parse(raw) : null;
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
          }
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

/** Mirror tsup SCSS plugin: export class maps + css strings, no head injection. */
function scssCssExportPlugin(): Plugin {
  return {
    name: 'scss-css-export',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.includes('.scss')) {
        return null;
      }
      // Ignore Vite internal CSS queries
      if (source.includes('?')) {
        return null;
      }

      let resolved = source;
      if (source.startsWith('.') && importer) {
        resolved = path.resolve(path.dirname(importer.split('?')[0]), source);
      } else if (path.isAbsolute(source)) {
        resolved = source;
      } else {
        return null;
      }

      if (!existsSync(resolved)) {
        return null;
      }

      // End with .js so Vite does not run the CSS/Sass pipeline on the module.
      return `${VIRTUAL_PREFIX}${resolved}.js`;
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX) || !id.endsWith('.js')) {
        return null;
      }

      const filePath = id.slice(VIRTUAL_PREFIX.length, -'.js'.length);
      const isModule = filePath.includes('.module.');
      const { css: sassOutput } = sass.compile(filePath);

      if (!isModule) {
        return `export const css = ${JSON.stringify(sassOutput)};\n`;
      }

      let classNames: Record<string, string> = {};
      const { css } = await postcss([
        postcssModules({
          getJSON(_, json) {
            classNames = json;
          },
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        }),
      ]).process(sassOutput, { from: filePath });

      return `
export const css = ${JSON.stringify(css)};
export default ${JSON.stringify(classNames)};
`;
    },
  };
}

export default defineConfig({
  root,
  plugins: [feedbackApiPlugin(), scssCssExportPlugin(), react()],
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
