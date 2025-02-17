<script lang="ts">
  import { HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, Terrain, TerrainControl } from 'svelte-maplibre-gl';
  // import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { FileSource, PMTiles } from 'pmtiles';
  import LocalPMTilesProtocol from '$lib/LocalPMTilesProtocol.svelte';
  import Select from '$lib/Select.svelte';
  import Viewer from '$lib/Viewer.svelte';
  import { ViewerData } from '$lib/ViewerClasses.svelte';
  let loaded = $state(false);

  let Viewer1 = $state(new ViewerData());

  $inspect(Viewer1).with(console.trace)

  // let files: FileList | [] = $state([]);  // FileList, but not, but yes
  // let pmtiles = $derived.by( () => {
  //   if (files.length) {
  //     return new PMTiles( new FileSource(files[0]));
  //   }
  //   return undefined
  // }) as PMTiles;

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

    <!-- <LocalPMTilesProtocol
      pmtiles={pmtiles_all}
    /> -->

    <Viewer data={Viewer1} />

    <!-- <MapLibre
      inlineStyle="height: 100%; margin: 0px;"
      hash={true}
      renderWorldCopies={false}
      maxPitch={87}
      aroundCenter={false}
    >
      <RasterTileSource
        url={url}
      >
        <RasterLayer
          layout={{
            // 'visibility': "none"
          }}
          paint={{
            'raster-resampling': 'nearest',
            "raster-contrast": 0.2 // set -1 for mask effect with hillshade
          }}
        />
      </RasterTileSource>
      <RasterDEMTileSource
        id="terrain"
        url={url_dem}
        encoding="custom"
        baseShift={0}
        redFactor={256*256}
        greenFactor={256}
        blueFactor={1}
      >
        <TerrainControl position="top-right" />
        <Terrain exaggeration={10} />
      </RasterDEMTileSource>
      <RasterDEMTileSource
        id="hillshade"
        url={url_dem}
        encoding="custom"
        baseShift={0}
        redFactor={256*256}
        greenFactor={256}
        blueFactor={1}
      >
        <HillshadeLayer
          paint={{
            'hillshade-exaggeration': 1.0,
            'hillshade-shadow-color': "#000000",
            'hillshade-accent-color': "#000000",
            'hillshade-highlight-color': "#ffffff",
            'hillshade-illumination-anchor': 'map',
            'hillshade-illumination-direction': 0.0
          }}
        />
      </RasterDEMTileSource>
    </MapLibre> -->
  {:else}
    <Select
      loaded={() => loaded = !loaded}
      bind:files={Viewer1.raster.files}
      bind:files_dem={Viewer1.raster_dem.files}
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
    /* background-color: gray; */
  }
</style>
