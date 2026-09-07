<script lang="ts">
  import { onMount } from 'svelte';
  import { Map as MapLibreMap } from 'maplibre-gl';
  import { TerraDraw } from 'terra-draw';
  import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
  import type { SyncedTerraDraw } from './synced-terra-draw.svelte';

  let {
    id,
    map = $bindable(),
    draw = $bindable(),
    modes,
  }: {
    id: SyncedTerraDraw["id"];
    map: SyncedTerraDraw["map"];
    draw: SyncedTerraDraw["draw"];
    modes: SyncedTerraDraw["modes"];
  } = $props();
  // Whenever we use the shared instance, we must declare at the root level a setup component:
  //   <SyncedTerraDrawSetup {...syncedTerraDraw} />
  // If there are MULTIPLE synced draws?
  //  #each syncedTerraDraws (SvelteMap?)
  //    <SyncedTerraDraw {...draw} /> (we just need onMount to be called for each)
  // For now we just support one.
  onMount(() => {
    if (document.getElementById(id) === null) {
      const container = document.createElement("div");
      container.id = id;
      document.body.appendChild(container);
      map = new MapLibreMap({
        container: container,
      });
      draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({map}),
        modes: modes,
      });
      draw.start();
    }
  })
</script>
