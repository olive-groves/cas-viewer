<script lang="ts">
  // Orchestration of sources, synced layers, and layer groups...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, layerGroups } from "$lib/shared.svelte";
  import { RemotePMTilesTileset, type MapLibreSourceSpec, type PMTilesTileset } from "$lib/sources";
  import { MapLibreSyncedLayer, type AnyLayerSpec, type LayerOverride } from "$lib/synced-layer.svelte";

  const localUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localUrlDem = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
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

  let nViewers = $state(2);

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
    const layerSpecType = sourceSpec.type === "raster" ? "raster" : "hillshade";
    const initialPaintSpec =
      layerSpecType === "raster" ?
      {
        "raster-opacity": 0.5,
      } :
      {
        "hillshade-exaggeration": 0.5,
        "hillshade-illumination-direction": 315,
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
    syncedMapLibreLayers.set(
      crypto.randomUUID(),
      syncedLayer
    )
  }
  onMount(() => {
    const initialSourceKeys = initialUrls.map((url) => addSource(sourceFromUrl(url)));

    // For each source, create a synced layer derived from its spec with as many
    // overrides as nViewers, to simulate side by side with the same source
    initialSourceKeys.forEach((sourceKey) => {
      // const mapLibreSource = sourceManager.mapLibreSources.get(sourceKey);
      // console.log(
      //   mapLibreSource?.source
      // )
      deriveSyncedLayerFromMapLibreSource(sourceKey, nViewers)
    })
    // addLayer()
  })

</script>

<h2>List of layer groups and their respective (override) layers</h2>
<h2>List of synced layers and their respective overrides</h2>
{#each syncedMapLibreLayers as [syncedLayerKey, syncedLayer]}
  <div>{syncedLayer.spec.type}</div>
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
{/each}


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
