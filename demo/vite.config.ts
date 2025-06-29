import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        browser: 'browser-view.html',
        mobile: 'mobile-view.html',
        laptop: 'laptop-view.html',
        overall: 'overall-view.html',
        share: 'share-stats.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})