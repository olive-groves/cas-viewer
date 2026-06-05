<script lang="ts">
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
import {
    MapLibre,
    RasterTileSource,
    RasterDEMTileSource,
    RasterLayer,
    HillshadeLayer,
    Terrain,
    TerrainControl
  } from 'svelte-maplibre-gl';

// MapLibre-knowing?
// Svelte-agnostic.
// Class LayerManager
//   layers  // object of layers, each with their source, type, etc., manager-id (unique)
//   addLayer  // add a layer to the list with a source, type, etc., id
//   removeLayer  // remove a layer using its id
//   reorderLayer  // using 'beforeId'? or index? do we rearrange whole layers object?
//   numberOfLayers  // derived n of layers? (convenience for slot-layers?)

  let paths = $state([
    '/local/bagunca-2025-10-21T1629/rgb.pmtiles',
    '/local/bagunca-2025-10-21T1629/height.pmtiles',
    '/local/bagunca-2025-10-21T1629/rgb.pmtiles',
    '/local/bagunca-2025-10-21T1629/height.pmtiles',
    '/local/bagunca-2025-10-21T1629/rgb.pmtiles',
    '/local/bagunca-2025-10-21T1629/height.pmtiles',
    '/local/bagunca-2025-10-21T1629/rgb.pmtiles',
    '/local/bagunca-2025-10-21T1629/height.pmtiles',
    // '/local/bagunca-2025-10-21T1629/nan.pmtiles',
  ])
  // import.meta.url to resolve with Vite
  let urls = $derived(paths.map((path) => new URL(path, import.meta.url)))

  function getFileStats(url: string){
    let headers;
    fetch(url, {method: 'HEAD'})
      .then((res) => {
        headers = res.headers;
        console.log([
          headers.get('content-length'),
          headers.get('last-modified'),
        ]);
      })
  }

  $effect(() => {
    urls.forEach((url) => getFileStats(url.href))
  })

</script>

<PMTilesProtocol />

<!--

<map>
  each slot (n-layers?)
    <background-layer>
      // see https://github.com/maplibre/maplibre-gl-js/discussions/3787#discussioncomment-12871417
      // You can achieve the functionality of slots with hidden background layers, no?
        {
          "id": "my-slot",
          "type": "background",
          "layout": {"visibility": "none"}
        }
      id={`slot-{i}`}
  each source, besides terrain source
    <source>
      each layer that points to this source
        beforeId={`slot-{layer.z}`}
          the slot it belongs to (slot is used for z-order, as an invisible background layer)
          I can't call beforeId unless that id has already been added, so unordered is tricky.
          I use slots instead to create as many slots as layers to maintain z-order with id "slot-0", "slot-1", etc.
          then add the real layers to their respective slot using beforeId="slot-{z}"
  the active terrain source
    <source>
      <terrain>

-->

<div style:display=flex style:height=100vh>
  {#each urls as url, i}
  <MapLibre
    inlineStyle="height: 100%; width: 100%;"
    transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom})}
    renderWorldCopies={false}
  >
    <RasterTileSource
      id={`raster-${i}`}
      url={`pmtiles://${url}`}
    >
      <RasterLayer
        paint={{"raster-opacity": 0.1}}
      />
      <RasterLayer
        paint={{"raster-opacity": 0.3, "raster-hue-rotate": 100,}}
      />
    </RasterTileSource>
  </MapLibre>
  {/each}
</div>
