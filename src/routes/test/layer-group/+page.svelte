<script lang="ts">
  import { OrderedSvelteMap } from "$lib/utils.svelte";
  import { SourceManager } from "$lib/source-manager.svelte";

  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/sources';
  import type { OverrideMapLibreSourceSpec } from '$lib/sources';
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

  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localUrlDem = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  const remoteUrl = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles');
  const remoteUrlDem = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/height.pmtiles');
  const initialUrls = [localUrl, localUrlDem, remoteUrl, remoteUrlDem]

  const sourceManager = new SourceManager();

  onMount(() => {
    initialUrls.forEach((url) => addSource(sourceFromUrl(url)));
    // addLayer(0)
    addLayer(1)
    // addLayer(2)
    // addLayer(3)
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

  function addSource(source) {sourceManager.add(source, {mapLibre: {override: {}}})};
  function addLayer(i) {mapLibreLayerGroup.add({sourceKey: [...sourceManager.mapLibreSources.keys()][i]})}

  // Depends on the map, not the order
  const mapLibreLayerGroup = new OrderedSvelteMap();
  // FIXME: Uniqueness based on SOURCE and SOURCE TYPE, because the each-layer goes into a given SOURCE, but a layer could have an overridden source
  const uniqueSourceKeys = $derived(
    [...new Set(Array.from(mapLibreLayerGroup.map.values(), (value) => value.sourceKey))]
  )

</script>

<!-- {#each sourceManager.mapLibreSources as [key, {source: {spec, overrideSpec}, override}] (key)}
  {#await spec then spec}
    <div>
      {key} {spec.type} {override.type}
    </div>
  {/await}
{/each} -->

<!-- {#each uniqueSourceKeys as sourceKey}
{@const source = sourceManager.mapLibreSources.get(sourceKey)}
{#await source?.source.spec then spec}
  <div>
    {spec.type}
  </div>
{/await}
{/each} -->

<PMTilesProtocol />

<div style={'height: 100%; overflow: hidden; display: flex; flex-direction: column;'}>
  <div style={'display: flex;'}>
    Add
    <button onclick={() => addLayer(0)}>Local</button>
    <button onclick={() => addLayer(1)}>Local DEM</button>
    <button onclick={() => addLayer(2)}>Remote</button>
    <button onclick={() => addLayer(3)}>Remote DEM</button>
    <button onclick={() => sourceManager.delete([...sourceManager.sources.keys()][0])}>Delete</button>
    <input type=range bind:value={opacity} min={0} max={1} step={0.1}/>
  </div>
  <div style={'display: flex; height: 200px;'}>
    <MapLibre
      inlineStyle="height: 100%; width: 100%;"
      renderWorldCopies={false}
      aroundCenter={false}
      transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom})}
      zoom={-2}
    >
    {#each uniqueSourceKeys as sourceKey (sourceKey)}
      {@const override = sourceManager.mapLibreSources.get(sourceKey)?.override}
      {#await sourceManager.mapLibreSources.get(sourceKey).source.spec then spec}
        {@const layers = [...mapLibreLayerGroup.map].filter(([layerKey, value]) => value.sourceKey === sourceKey)}
        {#if override?.type === "raster-dem" || ((spec.type === "raster-dem") && !override?.type)}
          <RasterDEMTileSource
            {...{...spec, ...override}}
          >
            {#each layers as [layerKey, value] (layerKey)}
              <HillshadeLayer />
            {/each}
          </RasterDEMTileSource>
        {:else if override?.type === "raster" || ((spec.type === "raster") && !override?.type)}
          <RasterTileSource
            {...{...spec, ...override}}
          >
            {#each layers as [layerKey, value] (layerKey)}
            <RasterLayer
                paint={{
                  'raster-opacity': opacity,
                }}
              />
            {/each}
          </RasterTileSource>
        {/if}
      {/await}
    {/each}
    </MapLibre>
  </div>
  {#each uniqueSourceKeys as key}
    <div>
      {key}
    </div>
  {/each}
  <div style={'border-top: 1px solid red; overflow-y: scroll; flex: 1;'}>
    {#each sourceManager.mapLibreSources as [key, {source, ...rest}] (key)}
      <div>
        {key}
        {#await source.spec then spec}
          {#each Object.entries(spec) as [key, value]}
            <div>{key}: {value}</div>
          {/each}
        {/await}
      </div>
    {/each}
  </div>
</div>
