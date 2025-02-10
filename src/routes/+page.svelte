<script lang="ts">
  import { MapLibre, RasterLayer, RasterTileSource } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { FileSource, PMTiles } from 'pmtiles';
  import Select from '$lib/Select.svelte';
  let loaded = $state(false);
  let files = $state();

  // $effect(() => (console.log(files)));
  $effect(() => {
    let file = new PMTiles( new FileSource(files[0]));
    console.log(file);
  });
</script>

<PMTilesProtocol />

<div class="main">  
  {#if loaded}
    <MapLibre
      inlineStyle="height: 100%; margin: 0px;"
      hash={true}
    >
      <RasterTileSource
        url="pmtiles://https://pmtiles.io/stamen_toner(raster)CC-BY+ODbL_z3.pmtiles"
      >
        <RasterLayer/>
      </RasterTileSource>
    </MapLibre>
  {:else}
    <Select
      loaded={() => loaded = !loaded}
      bind:files={files}
    />
  {/if}
</div>

<style>
  .main {
    display: flex;
    flex-flow: column;
    height: 100%;
    margin: 0;
    padding: 0;
  }
</style>
