<script lang="ts">
  // Orchestration of sources, synced layers, and layer groups...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, layerGroups } from "$lib/shared.svelte";
  import { RemotePMTilesTileset, type MapLibreSourceSpec, type PMTilesTileset } from "$lib/sources";
  import { MapLibreSyncedLayer, type AnyLayerSpec, type LayerOverride } from "$lib/synced-layer.svelte";
  import { OrderedSvelteMap } from "$lib/utils.svelte";

  // FIXME: For development purposes...
  sourceManager.sources.forEach((_, key) => sourceManager.delete(key));
  syncedMapLibreLayers.forEach((_, key) => syncedMapLibreLayers.delete(key));
  layerGroups.map.forEach((_, key) => layerGroups.delete(key));

  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localUrlDem = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  // const initialUrls = [localUrl, localUrl, localUrlDem]
  const initialUrls = [localUrl, localUrlDem]

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

  function addSource(source: PMTilesTileset) {
    return sourceManager.add(
      source,
      {
        mapLibre: {
          forceSpecType: undefined,
          override: {}
        }
      }
    )
  };

  // function addLayerFromSource()

  // Proof:
  import { onMount } from "svelte";
  import { symbolName } from "typescript";

  let nViewers = $state(2);
  // svelte-ignore state_referenced_locally
  [...Array(nViewers).keys()].map(() => layerGroups.add(new OrderedSvelteMap()))

  async function deriveSyncedLayerFromMapLibreSource(
    mapLibreSourceKey: string,
    nOverrides: number,
  ) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) return;
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }

    if (sourceSpec.type === "raster") {  // If raster, add a raster layer to each group
      const layerSpecType = "raster";
      const initialPaintSpec = {
        "raster-opacity": 0.5,
      }
      const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
        source: mapLibreSourceKey,
        type: layerSpecType,
        paint: initialPaintSpec,
      }
      const overrides = [...Array(nOverrides).keys()].map(() => [crypto.randomUUID(), {spec: {}}] satisfies [string, LayerOverride<AnyLayerSpec>])
      const syncedLayer = new MapLibreSyncedLayer(
        layerSpec,
        undefined,
        overrides,
      )
      const syncedLayerKey = crypto.randomUUID();
      syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);
      const overrideKeys = [...syncedLayer.overrides.keys()];
      layerGroups.order.forEach((layerGroupKey, index) => {
        layerGroups.map.get(layerGroupKey)?.add(syncedLayerKey, {key: overrideKeys.at(index)})
      })
    } else if (sourceSpec.type === "raster-dem") {  // If raster-dem, add a hillshade AND color-relief layer to each group
      const layerSpecTypes = ["hillshade", "color-relief"];
      layerSpecTypes.forEach((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "hillshade-exaggeration": 0.5,
            "hillshade-illumination-direction": 315,
          } :
          {
            'color-relief-color': [
              'interpolate',
              ['linear'],
              ['elevation'],
              0, 'rgb(4, 0, 108)',
              5000, 'rgb(215, 5, 13)'
            ]
          }
        const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
          source: mapLibreSourceKey,
          type: layerSpecType,
          paint: initialPaintSpec,
        }
        const overrides = [...Array(nOverrides).keys()].map(() => [crypto.randomUUID(), {spec: {}}] satisfies [string, LayerOverride<AnyLayerSpec>])
        const syncedLayer = new MapLibreSyncedLayer(
          layerSpec,
          undefined,
          overrides,
        )
        const syncedLayerKey = crypto.randomUUID();
        syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);
        const overrideKeys = [...syncedLayer.overrides.keys()];
        layerGroups.order.forEach((layerGroupKey, index) => {
          layerGroups.map.get(layerGroupKey)?.add(syncedLayerKey, {key: overrideKeys.at(index)})
        })
      })
    }
  }

  onMount(() => {

    const initialSourceKeys = initialUrls.map((url) => addSource(sourceFromUrl(url)));

    // For each source, create a synced layer derived from its spec with as many
    // overrides as nViewers, to simulate side by side with the same source
    initialSourceKeys.forEach((sourceKey) => {
      deriveSyncedLayerFromMapLibreSource(sourceKey, nViewers)
    })
    // addLayer()
  })

</script>

