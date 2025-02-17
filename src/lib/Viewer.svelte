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

  import { PMTiles } from 'pmtiles';

  let {
    pmtiles_raster,
    pmtiles_raster_dem,
    pmtiles_raster_overlay
  }: {
    pmtiles_raster?: PMTiles,
    pmtiles_raster_dem?: PMTiles,
    pmtiles_raster_overlay?: PMTiles
  } = $props();

  async function getHeaderMetadata(file: PMTiles) {
    const raster_header = await file.getHeader();
    const raster_metadata = await file.getMetadata();

    return {
      raster_header,
      raster_metadata
    }
  }
</script>

{#await getHeaderMetadata(pmtiles_raster)}
  <p>Loading...</p>
{:then hm}
  <table>
    <tbody>
      {#each Object.entries(hm.raster_metadata) as [key, value]}
        <tr>
          <th scope="row" style="text-align: end">{key}</th>
          <td>{value}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/await}

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