import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import * as babel from '@babel/core'
import componentAnnotatePlugin from './babel-plugin-component-annotate'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteReact(),
    tailwindcss(),
    {
      name: 'dom-selector-helper-inject',
      enforce: 'pre',
      transformIndexHtml(html) {
        if (process.env.NODE_ENV === 'production') return html
        const scriptTag =
          '<script type="module" src="/dom-selector-helper.js"></script>'
        if (html.includes('</head>')) {
          return html.replace('</head>', scriptTag + '\n</head>')
        } else if (html.includes('</body>')) {
          return html.replace('</body>', scriptTag + '\n</body>')
        }
        return html + scriptTag
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/dom-selector-helper.js') {
            const helperPath = path.join(
              process.cwd(),
              'dom-selector-helper.js',
            )
            if (fs.existsSync(helperPath)) {
              res.setHeader('Content-Type', 'application/javascript')
              res.end(fs.readFileSync(helperPath, 'utf-8'))
              return
            }
          }
          next()
        })
      },
    },
    {
      name: 'babel-component-annotate',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('.jsx') || id.endsWith('.tsx')) {
          const result = babel.transformSync(code, {
            filename: id,
            plugins: [componentAnnotatePlugin],
            parserOpts: { plugins: ['jsx', 'typescript'] },
          })
          return { code: result?.code || code, map: result?.map || null }
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: ['.e2b.dev', '.e2b.app', '.docy.app', '.docy.dev', '.docyrus.app'],
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' https://localhost:4200 http://localhost:5173 http://localhost:3000 https://localhost:3000 https://studio.docyrus.app https://docyrus.app https://next.docyrus.app https://docy.app",
    },
  },
})
