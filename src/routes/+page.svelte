<script lang="ts">
  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import Select from '$lib/Select.svelte';
  import Viewer from '$lib/Viewer.svelte';
  import { ViewerData } from '$lib/ViewerClasses.svelte';
  let loaded = $state([
    false,
    false
  ]);

  let n = $state(2);
  let viewers = $derived.by(() => {  // n viewers
    let viewers = [];
    for (let i = 0; i < n; i++) {
      viewers.push(new ViewerData())
    }
    return viewers
  })

  let all_pmtiles = $derived.by(() => {
    let all_pmtiles = [];
    for (let i = 0; i < n; i++) {
      if (viewers[i].raster.pmtiles) {
        all_pmtiles.push(viewers[i].raster.pmtiles);
      }
      if (viewers[i].raster_dem.pmtiles) {
        all_pmtiles.push(viewers[i].raster_dem.pmtiles);
      }
      if (viewers[i].raster_overlay.pmtiles) {
        all_pmtiles.push(viewers[i].raster_overlay.pmtiles);
      }
    }
    return all_pmtiles;
  })

  // $inspect(all_pmtiles).with(console.trace)
  $inspect(viewers[0].raster.pmtiles).with(console.trace)

  let mapProps = $state({
  });

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


{#if loaded.some((x) => x === true)}
  <PMTilesProtocol pmtiles={all_pmtiles} />
{/if}

<div class="main">
  <div class={loaded.every((x) => x === true) ? "viewers" : "selectors"}>
    <!-- Index viewers[i] to trigger reactive state -->
    {#each viewers as _, i} 
      {#if loaded[i]}
        <Viewer
          --height="100%"
          --width="100%"
          data={viewers[i]}
          bind:mapProps
        />
      {:else}
        <Select
          --width="300px"
          loaded={() => loaded[i] = !loaded[i]}
          bind:files={viewers[i].raster.files}
          bind:files_dem={viewers[i].raster_dem.files}
          bind:files_overlay={viewers[i].raster_overlay.files}
        />
        {/if}
      {/each}
  </div>
</div>

<style>
  .main {
    container: main / size;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .selectors {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    height: 100%;
    margin: 0;
    padding: 0;
    justify-content: space-evenly;
    align-items: center;
    background-color: darkslategray;
  }
  /* .viewers {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    height: 100%;
    margin: 0;
    padding: 0;
    justify-content: space-evenly;
    align-items: center;
  } */
  .viewers {
    position: absolute;
    height: 50%;
    width: 50%;
    margin: 0;
    padding: 0;
  }
  @container main (max-aspect-ratio: 1 / 1) {
    .viewers {
      flex-direction: column;
    }
  }
</style>
