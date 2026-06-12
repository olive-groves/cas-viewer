<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/tileset';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { untrack } from 'svelte';

  // '/local/bagunca-2025-10-21T1629/height.pmtiles',
  // '/local/bagunca-2025-10-21T1629/nan.pmtiles',
  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const remoteUrl = new URL('https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles');
  const initialUrls = [localUrl, remoteUrl]

  const sources: SvelteMap<string, PMTilesTileset> = new SvelteMap(
    initialUrls.map((url) => [crypto.randomUUID(), sourceFromUrl(url)])
  )

  // const mapLibreSources: [string, MapLibreSourceSpecAdapter][] = $derived(
  //   sources.entries().map(([key, source]) => [key, new MapLibreSourceSpecAdapter(source)])
  // );

  const mapLibreSources: SvelteMap<string, MapLibreSourceSpecAdapter> = new SvelteMap();

  $effect(() => {
    const m = untrack(() => mapLibreSources)

    // Which keys in sources are missing in mapLibreSources? Which are now gone?
    const sourcesKeys = new Set(sources.keys());
    const mapLibreSourcesKeys = new Set(m.keys());
    const missingMapLibreSources = sourcesKeys.difference(mapLibreSourcesKeys);
    const removedSources = mapLibreSourcesKeys.difference(sourcesKeys);

    missingMapLibreSources.forEach((sourceKey) => mapLibreSources.set(sourceKey, new MapLibreSourceSpecAdapter(sources.get(sourceKey))));
    removedSources.forEach((sourceKey) => mapLibreSources.delete(sourceKey));
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

<!-- <PMTilesProtocol /> -->

<div style={'height: 100%; overflow: hidden; display: flex; flex-direction: column;'}>
  <div style={'display: flex;'}>
    <button onclick={() => addSource(sourceFromUrl(localUrl))}>Add local</button>
    <button onclick={() => addSource(sourceFromUrl(remoteUrl))}>Add remote</button>
    <button onclick={() => sources.delete([...sources.keys()][0])}>Delete</button>
    <!-- <button onclick={() => addSource(sourceFromUrl(remoteUrl))}>Add remote</button> -->
  </div>
  <div style={'overflow-y: scroll; flex: 1;'}>
  {#each mapLibreSources as [key, mapLibreSource] (key)}
    <div>
      {key}
      {#if mapLibreSource.source.format === "pmtiles"}
        {#await mapLibreSource.source.header then header}
          {#each Object.entries(header) as [key, value]}
            <div>{key}: {value}</div>
          {/each}
        {/await}
        {#await mapLibreSource.source.metadata then metadata}
          {#each Object.entries(metadata) as [key, value]}
            <div>{key}: {value}</div>
          {/each}
        {/await}
      {/if}
      {#await mapLibreSource.spec then spec}
        {#each Object.entries(spec) as [key, value]}
          <div>{key}: {value}</div>
        {/each}
      {/await}
    </div>
  {/each}
  </div>
</div>
