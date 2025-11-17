<script lang="ts">
  import {
    MapLibre,
    RasterTileSource,
    RasterDEMTileSource,
    RasterLayer,
    HillshadeLayer,
    Terrain,
    TerrainControl
  } from 'svelte-maplibre-gl';
</script>

<MapLibre
  inlineStyle="height: 100vh;"
  zoom={12}
  pitch={72}
  maxPitch={72}
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
</MapLibre>