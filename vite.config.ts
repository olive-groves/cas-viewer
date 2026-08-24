import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  optimizeDeps: {
    // MapLibre v6 worker bundling can fail during dependency pre-bundling.
    exclude: ['maplibre-gl']
  },
});
