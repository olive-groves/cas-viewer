<script lang="ts">
  import { MapLibre, RasterTileSource, RasterLayer, RasterDEMTileSource, Terrain, TerrainControl, HillshadeLayer } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import { PMTiles } from 'pmtiles';
  import type { LayerSpecification } from 'maplibre-gl';

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
{#await getHeaderMetadata()}
  <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
    <p>Loading</p>
  </div>
{:then headers_metadatas}
  <MapLibre
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
    hash={true}
  >
    <NavigationControl position="top-right" visualizePitch={true} />
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
      <Terrain exaggeration={15} />
      <TerrainControl position="top-right" exaggeration={15} />
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
    </RasterDEMTileSource>
  </MapLibre>
{/await}
