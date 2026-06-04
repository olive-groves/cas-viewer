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

  // I want a dashboard of ordered layers with various settings.
  // These layers are ordered. If I have a layer, I know which layers are before and after it.
  // Each layer has a source.
  // Svelte MapLibre GL paradigm is to specify a source, then nest the layer(s) to create from that source.
  // A naive approach would be to array those layers and {each} to create them, specifying source>layer.
  // However, I shouldn't {each} over the layers, because the same source could be created twice.
  // Thus, my approach should {each} over the sources, inserting the layer(s) as needed, and keeping the order.
  //
  // If I remove a source, my dashboard of layers shouldn't suddenly lose sight of the layers associated with that layer.
  //  I need to maintain knowledge of the layers despite the missing sources.
  //  'LayerUI' that, if its source is undefined, shows that its missing. Not just vanish.
  //  Out of scope for now.
  //
  // I want a project JSON that remembers the layers, sources, and settings.
  //  If I drag that JSON in, it should say "Hey, you're missing these relative file and FileAPI sources. Add to project and drag-and-drop them."
  //
  // Adding a source should automatically add a layer, because a source can tell us its type.

</script>

<PMTilesProtocol />

<!--
Testbed:

Source manager functions:
"I want to manage my sources. Some are remote. Some are relative. Some are File API."
"I want to manage my layers. Each points to a source. They are in the order I want."`

  Add sources:
    remote URL
      Add via text?

    file API
      drag and drop zone
      -> on add, registers a new file as a source, thereby adding to the sources
        detecting duplicate sources is not in scope

    relative URL
      hardcoded

  State:
  -> list of sources shown

  Remove sources:
  -> remove source (proves can remove and not screw things up)

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

// MapLibre-knowing?
// Svelte-agnostic.
Class LayerManager
  layers  // object of layers, each with their source, type, etc., manager-id (unique)
  addLayer  // add a layer to the list with a source, type, etc., id
  removeLayer  // remove a layer using its id
  reorderLayer  // using 'beforeId'? or index? do we rearrange whole layers object?

Class SourceManager
  sources  // object


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
