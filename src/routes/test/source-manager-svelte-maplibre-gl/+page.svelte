<script lang="ts">
  // Orchestration of sources, synced layers, and layer groups...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, layerGroups } from "$lib/shared.svelte";
  import { LocalPMTilesTileset, RemotePMTilesTileset, StaticImage, type PMTilesTileset } from "$lib/sources";
  import { MapLibreSyncedLayer, type AnyLayerSpec, type LayerOverride } from "$lib/synced-layer.svelte";
  import { OrderedSvelteMap } from "$lib/utils.svelte";
  import { mergeDeep } from "$lib/utils";
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";
  import { PMTiles } from "pmtiles";

  // FIXME: Clear for development purposes
  sourceManager.sources.forEach((_, key) => sourceManager.delete(key));
  syncedMapLibreLayers.forEach((_, key) => syncedMapLibreLayers.delete(key));
  layerGroups.map.forEach((_, key) => layerGroups.delete(key));

  const localPmtilesUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localPmtilesDemUrl = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  const localJpgUrl = new URL('/local/almond-blossom.jpg', import.meta.url);
  const localPngUrl = new URL('/local/impasto.png', import.meta.url);
  // const initialUrls = [localPmtilesUrl, localPmtilesDemUrl, localJpgUrl];
  // const initialUrls = [localPmtilesUrl, localPmtilesDemUrl];
  const initialUrls = [];

  function sourceFromUrl(url: URL): PMTilesTileset | StaticImage {
    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith(".json")) {
      // return new TileJSONTileset(url);
      throw Error("JSON not yet supported")
    } else if (pathname.endsWith(".pmtiles")) {
      return new RemotePMTilesTileset(url.toString());
    } else if ([".jpeg", ".jpg", ".png"].some((extension) => pathname.endsWith(extension))) {
      return new StaticImage(url.toString());
    } else {
      throw Error("Unable to parse source from url")
    }
  };

  function addSource(source: PMTilesTileset | StaticImage) {
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

  let pmtiles: PMTiles[] = $state([]);

  // function addLayerFromSource()

  //////////////////////////////////////////////////////////////////////////////////////
  // Proof
  import { onMount } from "svelte";
  import { ColorReliefLayer, HillshadeLayer, MapLibre, RasterDEMTileSource, RasterLayer, RasterTileSource } from "svelte-maplibre-gl";

  let nViewers = $state(5);
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
        layout: {visibility: "visible"},
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
      const layerSpecTypes = ["color-relief", "hillshade"];
      layerSpecTypes.forEach((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "hillshade-exaggeration": 0.5,
            "hillshade-illumination-direction": 90,
          } :
          {
            'color-relief-color': [
              'interpolate',
              ['linear'],
              ['elevation'],
              0, 'rgba(4, 0, 108, 0.5)',
              5000, 'rgba(215, 5, 13, 0.5)'
            ]
          }
        const layerSpec: AnyLayerSpec = {  // This isn't state() and shouldn't be; the eventual MapLibreSyncedLayer.spec is.
          source: mapLibreSourceKey,
          type: layerSpecType,
          layout: {visibility: "visible"},
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

  let mapOptions = $state({
    zoom: undefined,
    center: undefined,
  })

  function handleFiles(files: FileList | null) {
    if (files) {
      [...files].forEach((file) => {
        const pmtilesSource = new LocalPMTilesTileset(file);
        deriveSyncedLayerFromMapLibreSource(addSource(pmtilesSource), nViewers);
        pmtiles.push(pmtilesSource.archive)
      })
    }
  }

</script>

<PMTilesProtocol pmtiles={pmtiles} />

<input type=file multiple onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}/>

<!-- Prove MapLibre maps -->
<div style:display=flex style:height=100% style:width=100%>
  {#each layerGroups.map as [layerGroupKey, layerGroup], iGroup (layerGroupKey)}
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
    <MapLibre
      inlineStyle={"height: 100%; width: 100%;"}
      attributionControl={false}
      bind:zoom={mapOptions.zoom}
      bind:center={mapOptions.center}
    >
      {#each layerGroupEntriesBySource as [sourceKey, layerGroupEntries] (sourceKey)}
        {@const source = sourceManager.mapLibreSources.get(sourceKey)}
        {#await source?.source.spec then sourceSpecOriginal}
          {@const sourceSpec = {...sourceSpecOriginal, ...source?.override, id: sourceKey}}
          {#if sourceSpec.type === "raster"}
            <RasterTileSource {...sourceSpec}>
              {#each layerGroupEntries.entries() as [overrideKey, syncedLayerKey]}
                {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
                <!-- This overwrites nested objects! {@const layerSpec = {...layer?.spec, ...layer?.overrides.get(overrideKey)?.spec}} -->
                {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
                <RasterLayer id={overrideKey} paint={{...layerSpec.paint}} layout={{...layerSpec.layout}} />
              {/each}
            </RasterTileSource>
          {:else if sourceSpec.type === "raster-dem"}
            <RasterDEMTileSource {...sourceSpec}>
              {#each layerGroupEntries.entries() as [overrideKey, syncedLayerKey]}
                {@const layer = syncedMapLibreLayers.get(syncedLayerKey)}
                {@const layerSpec = mergeDeep(layer?.spec, layer?.overrides.get(overrideKey)?.spec)}
                {#if layerSpec.type === "hillshade"}
                  <HillshadeLayer id={overrideKey} paint={{...layerSpec.paint}} layout={{...layerSpec.layout}} />
                {:else if layerSpec.type === "color-relief"}
                  <ColorReliefLayer id={overrideKey} paint={{...layerSpec.paint}} layout={{...layerSpec.layout}} />
                {/if}
              {/each}
            </RasterDEMTileSource>
          {/if}
        {/await}
      {/each}
    </MapLibre>
  {/each}
</div>


<!-- Prove layers by source -->
<!-- <div style:display=grid style:grid-template-columns="1fr auto 0fr" style:overflow-y=scroll>
  <div style:grid-column="-1 / 1">
    Add new synced layer(s) from
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
</div> -->

<!-- Prove sidebar Layer Manager -->
<div
  style:display=grid
  style:grid-template-columns="1fr auto 0fr"
  style:overflow-y=scroll
  style:max-height=300px
  // Firefox scrollbar is over scrollable content, not next to it, so we pad
  style:-moz-padding-end=16px
>
  <div style:grid-column="-1 / 1">
    <h1>Layer Manager Proof</h1>
    <h2>List of layer groups and their respective (override) layers</h2>
  </div>
  <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
    <div><h4>Property</h4></div>
    <div><h4>Value</h4></div>
    <div><h4>Sync</h4></div>
  </div>
  {#each layerGroups.map as [layerGroupKey, layerGroup], iGroup (layerGroupKey)}
    <div style:grid-column="-1 / 1" style:border-top="1px solid white">
      <h3>View {iGroup}</h3>
    </div>
    {#each [...layerGroup.map.entries()].reverse() as [overrideKey, syncedLayerKey] (overrideKey)}
      {@const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey)}
      {@const override = syncedLayer?.overrides.get(overrideKey)}
      <div style:display=flex style:grid-column="-1 / 1">
        <div>
          {syncedMapLibreLayers.get(syncedLayerKey)?.spec.type}
        </div>
        <div>
          <input type=checkbox checked={syncedLayer.spec?.layout?.visibility === "visible"} onchange={(e) => {
            syncedLayer.spec.layout.visibility = e.target.checked ? "visible" : "none";
          }}>
        </div>
      </div>

      {#each Object.keys(syncedLayer.spec?.paint ?? {}) as property (property)}
        <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
          <div>{property}</div>
          <div>
            {#if typeof override.spec?.paint?.[property] !== "undefined"}
              <input type=range max=1 step=0.1 bind:value={override.spec.paint[property]} style:user-select=none/>
            {:else if typeof syncedLayer.spec.paint?.[property] !== "undefined"}
              <input type=range max=1 step=0.1 bind:value={syncedLayer.spec.paint[property]} style:user-select=none/>
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
  @font-face {
    font-family: "SourceSans3-VariableFont_wght";
    font-style: normal;
    src: url('/fonts/SourceSans3-VariableFont_wght.ttf') format('truetype');
  }
  @font-face {
    font-family: "SourceSans3-Italic-VariableFont_wght";
    font-style: italic;
    src: url('/fonts/SourceSans3-Italic-VariableFont_wght.ttf') format('truetype');
  }
  @font-face {
    font-family: "TexgyrepagellaRegular";
    font-style: normal;
    src: url("/fonts/TexgyrepagellaRegular.otf");
  }
  @font-face {
    font-family: "TexgyrepagellaItalic";
    font-style: italic;
    src: url("/fonts/TexgyrepagellaItalic.otf");
  }
  * {
    font-family: SourceSans3-VariableFont_wght;
    font-kerning: normal;
  }
  h1 {
    font-size: 4rem;
    font-family: TexgyrepagellaItalic;
    font-weight: unset;
  }
  h3, h4 {
    text-transform: lowercase;
    font-variant: small-caps;
    color: color-mix(in srgb, currentColor, transparent 30%);
  }
  h2 {
    font-family: TexgyrepagellaRegular;
    font-weight: unset;
  }
  h3 {
    font-weight: 500;
  }
  h4 {
    font-weight: 600;
  }
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