<div style:display=grid style:grid-template-columns="1fr auto 0fr">
  <div style:grid-column="-1 / 1">
    Add layer(s) from
    <button onclick={() => deriveSyncedLayerFromMapLibreSource([...sourceManager.mapLibreSources.keys()][0], nViewers)}>raster source</button>
    <button onclick={() => deriveSyncedLayerFromMapLibreSource([...sourceManager.mapLibreSources.keys()][1], nViewers)}>raster-dem source</button>
  </div>
  <div style:grid-column="-1 / 1">
    <h2>List of layer group overrides sorted by source</h2>
  </div>
  <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
    <div>Property</div>
    <div>Value</div>
    <div>Sync?</div>
  </div>
  {#each layerGroups.map as [layerGroupKey, layerGroup], iGroup (layerGroupKey)}
    <div style:grid-column="-1 / 1" style:border-top="1px solid white">
      <h3>Viewer (layer group): {iGroup}</h3>
    </div>
    <!-- Reduce across the overrideKeys, the source keys -->
    {@const layerGroupEntriesBySource = layerGroup.map.entries().reduce(
      (uniqueSources, [overrideKey, syncedLayerKey]) => {
        const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey);
        const sourceKey = syncedLayer?.overrides.get(overrideKey)?.spec?.source ?? syncedLayer?.spec.source;
        if (uniqueSources.get(sourceKey) === undefined) {
          const sourceLayerGroup = new Map([[overrideKey, syncedLayerKey]]);
          uniqueSources.set(sourceKey, sourceLayerGroup);
        } else {
          uniqueSources.get(sourceKey).set(overrideKey, syncedLayerKey)
        }
        return uniqueSources
      },
      new Map()
      )
    }
    {#each layerGroupEntriesBySource as [sourceKey, layerGroupEntries] (sourceKey)}
      <div style:grid-column="-1 / 1" style:border-top="1px solid gray">
        <h4>Source: {sourceKey}</h4>
      </div>
      {#each layerGroupEntries.entries() as [overrideKey, syncedLayerKey]}
        <div>{syncedMapLibreLayers.get(syncedLayerKey)?.spec.type}</div>
        <div>{syncedLayerKey}</div>
        <div></div>
      {/each}
    {/each}
  {/each}
</div>


<!-- Prove sidebar Layer Manager -->
<div style:display=grid style:grid-template-columns="1fr auto 0fr">
  <div style:grid-column="-1 / 1">
    <h2>List of layer groups and their respective (override) layers</h2>
  </div>
  <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
    <div>Property</div>
    <div>Value</div>
    <div>Sync?</div>
  </div>
  {#each layerGroups.map as [layerGroupKey, layerGroup], iGroup (layerGroupKey)}
    <div style:grid-column="-1 / 1" style:border-top="1px solid white">
      <h3>Viewer (layer group): {iGroup}</h3>
    </div>
    {#each [...layerGroup.map.entries()].reverse() as [overrideKey, syncedLayerKey] (overrideKey)}
      {@const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey)}
      {@const override = syncedLayer?.overrides.get(overrideKey)}
      <div style:grid-column="-1 / 1">
        <div>
          {syncedMapLibreLayers.get(syncedLayerKey)?.spec.type}
        </div>
      </div>
      {#each Object.keys(syncedLayer.spec?.paint ?? {}) as property (property)}
        <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
          <div>{property}</div>
          <div>
            {#if typeof override.spec?.paint?.[property] !== "undefined"}
              <input type=range bind:value={override.spec.paint[property]} style:user-select=none/>
            {:else if typeof syncedLayer.spec.paint?.[property] !== "undefined"}
              <input type=range bind:value={syncedLayer.spec.paint[property]} style:user-select=none/>
            {/if}
          </div>
          <div style:align-self=center style:justify-self=center>
            <input type=checkbox checked={override.spec?.paint?.[property] === undefined} onchange={(e) => {
              if (e.target.checked) {
                delete override.spec.paint[property];
              } else {
                override.spec.paint = {...override.spec?.paint, [property]: syncedLayer.spec.paint[property]}
              }
            }}>
          </div>
        </div>

      {/each}
    {/each}
  {/each}
</div>

<!-- <h2>List of synced layers and their respective overrides</h2>
{#each syncedMapLibreLayers as [syncedLayerKey, syncedLayer]}
  <h3>{syncedLayer.spec.type} {syncedLayerKey}</h3>
  {#each syncedLayer.overrides as [overrideKey, override]}
    <div>Override: {overrideKey}</div>
    {#each Object.keys(syncedLayer.spec?.paint ?? {}) as property (property)}
      <div style:display=flex>
      <p>{property}</p>
      {#if typeof override.spec?.paint?.[property] !== "undefined"}
        <input type=range bind:value={override.spec.paint[property]} style:user-select=none/>
      {:else if typeof syncedLayer.spec.paint?.[property] !== "undefined"}
        <input type=range bind:value={syncedLayer.spec.paint[property]} style:user-select=none/>
      {/if}
      <input type=checkbox checked={override.spec?.paint?.[property] === undefined} onchange={(e) => {
        if (e.target.checked) {
          delete override.spec.paint[property];
        } else {
          override.spec.paint = {...override.spec?.paint, [property]: syncedLayer.spec.paint[property]}
        }
      }}>
      </div>

    {/each}
  {/each}
{/each} -->


<!-- MapLibre-knowing?
Svelte-agnostic.
Class LayerManager
  layers  // object of layers, each with their source, type, etc., manager-id (unique)
  addLayer  // add a layer to the list with a source, type, etc., id
  removeLayer  // remove a layer using its id
  reorderLayer  // using 'beforeId'? or index? do we rearrange whole layers object?
  numberOfLayers  // derived n of layers? (convenience for slot-layers?) -->

<!--
// see https://github.com/maplibre/maplibre-gl-js/discussions/3787#discussioncomment-12871417
// You can achieve the functionality of slots with hidden background layers, no?
  {
    "id": "my-slot",
    "type": "background",
    "layout": {"visibility": "none"}
  }
<map>
  each slot (n-layers?)
    <background-layer>
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

<style>
  /*
    Josh's Custom CSS Reset
    https://www.joshwcomeau.com/css/custom-css-reset/
  */

  *, *::before, *::after {
    box-sizing: border-box;
  }

  *:not(dialog) {
    margin: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      interpolate-size: allow-keywords;
    }
  }

  body {
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }

  input, button, textarea, select {
    font: inherit;
  }

  p, h1, h2, h3, h4, h5, h6 {
    overflow-wrap: break-word;
  }

  p {
    text-wrap: pretty;
  }
  h1, h2, h3, h4, h5, h6 {
    text-wrap: balance;
  }

  #root, #__next {
    isolation: isolate;
  }
</style>
