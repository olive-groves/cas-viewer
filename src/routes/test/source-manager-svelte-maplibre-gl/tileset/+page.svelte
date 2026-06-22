<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/sources';
  import type { OverrideMapLibreSourceSpec } from '$lib/sources';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { onMount, untrack } from 'svelte';
  import { HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource } from 'svelte-maplibre-gl';

  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localUrlDem = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  const remoteUrl = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles');
  const remoteUrlDem = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/height.pmtiles');
  const initialUrls = [localUrl, localUrlDem]

  // TODO: Make shared.svelte.ts
  const sources: SvelteMap<string, PMTilesTileset> = new SvelteMap(
    // initialUrls.map((url) => [crypto.randomUUID(), sourceFromUrl(url)])
  )

  onMount(() => {
    initialUrls.forEach((url) => addSource(sourceFromUrl(url)));
  })

  function mirrorMap(original: SvelteMap<any, any>, mirror: SvelteMap<any, any>, setter?: Function) {
    const originalKeys = new Set(original.keys());
    const mirrorKeys = new Set(untrack(() => mirror).keys());

    const missingKeys = originalKeys.difference(mirrorKeys);
    missingKeys.forEach((missingKey) => {
      const value = original.get(missingKey);
      mirror.set(missingKey, setter ? setter(value) : value)
    })

    const removedKeys = mirrorKeys.difference(originalKeys);
    removedKeys.forEach((removedKey) => mirror.delete(removedKey));
  };

  // Mirror `sources` with MapLibre sources and overrides
  const mapLibreSources: SvelteMap<string, {source: MapLibreSourceSpecAdapter, override: OverrideMapLibreSourceSpec}> = new SvelteMap();
  // const mapLibreSourceOverrides: SvelteMap<string, OverrideMapLibreSourceSpec> = new SvelteMap();
  $effect(() => {
    mirrorMap(sources, mapLibreSources, (source) => {
      const override = $state({
        type: "raster-dem",
        opacity: 0.5,
      });
      // const override = {};
      return {
        source: new MapLibreSourceSpecAdapter(source),
        override,
      }
    })
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

  function addSource(source) {sources.set(crypto.randomUUID(), source)};

</script>

<PMTilesProtocol />

<div style={'height: 100%; overflow: hidden; display: flex; flex-direction: column;'}>
  <div style={'display: flex;'}>
    Add
    <button onclick={() => addSource(sourceFromUrl(localUrl))}>Local</button>
    <button onclick={() => addSource(sourceFromUrl(localUrlDem))}>Local DEM</button>
    <button onclick={() => addSource(sourceFromUrl(remoteUrl))}>Remote</button>
    <button onclick={() => addSource(sourceFromUrl(remoteUrlDem))}>Remote DEM</button>
    <button onclick={() => sources.delete([...sources.keys()][0])}>Delete</button>
  </div>
  <div style={'display: flex;'}>
    <button onclick={
      () => {
        const key = [...sources.keys()][0];
        const opacity = mapLibreSources.get(key).override.opacity;
        const type = mapLibreSources.get(key).override.type;
        mapLibreSources.get(key).override.opacity = opacity < 1 ? 1 : 0.5;
        mapLibreSources.get(key).override.type = (type === "raster") ? "raster-dem" : "raster";
      }
    }>Set raster-DEM</button>
  </div>
  <div style={'display: flex; height: 200px;'}>
    <MapLibre
      inlineStyle="height: 100%; width: 100%;"
      renderWorldCopies={false}
      aroundCenter={false}
      transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom})}
    >
    {#each mapLibreSources as [key, {source, override}] (key)}
      {#await source.spec then spec}
        {#if override.type === "raster" || ((spec.type === "raster") && !override.type)}
          <RasterTileSource
            {...{...spec, ...override}}
          >
            <RasterLayer
              paint={{
                'raster-resampling': 'nearest',
                'raster-opacity': override.opacity,
              }}
            />
          </RasterTileSource>
        {:else if override.type === "raster-dem" || ((spec.type === "raster-dem") && !override.type)}
          <RasterDEMTileSource
              {...{...spec, ...override}}
          >
            <HillshadeLayer
              paint={{
                'hillshade-exaggeration': override.opacity,
              }}
            />
          </RasterDEMTileSource>
        {/if}
      {/await}
    {/each}
    </MapLibre>
  </div>
  <div style={'overflow-y: scroll; flex: 1;'}>
  {#each mapLibreSources as [key, {source, ...rest}] (key)}
    <div>
      {key}
      <!-- {#if source.source.format === "pmtiles"}
        {#await source.source.header then header}
          {#each Object.entries(header) as [key, value]}
            <div>{key}: {value}</div>
          {/each}
        {/await}
        {#await mapLibreSource.source.metadata then metadata}
          {#each Object.entries(metadata) as [key, value]}
            <div>{key}: {value}</div>
          {/each}
        {/await}
      {/if} -->
      {#await source.spec then spec}
        {#each Object.entries(spec) as [key, value]}
          <div>{key}: {value}</div>
        {/each}
      {/await}
    </div>
  {/each}
  </div>
</div>
