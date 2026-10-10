import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site from https://<user>.github.io/<repo>/, so the
// production build (run in GitHub Actions) needs that base path. Local dev and
// preview keep serving from "/".
const isActions = process.env.GITHUB_ACTIONS === 'true'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'among-us'

export default defineConfig({
  base: isActions ? `/${repoName}/` : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
