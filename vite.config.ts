import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(__dirname, 'champions.json');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'champions-api',
      configureServer(server) {
        server.middlewares.use('/api/champions', (req, res) => {
          if (req.method === 'GET') {
            try {
              const data = fs.readFileSync(DATA_FILE, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.end('[]');
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              fs.writeFileSync(DATA_FILE, JSON.stringify(JSON.parse(body), null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end('{"ok":true}');
            });
          }
        });
      },
    },
  ],
});
