<script lang="ts">
  import { OrderedSvelteMap } from "$lib/utils.svelte";

  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/tileset';
  import type { OverrideMapLibreSourceSpec } from '$lib/tileset';
  import { onMount, untrack } from 'svelte';


  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { ColorReliefLayer, HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource, NavigationControl } from 'svelte-maplibre-gl';
  class SourceManager {
    sources: SvelteMap<string, PMTilesTileset> = new SvelteMap();
    mapLibreSources: SvelteMap<string, {source: MapLibreSourceSpecAdapter, override: OverrideMapLibreSourceSpec}> = new SvelteMap();

    add(source: PMTilesTileset, adapters?: {mapLibre?: {override?: OverrideMapLibreSourceSpec}}) {
      const key = crypto.randomUUID();

      this.sources.set(key, source);

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
  const initialUrls = [localUrl, localUrlDem]

  const sourceManager = new SourceManager();

  onMount(() => {
    initialUrls.forEach((url) => addSource(sourceFromUrl(url)));
  })

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

  function addSource(source) {sourceManager.add(source)};
  function addLayer(i) {mapLibreLayerGroup.add({source_key: [...sourceManager.mapLibreSources.keys()][i]})}

   // Depends on the map, not the order
  const mapLibreLayerGroup = new OrderedSvelteMap();
  const uniqueSourceKeys = $derived(
    [...new Set(Array.from(mapLibreLayerGroup.map.values(), (value) => value.source_key))]
  )

  let countLayers = $state([
    {i: 0, message: "nice"}
  ])

</script>

<PMTilesProtocol />

<div style={'height: 100%; overflow: hidden; display: flex; flex-direction: column;'}>
  <div>
    Count
    <button onclick={() => countLayers.push({i: countLayers.length, message: "nice"})}>Add</button>
  </div>
  <div style={'display: flex;'}>
    Add source
    <button onclick={() => addSource(sourceFromUrl(localUrl))}>Local</button>
    <button onclick={() => addSource(sourceFromUrl(localUrlDem))}>Local DEM</button>
  </div>
  <div style={'display: flex;'}>
    Add layer
    <button onclick={() => addLayer(0)}>Local</button>
    <button onclick={() => addLayer(1)}>Local DEM</button>
  </div>
  <div style={'display: flex; height: 100%;'}>
    <MapLibre
      inlineStyle="height: 100%; width: 100%;"
      renderWorldCopies={false}
      aroundCenter={false}
      transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom})}
      // zoom={-2}
    >
      <NavigationControl />
      {#each sourceManager.mapLibreSources as [key, mapLibreSource] (key)}
        {#await mapLibreSource.source.spec then spec}
          {#if spec.type === "raster-dem"}
            <RasterDEMTileSource
              {...{...spec, id: key}}
            >
              {#each countLayers as {i, message} (i)}
              <HillshadeLayer source={key} />
              {/each}
            </RasterDEMTileSource>
          {:else if spec.type === "raster"}
            <RasterTileSource
              {...{...spec, id: key}}
            >
              {#each countLayers as {i, message} (i)}
              <RasterLayer source={key} paint={{"raster-opacity": 0.1}} />
              {/each}
            </RasterTileSource>
          {/if}
        {/await}
      {/each}
    </MapLibre>
  </div>
</div>
