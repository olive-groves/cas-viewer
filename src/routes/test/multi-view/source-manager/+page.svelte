<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <!-- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" /> -->
</svelte:head>

<script lang="ts">
  //////////////////////////////////////////////////////////////////////////////////////
  // Orchestration of sources, synced layers, and layer groups...
  // Viewer Manager?
  import { sourceManager, syncedMapLibreLayers, layerGroups, multiView, syncedMapLibreSurfaces } from "$lib/shared.svelte";
  import { LocalPMTilesTileset, LocalSingleImage, RemotePMTilesTileset, RemoteSingleImage, SingleImage, type PMTilesTileset } from "$lib/sources";
  import { MapLibreSyncedLayer, MapLibreSyncedSurface, type AnyLayerSpec, type Background, type LayerOverride, type SurfaceSpec, type SyncedMapLibreLayerKey, type SyncedMapLibreSurfaceKey } from "$lib/synced-layer.svelte";
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";
  import { PMTiles } from "pmtiles";

  // FIXME: Clear for development purposes —————————————————————————————————————————————
  sourceManager.sources.forEach((_, key) => sourceManager.delete(key));
  syncedMapLibreLayers.forEach((_, key) => syncedMapLibreLayers.delete(key));
  syncedMapLibreSurfaces.forEach((_, key) => syncedMapLibreSurfaces.delete(key));
  layerGroups.map.forEach((_, key) => layerGroups.delete(key));
  multiView.views.map.forEach((_, key) => multiView.views.delete(key))
  // ———————————————————————————————————————————————————————————————————————————————————

  const localPmtilesUrl = new URL('/local/bagunca-2025-10-21T1629/rgb.pmtiles', import.meta.url);
  const localPmtilesDemUrl = new URL('/local/bagunca-2025-10-21T1629/height.pmtiles', import.meta.url);
  const localJpgUrl = new URL('/local/almond-blossom.jpg', import.meta.url);
  const localPngUrl = new URL('/local/impasto.png', import.meta.url);
  // const initialUrls = [localPmtilesUrl, localPmtilesDemUrl, localPngUrl];
  const initialUrls = [localPmtilesUrl, localPmtilesDemUrl];

  function sourceFromUrl(url: URL): PMTilesTileset | SingleImage {
    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith(".json")) {
      // TODO: return new TileJSONTileset(url);
      throw Error("JSON not yet supported")
    } else if (pathname.endsWith(".pmtiles")) {
      return new RemotePMTilesTileset(url.toString());
    } else if ([".jpeg", ".jpg", ".png"].some((extension) => pathname.endsWith(extension))) {
      return new RemoteSingleImage(url.toString());
    } else {
      throw Error("Unable to parse source from url")
    }
  };

  function addSource(source: PMTilesTileset | SingleImage) {
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

  //////////////////////////////////////////////////////////////////////////////////////
  // Proof
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { SingleView } from "$lib/v0.8/views.svelte";
  import type { SourceKey } from "$lib/source-manager.svelte";
  import MultiViewer from "$lib/v0.8/MultiViewer.svelte";

  // >16 in Chromium throws "Too many active WebGL contexts. Oldest context will be lost."
  const nViewers = 6;
  // svelte-ignore state_referenced_locally
  [...Array(nViewers).keys()].map(() => multiView.views.add(new SingleView()))

  async function deriveSyncedLayerFromMapLibreSource(
    mapLibreSourceKey: SourceKey,
    nOverrides: number,
  ) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) return;
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }

    if (sourceSpec.type === "raster" || sourceSpec.type === "image") {  // If raster, add a raster layer to each group
      const layerSpecType = "raster";
      const initialPaintSpec = {
        "raster-opacity": 0.8,
      }
      const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
        source: mapLibreSourceKey,
        type: layerSpecType,
        layout: {visibility: "visible"},
        paint: initialPaintSpec,
      }
      const syncedLayer = new MapLibreSyncedLayer(layerSpec)
      const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedLayer.addOverride({spec: {}}))
      const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
      syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
      // For each (single)view, add the synced layer with one of the overrides.
      multiView.views.order.forEach((viewKey, viewIndex) => {
        const view = multiView.views.map.get(viewKey);
        if (view?.type === "single") {
          (view as SingleView).layers.add(syncedLayerKey, {key: overrideKeys.at(viewIndex)})
        }
      })
    } else if (sourceSpec.type === "raster-dem") {  // If raster-dem, add a hillshade AND color-relief layer to each group
      const layerSpecTypes = ["color-relief", "hillshade"];
      layerSpecTypes.forEach((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "hillshade-illumination-direction": 90,
            "hillshade-exaggeration": 0.5,
          } :
          {
            'color-relief-color': [
              'interpolate',
              ['linear'],
              ['elevation'],
              0, 'rgba(0, 0, 0, 0)',
              1, 'rgba(4, 0, 108, 0.5)',
              5000, 'rgba(215, 5, 13, 0.5)'
            ]
          }
        const initialBackgroundSpec: Background | undefined =
          layerSpecType === "hillshade" ?
          {
            color: "#7f7f7f",
            opacity: 0.8,
            visibility: true,
          } :
          undefined
        const layerSpec: AnyLayerSpec = {  // This isn't state() and shouldn't be; the eventual MapLibreSyncedLayer.spec is.
          source: mapLibreSourceKey,
          type: layerSpecType,
          layout: {visibility: "visible"},
          paint: initialPaintSpec,
        }

        const syncedLayer = new MapLibreSyncedLayer(layerSpec, initialBackgroundSpec)
        const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedLayer.addOverride({spec: {}}))
        const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
        syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
        // For each (single)view, add the synced layer with one of the overrides.
        multiView.views.order.forEach((viewKey, viewIndex) => {
          const view = multiView.views.map.get(viewKey);
          if (view?.type === "single") {
            (view as SingleView).layers.add(syncedLayerKey, {key: overrideKeys.at(viewIndex)})
          }
        })
      })
    }
  }

  async function derivedSyncedSurfaceFromMapLibreSource(
    mapLibreSourceKey: SourceKey,
    nOverrides: number,
  ) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) {
      return
    }
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }
    if (sourceSpec.type !== "raster-dem") {
      return
    }
    const surfaceSpec: SurfaceSpec = {
      source: mapLibreSourceKey,
      layout: {
        enabled: true,
        exaggeration: 10,
      }
    }
    const syncedSurface = new MapLibreSyncedSurface(surfaceSpec)
    const overrideKeys = [...Array(nOverrides).keys()].map(() => syncedSurface.addOverride({spec: {}}))
    const syncedSurfaceKey: SyncedMapLibreSurfaceKey = `synced-maplibre-surface_${crypto.randomUUID()}`;
    syncedMapLibreSurfaces.set(syncedSurfaceKey, syncedSurface);
    // For each (single)view, set the synced surface with one of the overrides.
    multiView.views.order.forEach((viewKey, viewIndex) => {
      const view = multiView.views.map.get(viewKey);
      if (view?.type === "single") {
        (view as SingleView).surface.overrideKey = overrideKeys.at(viewIndex);
        (view as SingleView).surface.syncedSurfaceKey = syncedSurfaceKey;
      }
    })
  }

  onMount(() => {

    const initialSourceKeys = initialUrls.map((url) => addSource(sourceFromUrl(url)));
    // For each source, create a synced layer derived from its spec with as many
    // overrides as nViewers, to simulate side by side with the same source
    initialSourceKeys.forEach((sourceKey) => {
      deriveSyncedLayerFromMapLibreSource(sourceKey, nViewers)
    })

    const sloppySurfaceSourceKeys = initialUrls.map((url) => addSource(sourceFromUrl(url)));
    // SLOPPY: For each source, (attempt to) create a synced surface dervied from its
    // spec with as many overrides as nViewers.
    sloppySurfaceSourceKeys.forEach((sourceKey) => {
      derivedSyncedSurfaceFromMapLibreSource(sourceKey, nViewers)
    })
  })

  function handleFiles(files: FileList | null) {
    if (files) {
      [...files].forEach((file) => {
        let source;
        if (file.name.endsWith("pmtiles")) {
          source = new LocalPMTilesTileset(file);
          pmtiles.push(source.archive)
        } else if ([".jpeg", ".jpg", ".png"].some((extension) => file.name.endsWith(extension))) {
          source = new LocalSingleImage(file);
        } else {
          throw Error(`File not supported: ${file.name}.`)
        }
        deriveSyncedLayerFromMapLibreSource(addSource(source), nViewers);
      })
    }
  }

  let camera = $state({
    zoom: undefined,
    center: undefined,
  })

