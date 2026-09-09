import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
export default defineConfig({
  site: 'https://waylan.cc',
  output: 'static',
  adapter: vercel(),
  vite: { ssr: { external: ['@electric-sql/pglite'] } },
});
