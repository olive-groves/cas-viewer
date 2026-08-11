import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  optimizeDeps: {
    // Prevent: [UNLOADABLE_DEPENDENCY] Could not load node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url
    exclude: ['svelte-maplibre-gl']
  }
});
