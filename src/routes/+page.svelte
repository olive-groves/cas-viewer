<script lang="ts">
  import { HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, Terrain, TerrainControl } from 'svelte-maplibre-gl';
  import { FileSource, PMTiles } from 'pmtiles';
  import LocalPmTilesProtocol from '$lib/LocalPMTilesProtocol.svelte';
  import Select from '$lib/Select.svelte';
  let loaded = $state(false);

  let files: FileList | [] = $state([]);  // FileList, but not, but yes
  let pmtiles = $derived.by( () => {
    if (files.length) {
      return new PMTiles( new FileSource(files[0]));
    }
    return undefined
  }) as PMTiles;
  let url = $derived(`pmtiles://${pmtiles?.source?.getKey()}`)

  let files_dem: FileList | [] = $state([]);
  let pmtiles_dem = $derived.by( () => {
    if (files_dem.length) {
      return new PMTiles( new FileSource(files_dem[0]));
    }
    return undefined
  }) as PMTiles;
  let url_dem = $derived(`pmtiles://${pmtiles_dem?.source?.getKey()}`)

  let pmtiles_all = $derived(
    [
      pmtiles,
      pmtiles_dem
    ]
  ) as PMTiles[];

  $inspect(pmtiles_all).with(console.trace)

  // let key = $derived(pmtiles?.source?.getKey())
  // let url = $derived(`pmtiles://${key}`)

  // let key = "https://pmtiles.io/stamen_toner(raster)CC-BY+ODbL_z3.pmtiles"
  // let tiles = $derived([`pmtiles://${key}/{z}/{x}/{y}`])
</script>

<div class="main">
  {#if loaded}
  
    <LocalPmTilesProtocol
      pmtiles={pmtiles_all}
    />

    <MapLibre
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
            'visibility': "none"
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
    </MapLibre>
  {:else}
    <Select
      loaded={() => loaded = !loaded}
      bind:files={files}
      bind:files_dem={files_dem}
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
    background-color: gray;
  }
</style>
