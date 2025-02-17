<script lang="ts">
  import { HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, Terrain, TerrainControl } from 'svelte-maplibre-gl';
  // import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { FileSource, PMTiles } from 'pmtiles';
  import LocalPMTilesProtocol from '$lib/LocalPMTilesProtocol.svelte';
  import Select from '$lib/Select.svelte';
  import Viewer from '$lib/Viewer.svelte';
  import { ViewerData } from '$lib/ViewerClasses.svelte';
  let loaded = $state(false);

  // let Viewer1 = $state(new ViewerData());

  let n = $state(2);
  // let viewers = $derived.by(() => {
  //   let viewers = [];
  //   for (let i = 0; i < n; i++) {
  //     viewers.push(new ViewerData())
  //   }
  //   return viewers
  // })
  let viewers = $state([
    new ViewerData(),
    new ViewerData()
  ])

  let all_pmtiles = $derived.by(() => {
    let all_pmtiles = [];
    for (let i = 0; i < n; i++) {
      if (viewers[i].raster.files.length) {
        all_pmtiles.push(viewers[i].raster.pmtiles);
      }
      if (viewers[i].raster_dem.files.length) {
        all_pmtiles.push(viewers[i].raster_dem.pmtiles);
      }
    }
    return all_pmtiles;
  })

  // $inspect(all_pmtiles).with(console.trace)
  $inspect(viewers[0].raster.url).with(console.trace)

  // $effect(() => {
  //   // if (viewers[0].raster.files.length) {
  //   //   console.log("EFFECT")
  //   // }
  //   for (let i = 0; i < n; i++) {
  //     console.log(i)
  //     all_pmtiles.push(viewers[i].raster.files[0])
  //     $inspect(viewers[i].raster.files).with(console.trace)
  //   }
  // })

  // let files_dem: FileList | [] = $state([]);
  // let pmtiles_dem = $derived.by( () => {
  //   if (files_dem.length) {
  //     return new PMTiles( new FileSource(files_dem[0]));
  //   }
  //   return undefined
  // }) as PMTiles;

  // let pmtiles_all = $derived(
  //   [
  //     pmtiles,
  //     pmtiles_dem
  //   ]
  // ) as PMTiles[];
</script>

<div class="main">
  {#if loaded}

    <LocalPMTilesProtocol
      pmtiles={all_pmtiles}
    />

    <Viewer data={viewers[0]} />
  {:else}
    {#each viewers as viewer, i}
      <p style="text-align: center">{i}</p>
      <Select
        loaded={() => loaded = !loaded}
        bind:files={viewers[i].raster.files}
        bind:files_dem={viewers[i].raster_dem.files}
        bind:files_overlay={viewers[i].raster_overlay.files}
      />
    {/each}
  {/if}
</div>

<style>
  .main {
    display: flex;
    flex-flow: row;
    height: 100%;
    margin: 0;
    padding: 0;
    /* background-color: gray; */
  }
</style>
