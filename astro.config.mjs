import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
export default defineConfig({
  site: 'https://waylan.cc',
  output: 'static',
  adapter: vercel(),
  redirects: {
    '/work/laishangke/': '/#experience',
    '/work/tribal-e/': '/#experience',
    '/work/certification-system/': '/#other',
  },
  vite: { optimizeDeps: { include: ['animejs'] }, ssr: { external: ['@electric-sql/pglite'] } },
});
