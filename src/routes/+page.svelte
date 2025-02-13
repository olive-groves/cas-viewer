<script lang="ts">
  import { MapLibre, RasterLayer, RasterTileSource } from 'svelte-maplibre-gl';
  // import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { FileSource, PMTiles } from 'pmtiles';
  import LocalPmTilesProtocol from '$lib/LocalPMTilesProtocol.svelte';
  import Select from '$lib/Select.svelte';
  let loaded = $state(false);
  let files = $state() as Array<File>;
  let file = $derived.by( () => {
    if (files) {
      return new PMTiles( new FileSource(files[0]));
    }
    return undefined
  }) as PMTiles;
  let key = $derived(file ? file?.source?.getKey() : undefined)
  // let key = $derived.by(() => {return file.source.getKey()})
  // // "https://pmtiles.io/stamen_toner(raster)CC-BY+ODbL_z3.pmtiles"
  let tiles = $derived([`pmtiles://${key}/{z}/{x}/{y}`])
  // let tiles = $state() as Array<string>;
  // [`pmtiles://${file.source.getKey()}/{z}/{x}/{y}`]

  $effect(() => (console.log(`house${files[0]}`)));
</script>

<div class="main">
  {#if loaded}
  
    <LocalPmTilesProtocol
      file={file}
    />

    <MapLibre
      inlineStyle="height: 100%; margin: 0px;"
      hash={true}
    >
      <RasterTileSource
        tiles={tiles}
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