</script>

<PMTilesProtocol pmtiles={pmtiles} />


<div style:display=flex style:height=100% style:width=100% style:overflow=hidden>

  <MultiViewer {...multiView} bind:camera bind:mode={multiView.mode} />

  <div style:display=flex style:flex-direction=column>

    <input type=file multiple onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}/>

    <div
      style:display=grid
      style:grid-template-columns="1fr auto 0fr"
      style:overflow-y=scroll
      style:padding-right=4px
      style:-moz-padding-end=16px
    >
      <div style:grid-column="-1 / 1">
        <h1>View–Layer Manager Proof</h1>
        <h2>List of views and their respective (override) layers</h2>
      </div>
      <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
        <div><h4>Property</h4></div>
        <div><h4>Value</h4></div>
        <div><h4>Sync</h4></div>
      </div>
      {#each multiView.views.map as [viewKey, view], viewIndex (viewKey)}
        {@const syncedSurface = syncedMapLibreSurfaces.get(view?.surface?.syncedSurfaceKey)}
        {@const overrideSurface = syncedSurface?.overrides.get(view?.surface?.overrideKey)}
        <div style:grid-column="-1 / 1" style:border-top="2px solid white" style:margin-top=14px>
          <h3>View {viewIndex + 1}</h3>
        </div>
        {#each [...view.layers.order].reverse() as overrideKey (overrideKey)}
          {@const syncedLayerKey = view.layers.map.get(overrideKey)}
          {@const syncedLayer = syncedMapLibreLayers.get(syncedLayerKey)}
          {@const override = syncedLayer?.overrides.get(overrideKey)}
          <div animate:flip={{duration: 200}} style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1">
            <div style:display=flex style:grid-column="-1 / 1" style:border-top="1px solid oklch(1 0 0 / 0.2)">
              <div>
                <input type=checkbox checked={syncedLayer.spec?.layout?.visibility === "visible"} onchange={(e) => {
                  syncedLayer.spec.layout.visibility = e.target.checked ? "visible" : "none";
                }}>
              </div>
              <div>
                <button onclick={() => view.layers.shiftByKey(overrideKey, 1)}>
                  <span class="material-symbols-outlined">
                    keyboard_arrow_up
                  </span>
                </button>
                <button onclick={() => view.layers.shiftByKey(overrideKey, -1)}>
                  <span class="material-symbols-outlined">
                    keyboard_arrow_down
                  </span>
                </button>
              </div>
              <div>
                {syncedLayer?.spec.type}
              </div>
            </div>

            {#each Object.keys(syncedLayer.spec?.paint ?? {}) as property (property)}
              <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1" style:padding-left="6px">
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
          </div>
        {/each}

        <div style:display=flex style:grid-column="-1 / 1" style:border-top="4px solid oklch(1 0 0 / 0.2)">
          <div>
            <input type=checkbox checked={syncedSurface?.spec?.layout?.enabled} onchange={(e) => {
              syncedSurface.spec.layout.enabled = e.target.checked;
            }}>
          </div>
          <div>
            surface
          </div>
        </div>

        <div style:display=grid style:grid-template-columns=subgrid style:grid-column="-1 / 1" style:padding-left="6px">
          <div>exaggeration</div>
          <div>
            {#if typeof overrideSurface?.spec?.layout?.exaggeration !== "undefined"}
              <input type=range max=100 step=1 bind:value={overrideSurface.spec.layout.exaggeration} style:user-select=none/>
            {:else if typeof syncedSurface?.spec?.layout?.exaggeration !== "undefined"}
              <input type=range max=100 step=1 bind:value={syncedSurface.spec.layout.exaggeration} style:user-select=none/>
            {/if}
          </div>
          <div style:align-self=center style:justify-self=center>
            <input type=checkbox checked={overrideSurface?.spec?.layout?.exaggeration === undefined} onchange={(e) => {
              if (e.target.checked) {
                delete overrideSurface?.spec?.layout?.exaggeration;
              } else {
                overrideSurface.spec.layout = {...overrideSurface?.spec?.layout, exaggeration: syncedSurface.spec.layout.exaggeration}
              }
            }}>
          </div>
        </div>
      {/each}
    </div>

  </div>
</div>

<!-- MapLibre-knowing?
Svelte-agnostic.
Class LayerManager
  layers  // object of layers, each with their source, type, etc., manager-id (unique)
  addLayer  // add a layer to the list with a source, type, etc., id
  removeLayer  // remove a layer using its id
  reorderLayer  // using 'beforeId'? or index? do we rearrange whole layers object?
  numberOfLayers  // derived n of layers? (convenience for slot-layers?) -->


<style>
  .material-symbols-outlined {
    font-size: 0.8rem;
    font-variation-settings:
    'FILL' 0,
    'wght' 700,
    'GRAD' 0,
    'opsz' 24
  }
  button:has(>.material-symbols-outlined) {
    line-height: 0;
  }

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
    line-height: 0.9;
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
