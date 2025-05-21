<script lang="ts">
  import { fade } from 'svelte/transition';
  import hillshadeIconActive from '$lib/hillshade-effect-active.svg'
  import hillshadeIcon from '$lib/hillshade-effect.svg'
  import {
    MapLibre,
    RasterTileSource,
    RasterLayer,
    RasterDEMTileSource,
    Terrain,
    TerrainControl,
    HillshadeLayer,
    NavigationControl,
    FullScreenControl,
    CustomControl
  } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { PMTiles } from 'pmtiles';
  import type { LayerSpecification } from 'maplibre-gl';

  let disclaimerVisible = $state(true)
  let terrainVisible = $state(true)
  let hillshadeVisible = $state(true)

  let center = $state({ lng: 0.0, lat: 0.0 });

  let urls: string[] = [
    "https://pub-71d989b3685545118a21f845c49db6a3.r2.dev/paintings/almond-blossom/20241023_175809_stitched_rgb.pmtiles",
    "https://pub-71d989b3685545118a21f845c49db6a3.r2.dev/paintings/almond-blossom/20241023_175809_stitched_height.pmtiles"
  ]
  let pmtiles: PMTiles[] = [];
  let headers: {}[] = [];
  let metadatas: {}[] = [];
  const getHeaderMetadata = async () => {
    pmtiles = urls.map((url) => new PMTiles(url));
    headers = pmtiles.map((p) => p.getHeader())
    metadatas = pmtiles.map((p) => p.getMetadata())
    return {
      headers,
      metadatas
    }
  }
</script>

<!-- Add pmtiles:// Protocol globally -->
<PMTilesProtocol />

<!-- Use the pmtiles:// protocol -->
<div id=main style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; margin: none;">
{#await getHeaderMetadata()}
    <em>Loading</em>
{:then headers_metadatas}
  <MapLibre
    onload={setTimeout(() => disclaimerVisible = false, 5000)}
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
    bind:center
    hash={true}
  >
    <FullScreenControl position="bottom-right" container={document.getElementById("main")}/>
    <NavigationControl position="top-right" visualizePitch={true} />
    <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
      <button
        onclick={() => terrainVisible = !terrainVisible}
        style:color={terrainVisible ? "#33b5e5" : "#555"}
        style:font-weight=900>
        3D
      </button>
      <button
        onclick={() => hillshadeVisible = !hillshadeVisible}>
        <img alt="Hillshade icon" src={hillshadeVisible ? hillshadeIconActive : hillshadeIcon} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
    </CustomControl>
    <RasterDEMTileSource
      id="terrain"    
      url={`pmtiles://${urls[1]}`}
      encoding="custom"
      baseShift={0}
      redFactor={256*256}
      greenFactor={256}
      blueFactor={1}
      tileSize={256}
    >
      {#if terrainVisible}
        <Terrain exaggeration={15} />
      {/if}
    </RasterDEMTileSource>
    <RasterTileSource
      attribution="<a href='https://harmbelt.nl/'>Harm Belt · <em>Almond Blossom<em></a>"
      url={`pmtiles://${urls[0]}`}
      tileSize={256}
    >
      <RasterLayer
        paint={{
          'raster-resampling': 'nearest'
        }}
      />
    </RasterTileSource>
    <RasterDEMTileSource
      id="hillshade"
      url={`pmtiles://${urls[1]}`}
      encoding="custom"
      baseShift={0}
      redFactor={256*256}
      greenFactor={256}
      blueFactor={1}
      tileSize={256}
    >
      {#if hillshadeVisible}
        <HillshadeLayer
          paint={{
            'hillshade-exaggeration': 1.0,
            'hillshade-shadow-color': `rgba(0, 0, 0, 1.0)`,
            'hillshade-accent-color': "rgba(0, 0, 0, 0.5)",
            'hillshade-highlight-color': `rgba(255, 255, 255, 0.1)`,
            'hillshade-illumination-anchor': 'map',
            'hillshade-illumination-direction': 315
          }}
        />
      {/if}
    </RasterDEMTileSource>
  </MapLibre>
  {#if disclaimerVisible}
    <em style="position: absolute; pointer-events: none; font-size: 2em;" transition:fade>
      In development
    </em>
  {/if}
{/await}
</div>
