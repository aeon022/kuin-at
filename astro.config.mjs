import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import orbiter from '@a83/orbiter-integration';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { plugins: [tailwindcss()] },
  integrations: [orbiter({ pod: './content.pod' })],
});
