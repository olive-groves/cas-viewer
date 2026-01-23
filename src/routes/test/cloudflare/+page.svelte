<script lang="ts">
  import { MapLibre, RasterTileSource, RasterLayer, RasterDEMTileSource, Terrain, TerrainControl, HillshadeLayer, ColorReliefLayer } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { PMTiles } from 'pmtiles';
  import type { LayerSpecification, ExpressionSpecification } from 'maplibre-gl';

  let urls: string[] = [
    "https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles",
    "https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/height.pmtiles"
  ]
  let pmtiles: PMTiles[] = [];
  let headers: {}[] = [];
  let metadatas: {}[] = [];
  const getHeaderMetadata = async () => {
    pmtiles = urls.map((url) => new PMTiles(url));
    headers = pmtiles.map((p) => p.getHeader())
    metadatas = pmtiles.map((p) => p.getMetadata())
    console.log(metadatas)
    return {
      headers,
      metadatas
    }
  }

  let lowBreakpoint: number = $state(1);
  let highBreakpoint: number = $state(35014);
  const COLOR_MAPS: Record<string, ExpressionSpecification> = {
    GRAYSCALE: [
      'interpolate',
      ['linear'],
      ['elevation'],
      0.999, 'magenta',
      0.9999, 'black',
      lowBreakpoint, 'black',
      highBreakpoint, 'white',
      1000000, 'white'
    ]
  }
  type ColorMap = keyof typeof COLOR_MAPS;
  let colorMap: ColorMap = $state('GRAYSCALE');
</script>

<!-- Add pmtiles:// Protocol globally -->
<PMTilesProtocol />

<!-- Use the pmtiles:// protocol -->
{#await getHeaderMetadata()}
  <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
    <p>Loading</p>
  </div>
{:then headers_metadatas}
  <label>
    <input type="range" min=0 max=50000 step=10 bind:value={highBreakpoint} ondblclick={() => highBreakpoint = 50000}>
    High breakpoint ({highBreakpoint.toFixed(0)})
  </label>
  <label>
    <input type="range" min=0 max=50000 step=10 bind:value={lowBreakpoint} ondblclick={() => lowBreakpoint = 0}>
    Low breakpoint ({lowBreakpoint.toFixed(0)})
  </label>
  <MapLibre
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
  >
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
      <TerrainControl position="top-right" />
      <Terrain exaggeration={10} />
    </RasterDEMTileSource>
    <RasterTileSource
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
      <ColorReliefLayer
        paint={{
          'color-relief-opacity': 1,
          'color-relief-color': [
            'interpolate',
            ['linear'],
            ['elevation'],
            0, 'magenta',
            0.5, 'black',
            lowBreakpoint, 'black',
            highBreakpoint, 'white',
            1000000, 'white'
          ]
          // 'color-relief-color': COLOR_MAPS[colorMap]
        }}
      />
      <!-- <HillshadeLayer
        paint={{
          'hillshade-exaggeration': 0.5,
          'hillshade-shadow-color': `rgba(0, 0, 0, 1.0)`,
          'hillshade-accent-color': "rgba(0, 0, 0, 0.5)",
          'hillshade-highlight-color': `rgba(255, 255, 255, 0.1)`,
          'hillshade-illumination-anchor': 'map',
          'hillshade-illumination-direction': 315
        }}
      /> -->
    </RasterDEMTileSource>
  </MapLibre>
{/await}
