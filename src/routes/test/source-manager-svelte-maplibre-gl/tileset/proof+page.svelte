<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { PMTilesTileset, MapLibreSourceSpecAdapter, RemotePMTilesTileset } from '$lib/sources';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';

  const initial_paths = [
    '/local/bagunca-2025-10-21T1629/rgb.pmtiles',
    // '/local/bagunca-2025-10-21T1629/height.pmtiles',
    // '/local/bagunca-2025-10-21T1629/nan.pmtiles',
    // 'https://tiles.larsmaxfield.com/paintings/almond-blossom/20250107-1604/20250520_153658/rgb.pmtiles',
  ];

  // This:
  // const sources = new SvelteMap([
  //   [crypto.randomUUID(), new MapLibreSourceSpecAdapter(new RemotePMTilesTileset(initial_paths[0]))],
  // ])
  // ...but dynamically:
  const sources = new SvelteMap(
    initial_paths.map((path) => [
      crypto.randomUUID(),
      new MapLibreSourceSpecAdapter(new RemotePMTilesTileset(initial_paths[0]))
    ])
  )

  const addSource = () => sources.set(crypto.randomUUID(), new MapLibreSourceSpecAdapter(new RemotePMTilesTileset(initial_paths[Math.floor(Math.random()*initial_paths.length)])));
</script>

<!-- <PMTilesProtocol /> -->

<button onclick={addSource}>Another One</button>
{#each sources.entries() as [key, source] (key)}
  <div>
    {key}
    {#if source.source.format === "pmtiles"}
      {#await source.source.header then header}
        {#each Object.entries(header) as [key, value]}
          <div>{key}: {value}</div>
        {/each}
      {/await}
      {#await source.source.metadata then metadata}
        {#each Object.entries(metadata) as [key, value]}
          <div>{key}: {value}</div>
        {/each}
      {/await}
    {/if}
    {#await source.spec then spec}
      {#each Object.entries(spec) as [key, value]}
        <div>{key}: {value}</div>
      {/each}
    {/await}
  </div>
{/each}
