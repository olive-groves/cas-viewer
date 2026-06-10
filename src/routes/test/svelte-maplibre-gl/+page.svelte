<script lang="ts">
  import {
    MapLibre,
    RasterTileSource,
    RasterDEMTileSource,
    RasterLayer,
    HillshadeLayer,
    Terrain,
    TerrainControl,
    LineLayer,
    SymbolLayer
  } from 'svelte-maplibre-gl';
  import { MapLibreContourSource } from '@svelte-maplibre-gl/contour'
</script>

<MapLibre
  inlineStyle="height: 100vh;"
  zoom={12}
  // pitch={72}
  // maxPitch={72}
  center={{ lng: 11.39085, lat: 47.3 }}
>
  <RasterDEMTileSource
    id="terrain"
    tiles={['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png']}
  >
    <TerrainControl position="top-right" />
    <Terrain />
  </RasterDEMTileSource>
  <RasterTileSource
    id="terrain1"
    tiles={['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png']}
  >
    <RasterLayer />
  </RasterTileSource>
  <RasterDEMTileSource
    id="terrain2"
    tiles={['https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png']}
  >
    <HillshadeLayer />
  </RasterDEMTileSource>
  <!-- <MapLibreContourSource
    url={'https://demotiles.maplibre.org/terrain-tiles/{z}/{x}/{y}.png'}
    maxzoom={14}
    tileOptions={{
      // multiplier: 1,
      thresholds: {
        // zoom: [minor, major]
        5: [500, 2000],
        8: [250, 1000],
        11: [100, 500],
        12: [50, 200],
        13: [20, 100],
        14: [10, 50]
      },
      // optional, override vector tile parameters:
      contourLayer: 'contours',
      elevationKey: 'ele',
      levelKey: 'level'
    }}
  >
    {#snippet children(demSource)}
      <RasterDEMTileSource tiles={[demSource.sharedDemProtocolUrl]} maxzoom={14} tileSize={256}>
        <TerrainControl />
      </RasterDEMTileSource>
      <RasterTileSource tiles={[demSource.sharedDemProtocolUrl]} maxzoom={14} tileSize={256}>
        <RasterLayer />
      </RasterTileSource>
      <RasterDEMTileSource tiles={[demSource.sharedDemProtocolUrl]} maxzoom={14} tileSize={256}>
        <HillshadeLayer
          paint={{
            'hillshade-exaggeration': 0.5,
            'hillshade-illumination-anchor': 'map',
            'hillshade-shadow-color': '#3080b0'
          }}
        />
      </RasterDEMTileSource>
      <LineLayer
        sourceLayer="contours"
        paint={{
          'line-color': 'rgba(255, 255, 255, 1)',
          'line-width': ['match', ['get', 'level'], 1, 1.5, 0.5]
        }}
      />
      <SymbolLayer
        sourceLayer="contours"
        filter={['>', ['get', 'level'], 0]}
        layout={{
          'symbol-placement': 'line',
          'text-size': 12,
          'text-field': ['number-format', ['get', 'ele'], {}]
        }}
        paint={{
          'text-halo-color': 'white',
          'text-halo-width': 1
        }}
      />
    {/snippet}
  </MapLibreContourSource> -->
</MapLibre>
