<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  import { MapLibre } from 'svelte-maplibre-gl';
  import { TerraDraw } from '@svelte-maplibre-gl/terradraw';
  import { TerraDrawPointMode } from 'terra-draw';

  let render = $state(true);
  let snapshot = $state([]);
</script>

<button onclick={() => {render = !render}}>
  {render ? "Destroy" : "Mount"}
</button>

<div style="display: flex; height: 100%; width: 100%;">
  {#if render}
    <MapLibre inlineStyle="flex: 1;">
      <TerraDraw
        mode={'point'}
        modes={[new TerraDrawPointMode()]}
        onstart={(draw) => draw.addFeatures(snapshot)}
        onbeforestop={(draw) => snapshot = draw.getSnapshot() ?? []}
      />
    </MapLibre>
  {/if}
</div>
