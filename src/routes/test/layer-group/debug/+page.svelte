<script lang="ts">
  import { OrderedSvelteMap } from "$lib/utils.svelte";

  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/tileset';
  import type { OverrideMapLibreSourceSpec } from '$lib/tileset';
  import { onMount, untrack } from 'svelte';


  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { ColorReliefLayer, HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource } from 'svelte-maplibre-gl';

  // A layer group defines a map of layers with a particular order.
  // You start with an empty group.
  // Add a layer.
  // This layer gets added into the group.map with a random key, and its key gets pushed to the group.order.
  // Add another layer, and the same happens.
  // You could already #each across the keys in group.order and get/place each layer with group.map.get(key):
  // each key in group.key
  //  <source>
  //    <layer ...>
  //  </source>

  // The problem is that for MapLibre we should add by source.
  // That is, for each unique source, we add the layers that use that source.
  // If we were to add a source for each layer, we might add redundant sources.
  // Redundant sources will fetch tiles twice, thrice, etc. as needed.
  // So, for a MapLibre layer group, we add instead by source.
  // (To manage order, we'll use slots and `beforeId`.)
  // (Future-proofedness asks we assume groups can be nested.)
  // We need something like this:
  //
  // #each uniqueSource in sourcesOfLayerGroup
  //  <source uniqueSource>
  //    #each layer that uses that uniqueSource
  //      <layer>

  let opacity = $state(0.1)

  class SourceManager {
    // TODO: Abstract this out with adapters; that is, elect to have mapLibre, openseadragon, etc.?
    sources: SvelteMap<string, PMTilesTileset> = new SvelteMap();
    mapLibreSources: SvelteMap<string, {source: MapLibreSourceSpecAdapter, override: OverrideMapLibreSourceSpec}> = new SvelteMap();

    add(source: PMTilesTileset, adapters?: {mapLibre?: {override?: OverrideMapLibreSourceSpec}}) {
      // Add to the list of sources and instantiate relevant adapters
      const key = crypto.randomUUID();

      // Sources
      this.sources.set(key, source);

      // MapLibre sources
      const override = adapters?.mapLibre?.override;
      const mapLibreSource = {
        source: new MapLibreSourceSpecAdapter(source),
        override
      }
      this.mapLibreSources.set(key, mapLibreSource);
      return key
    }

    delete(key: string) {
      this.sources.delete(key);
      this.mapLibreSources.delete(key);
    }
  }

  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localUrlDem = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  const remoteUrl = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles');
  const remoteUrlDem = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/height.pmtiles');
  const initialUrls = [localUrl, localUrlDem]

  const sourceManager = new SourceManager();

  onMount(() => {
    initialUrls.forEach((url) => addSource(sourceFromUrl(url)));
  })

  // const mapLibreSourceOverrides: SvelteMap<string, OverrideMapLibreSourceSpec> = new SvelteMap();
  function sourceFromUrl(url: URL): PMTilesTileset {
    const pathname = url.pathname.toLowerCase();

    if (pathname.endsWith(".json")) {
      // return new TileJSONTileset(url);
      throw Error("JSON not yet supported")
    } else if (pathname.endsWith(".pmtiles")) {
      return new RemotePMTilesTileset(url.toString());
    } else {
      throw Error("Unable to parse source from url")
    }
  };

  function addSource(source) {sourceManager.add(source, {mapLibre: {override: {type: "raster-dem"}}})};

</script>

<PMTilesProtocol pmtiles={[...sourceManager.sources.values()].map((value) => value.archive)} />

<div style={'height: 100%; overflow: hidden; display: flex; flex-direction: column;'}>
  <div style={'display: flex;'}>
    Add
    <button onclick={() => addSource(sourceFromUrl(localUrl))}>Local</button>
    <button onclick={() => addSource(sourceFromUrl(localUrlDem))}>Local DEM</button>
  </div>
  <div style={'display: flex; height: 200px;'}>
    <MapLibre
      inlineStyle="height: 100%; width: 100%;"
      renderWorldCopies={false}
      aroundCenter={false}
      transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom})}
      zoom={-2}
    >
      {@const sourceKey = [...sourceManager.mapLibreSources.keys()][0]}
      {@const override = sourceManager.mapLibreSources.get(sourceKey)?.override}
      {#await [...sourceManager.mapLibreSources.values()].at(0)?.source.spec then spec}
        <RasterDEMTileSource
          {...{...spec, ...override}}
        >
          <HillshadeLayer/>
        </RasterDEMTileSource>
      {/await}
    </MapLibre>
  </div>
</div>
