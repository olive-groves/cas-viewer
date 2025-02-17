<script lang="ts">
  import {
    HillshadeLayer,
    MapLibre,
    RasterDEMTileSource,
    RasterLayer,
    RasterTileSource,
    Terrain,
    TerrainControl
  } from 'svelte-maplibre-gl';

  import { ViewerData } from './ViewerClasses.svelte';

  let {
    data
  }: {
    data?: ViewerData,
  } = $props();

  async function getHeaderMetadata() {
    const raster_header = await data?.raster.header 
    const raster_metadata = await data?.raster.metadata 
    const raster_dem_header = await data?.raster_dem.header 
    const raster_dem_metadata = await data?.raster_dem.metadata 
    const raster_overlay_header = await data?.raster.header 
    const raster_overlay_metadata = await data?.raster.metadata 
    return {
      raster_header,
      raster_metadata,
      raster_dem_header,
      raster_dem_metadata,
      raster_overlay_header,
      raster_overlay_metadata
    }
  }
</script>


{#await getHeaderMetadata()}
  <p>Loading...</p>
{:then hm}
  <table>
    <tbody>
      {#if hm.raster_metadata}
        {#each Object.entries(hm.raster_metadata) as [key, value]}
          <tr>
            <th scope="row" style="text-align: end">{key}</th>
            <td>{value}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
  <!-- <MapLibre
    inlineStyle="height: 100%; height: 100%; margin: 0px;"
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
{/await}
