<!-- Root-level container for a MultiView with taskbars, cross-view controls, and other orchestration -->
<script lang="ts">
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  import { getSourceManagerContext, getSyncedTerraDrawModeManagerContext } from "$lib/shared-context.svelte";

  import { SourceManager, type SourceKey } from '$lib/source-manager.svelte';
  import { MapLibreSyncedLayer, type AnyLayerSpec, type OverrideMapLibreLayerKey, type SyncedMapLibreLayerKey } from '$lib/synced-layer.svelte';

  import MultiViewer from "./MultiViewer.svelte";
  import { SingleView, type MultiView } from "./views.svelte";
  import { ISOLATED_EDIT_MODE_NAME } from "./synced-terra-draw-mode-factory.svelte";
  import FeatureInspectorEditor from "./FeatureInspectorEditor.svelte";
  import { SvelteMap } from "svelte/reactivity";
  import FeatureList from "./FeatureList.svelte";
  import { ColorRelief } from "$lib/ColorRelief.svelte";
  import Colorbar from "$lib/Colorbar.svelte";
  import { syncedMapLibreLayers } from "$lib/shared.svelte";
  import ScaleBar from "$lib/ScaleBar.svelte";

  let {
    multiView,
  }: {
    multiView: MultiView,
  } = $props();

  const sourceManager = getSourceManagerContext();
  const syncedTerraDrawModeManager = getSyncedTerraDrawModeManagerContext();

  const colorRelief = new ColorRelief();
  let globalMaximumPossibleBreakpoint = $state(1000);
  $effect(() => {
    colorRelief.setBreakpoints.max = globalMaximumPossibleBreakpoint;
    colorRelief.setBreakpoints.high = globalMaximumPossibleBreakpoint;
  })

  let maxZoom: number | undefined;
  let metersPerMaxZoomPixel: number | undefined = $state();
  let metersPerPixel = $derived(2**(maxZoom - multiView.camera.zoom) * metersPerMaxZoomPixel);

  const METERS_PER_KEYENCE_HEIGHT_QUANTIZATION_STEP = 0.000000250000011874363;

  let metersPerInteger = $state(METERS_PER_KEYENCE_HEIGHT_QUANTIZATION_STEP);

  // TODO: Separate handler for adding views
  function handleAddViewsOnChange(e: HTMLInputElement) {
    const files = e.files;
    if (files && files.length > 0) {
      handleAddViewsFiles(files);
    }
  }

  async function handleAddViewsFiles(files: FileList) {
    // WARNING: Assumes PMTiles with VG schema (rgb, height, nan) belonging to same date
    // Get content of each source
    // Group sources by

    // Order layers by type
    // Order views by date?
    // FIXME: asynchronously gather sourcekeys

    // Derive the layers from the files
    let layers = (await Promise.all([...files].map(async (file) => {
      const sourceKey = sourceManager.add(SourceManager.fileToSource(file));
      const syncedLayers = await deriveSyncedLayersFromMapLibreSource(sourceKey);
      return syncedLayers
    }))).flat(Infinity)

    // Set all the layers globally
    layers.forEach(({syncedLayer, syncedLayerKey, overrideKey}) => {
      syncedMapLibreLayers.set(syncedLayerKey, syncedLayer)  // TODO: Layers manager? .add() auto generates key
      // const view = new SingleView();
      // view.layers.add(syncedLayerKey, {key: overrideKey});
      // view.drawKeys.instanceKey = syncedTerraDrawModeManager.syncedTerraDraw.addInstance().id;
      // multiView.views.add(view);
    })

    // If RGB, create RGB-ready view
    const rgbLayer = layers.find(({syncedLayer, syncedLayerKey, overrideKey}) => sourceManager.mapLibreSources.get(syncedLayer.spec.source)?.source.source.metadata.modality === "rgb")
    let rgbView;
    let syncedLayer, syncedLayerKey, overrideKey;
    if (rgbLayer) {
      const view = new SingleView();
      ({syncedLayer, syncedLayerKey, overrideKey} = rgbLayer);

      view.layers.add(syncedLayerKey, {key: overrideKey});
      view.drawKeys.instanceKey = syncedTerraDrawModeManager.syncedTerraDraw.addInstance().id;

      const metadata = sourceManager.mapLibreSources.get(syncedLayer.spec.source)?.source.source.metadata;
      const date = metadata ? new Date(metadata.instrument.dateTime) : undefined;
      const name = date ? `RGB ${date.toLocaleDateString()}` : "RGB";
      view.layout.window.title = name;
      view.name = name;

      multiView.views.add(view);
      rgbView = view;
    }
    const hillshadeLayer = layers.find(({syncedLayer, syncedLayerKey, overrideKey}) => syncedLayer.spec.type === "hillshade")
    const colorReliefLayer = layers.find(({syncedLayer, syncedLayerKey, overrideKey}) => syncedLayer.spec.type === "color-relief")
    let heightView;
    if (hillshadeLayer && colorReliefLayer) {
      const view = new SingleView();
      ({syncedLayer, syncedLayerKey, overrideKey} = colorReliefLayer);
      view.layers.add(syncedLayerKey, {key: overrideKey});
      ({syncedLayer, syncedLayerKey, overrideKey} = hillshadeLayer);
      view.layers.add(syncedLayerKey, {key: overrideKey});

      const metadata = sourceManager.mapLibreSources.get(syncedLayer.spec.source)?.source.source.metadata;
      const date = metadata ? new Date(metadata.instrument.dateTime) : undefined;
      const name = date ? `Height ${date.toLocaleDateString()}` : "Height";
      view.layout.window.title = name;
      view.name = name;

      view.drawKeys.instanceKey = syncedTerraDrawModeManager.syncedTerraDraw.addInstance().id;
      multiView.views.add(view);
      heightView = view;
    }

    const nanLayer = layers.find(({syncedLayer, syncedLayerKey, overrideKey}) => sourceManager.mapLibreSources.get(syncedLayer.spec.source)?.source?.source?.metadata?.maskType === "nan-height")
    if (nanLayer) {
      ({syncedLayer, syncedLayerKey, overrideKey} = nanLayer);

      if (rgbView)
        rgbView.layers.add(syncedLayerKey, {key: overrideKey});
      if (heightView)
        heightView.layers.add(syncedLayerKey, {key: overrideKey});
      if (!rgbView && !heightView) {
        const view = new SingleView();
        view.layers.add(syncedLayerKey, {key: overrideKey});

        const metadata = sourceManager.mapLibreSources.get(syncedLayer.spec.source)?.source.source.metadata;
        const date = metadata ? new Date(metadata.instrument.dateTime) : undefined;
        const name = date ? `NaN-height ${date.toLocaleDateString()}` : "NaN-height";
        view.layout.window.title = name;
        view.name = name;

        view.drawKeys.instanceKey = syncedTerraDrawModeManager.syncedTerraDraw.addInstance().id;
        multiView.views.add(view);
        heightView = view;
      }
    }

    // Get all the synced layers to determine which ones raster, hillshade, color-relief, overlay

    // const hillshadeLayer = layers.find((l) => layers.)
  }

  async function deriveSyncedLayersFromMapLibreSource(mapLibreSourceKey: SourceKey) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) return [];
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }
    const metadata = mapLibreSource.source.source.format === "pmtiles" ? await mapLibreSource.source.source.metadata : undefined;

    maxZoom = metadata?.maxzoom ?? undefined;
    const version = metadata.metadataVersion;
    if (version === "0.4.0") {
      metersPerMaxZoomPixel = metadata?.spatialResolutionMeters;
    } else if (version === "0.2.0") {
      metersPerMaxZoomPixel = metadata?.conversionLengthMeters / metadata?.conversionLengthPixels
    }

    // If raster, create raster layer
    if (sourceSpec.type === "raster" || sourceSpec.type === "image") {
      const layerSpecType = "raster";
      const initialPaintSpec = {
        "resampling": "nearest",
        "raster-opacity": 1.0,
      }
      const layerSpec: AnyLayerSpec = {  // This isn't state(); the MapLibreSyncedLayer.spec is.
        source: mapLibreSourceKey,
        type: layerSpecType,
        layout: {visibility: "visible"},
        paint: initialPaintSpec,
      }
      const syncedLayer = new MapLibreSyncedLayer(layerSpec)
      const overrideKey = syncedLayer.addOverride({spec: {}})
      const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
      return [{syncedLayer, syncedLayerKey, overrideKey}]

    // If raster-dem, create hillshade AND color-relief
    } else if (sourceSpec.type === "raster-dem") {
      if (metadata?.maximum && (metadata.maximum > globalMaximumPossibleBreakpoint))
        globalMaximumPossibleBreakpoint = metadata.maximum;
      const layerSpecTypes = ["color-relief", "hillshade"];

      // ———
      const initColorRelief = new ColorRelief();
      initColorRelief.setBreakpoints.max = globalMaximumPossibleBreakpoint;
      initColorRelief.setBreakpoints.high = globalMaximumPossibleBreakpoint;
      // ———
      return layerSpecTypes.map((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "resampling": "nearest",
            "hillshade-illumination-direction": 315,
            "hillshade-exaggeration": 0.5,
            "hillshade-method": 'standard',
          } :
          $state.snapshot(initColorRelief.paint);
          // {
          //   'resampling': 'nearest',
          //   'color-relief-color': [
          //     'interpolate',
          //     ['linear'],
          //     ['elevation'],
          //     0, 'rgba(0, 0, 0, 1)',
          //     metadata?.maximum ?? 5000, 'rgba(0, 255, 0, 1)'
          //   ]
          // }
        const initialBackgroundSpec: Background | undefined =
          layerSpecType === "hillshade" ?
          {
            color: "#7f7f7f",
            opacity: 1.0,
            visibility: false,
          } :
          undefined
        const layerSpec: AnyLayerSpec = {  // This isn't state() and shouldn't be; the eventual instantiated MapLibreSyncedLayer.spec is.
          source: mapLibreSourceKey,
          type: layerSpecType,
          layout: {visibility: "visible"},
          paint: initialPaintSpec,
        }

        const syncedLayer = new MapLibreSyncedLayer(layerSpec, initialBackgroundSpec)
        const overrideKey = syncedLayer.addOverride({spec: {}})
        const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
        return {syncedLayer, syncedLayerKey, overrideKey}
      })
    } else {
      return []
    }
  }

  // ———————————————————————————————————————————————————————————————————————————————————
  syncedTerraDrawModeManager.syncedTerraDraw.onSyncedAddFeaturesListeners.push((features) => {
    console.warn("FIXME: If features were added from an existing JSON via .syncedAddFeatures(), this callback overwrites exiting custom properties, including created-by time.")
    features.forEach((feature) => {
      if (feature.id) {
        const now = new Date();
        syncedTerraDrawModeManager.syncedTerraDraw.updateSnapshotFeatureProperties(feature.id, {
          // reserved: TerraDraw
          // mode: string,
          // marker: bool,

          // file-esque info
          // consider "custom-" prefix?
          created: now.toISOString(),
          modified: now.toISOString(),
          "created-by": authorName,
          "modified-by": authorName,

          // annotation text info
          category: "",
          tags: [],
          title: "",
          comment: {
            created: "",
            modified: "",
            text: "",
            author: "",
            comments: [
              // {
              //   created: "",
              //   modified: "",
              //   text: "",
              //   author: "",
              //   comments: [], // NESTED REPLIES NOT SUPPORTED
              // }
            ],
          },
          camera: $state.snapshot(camera),
          references: [
            // references with respect to... coordinate system? (image -> mercator unity)
          ],
          "coordinate-system": "EPSG:3857",

          // callback which appends props to that object?
          // baseline setter that fills:
          // async for elevation? area? -> no, we await that separately in the UI
          // async for references? filters to unique (no duplicates)
        })
      }
    })
  })

  syncedTerraDrawModeManager.syncedTerraDraw.onSyncedUpdateFeatureGeometryListeners.push((id) => {
    syncedTerraDrawModeManager.syncedTerraDraw.updateSnapshotFeatureProperties(id, {
      modified: new Date().toISOString(),
    })
  })

  $effect(() => {
    const element = document.getElementById(`feature-${syncedTerraDrawModeManager.syncedTerraDraw.selected}`);
    element?.scrollIntoView({block: "center", behavior: "smooth"});
  })

  let authorName = $state("");
  let filterBy = $state("");
  let sidebarExpanded = $state(true);

  const MODE_SYMBOLS = new SvelteMap([
    ["select", "arrow_selector_tool"],
    ["marker", "south_west"],
    ["polyline", "timeline"],
  ])
  // ———————————————————————————————————————————————————————————————————————————————————

  let camera = $state({})

  // A mode where I only see images. That's it.
  // A mode where I see images and most settings.
  // A mode where I see images as framed windows and all settings.
  let mode: "full" | "lite" | "presentation" = $state("full");
  let lights: "on" | "dim" | "out" = $state("on");

  function setCamera(c) {
    camera.zoom = c.zoom;
    camera.lng = c.lng;
    camera.lat = c.lat;
    camera.bearing = c.bearing;
    camera.pitch = c.pitch;
    camera.roll = c.roll;
    camera.elevation = c.elevation;
  }

</script>

<PMTilesProtocol pmtiles={sourceManager.pmtiles} />

<div class=workspace>
  <div class="taskbar unselectable">
    <div class="palette">
      {#each syncedTerraDrawModeManager.syncedTerraDraw.modeNames.filter((m) => !m.includes("edit")) as modeName (modeName)}
        <label class="oneline-input-label" title={modeName}>
          <input
            type="radio"
            name="syncedTerraDrawModeManager.userMode"
            value={modeName}
            checked={modeName === syncedTerraDrawModeManager.userMode}
            onclick={() => syncedTerraDrawModeManager.setUserMode(modeName)}
          />
          <span style:text-transform=capitalize>
            {modeName}
          </span>
        </label>
      {/each}
    </div>
    <div style:display=flex style:overflow-x=auto >
      <select bind:value={multiView.mode.type}>
        {#each ["Side-by-Side", "Lens", "Blink", "Fade"] as modeType}
          <option value={modeType.toLowerCase()}>
            {modeType}
          </option>
        {/each}
      </select>
      {#each multiView.views.order as viewKey, i (viewKey)}
        {@const view = multiView.views.map.get(viewKey)}
        <div class="view-tab">
          <label class=oneline-input-label>
            {view.name || `View ${i + 1}`}
            <input type=checkbox checked={view.layout.window.state !== "minimized"} onchange={(e) => view.layout.window.state = e.target.checked ? "normal" : "minimized"}>
          </label>
        </div>
      {/each}
      <div class="add-view-tab">
      <!-- TODO: Parameterized accept for supported filetypes (PMTiles et al.) -->
        <input
        type="file"
        multiple
        accept=".pmtiles"
        id="add-view-input"
        onchange={(e) => handleAddViewsOnChange((e.target as HTMLInputElement))}
        />
        <button onclick={() => document.getElementById("add-view-input")?.click()}>
          + Views
        </button>
      </div>
    </div>
    <label class=oneline-input-label style:margin-inline-start=auto>
      Window Frames
      <input
        type=checkbox
        checked={multiView.layout.window.frame}
        onchange={(e) => {multiView.layout.window.frame = e.target.checked; multiView.layout.window.titlebar = e.target.checked;}}>
    </label>
    <label class=oneline-input-label>
      Sidebar
      <input type="checkbox" bind:checked={sidebarExpanded} />
    </label>
  </div>
  <div class="main stack">
    <MultiViewer
      {...multiView}
      bind:camera
      bind:mode={multiView.mode}
      bind:layout={multiView.layout}
    />

    {#if syncedTerraDrawModeManager.syncedTerraDraw.selected !== null}
      {@const feature = syncedTerraDrawModeManager.syncedTerraDraw.snapshot.find((f) => f.id === syncedTerraDrawModeManager.syncedTerraDraw.selected)}
      <div class="context">
      <!-- FIXME: Feature inspector should emit ID -->
        <FeatureInspectorEditor
          mode={syncedTerraDrawModeManager.actualMode === ISOLATED_EDIT_MODE_NAME ? "editing" : "selected"}
          properties={feature?.properties}
          geometry={feature?.geometry}
          onEditClick={() => syncedTerraDrawModeManager.syncedTerraDraw.selected !== null && syncedTerraDrawModeManager.selectIsolatedEdit(syncedTerraDrawModeManager.syncedTerraDraw.selected)}
          onZoomToFitClick={() => setCamera(feature?.properties?.camera)}
          onCaptureView={() => feature.properties.camera = $state.snapshot(camera)}
          onDoneClick={() => syncedTerraDrawModeManager.deselectIsolatedEdit(undefined, true)}
          onSelectedCloseClick={() => syncedTerraDrawModeManager.syncedTerraDraw.syncedDeselectFeature(undefined, null)}
          onEditingCloseClick={() => syncedTerraDrawModeManager.deselectIsolatedEdit(undefined, true)}
          onDrawAnotherClick={() => syncedTerraDrawModeManager.deselectIsolatedEdit(feature?.properties?.mode)}
          onDeleteClick={() => {
            const dialog = document.getElementById("dialog-delete-selected");
            dialog?.showModal();
          }}
        />
        <dialog id="dialog-delete-selected">
          <h2>Delete selected feature?</h2>
          <p>Are you sure you want to delete the selected feature?</p>
          <div class="actionbar">
            <button commandfor="dialog-delete-selected" command="close">Cancel</button>
            <button
              onclick={() => {if (syncedTerraDrawModeManager.syncedTerraDraw.selected) {const d = syncedTerraDrawModeManager.syncedTerraDraw.selected; syncedTerraDrawModeManager.deselectIsolatedEdit(); syncedTerraDrawModeManager.syncedTerraDraw.syncedRemoveFeatures(undefined, [d]);}}}
              commandfor="dialog-delete-selected" command="close">
              Delete
            </button>
          </div>
        </dialog>
      </div>
    {/if}

    <div class="statistics">
      <!-- <div class="scalebar">
        <ScaleBar {metersPerPixel} />
      </div> -->
      <div class="colorbar">
        <Colorbar
          min={colorRelief.setBreakpoints.low * metersPerInteger}
          max={colorRelief.setBreakpoints.high * metersPerInteger}
          --background-color=transparent
          --gradient={`linear-gradient(
            to top,
            ${colorRelief.colormapArray.join(", ")}
          )`}
        />
      </div>
    </div>


  </div>

  {#if sidebarExpanded}
    <div class="sidebar">

      <details open>
        <summary class="unselectable">Annotations</summary>
        <div>
          <label>
            Author name:
            <input type="text" bind:value={authorName} placeholder="Enter your author name" />
          </label>
        </div>
        <div class="filter">
          <form>
            <label>
              Filter:
              <input name="filter" type="text" bind:value={filterBy} placeholder="Text to filter" />
              <input style:display={!filterBy ? "none" : ""} type="reset" value="Clear"  />
            </label>
          </form>
        </div>
        <FeatureList
          features={filterBy ? syncedTerraDrawModeManager.syncedTerraDraw.snapshot.filter((f) => (f.properties.category.includes(filterBy) || f.properties.tags.some((t) => t.includes(filterBy)) || f.properties.title.includes(filterBy) || f.properties.comment.text.includes(filterBy))) : syncedTerraDrawModeManager.syncedTerraDraw.snapshot}
          selectedFeature={syncedTerraDrawModeManager.syncedTerraDraw.selected}
          onFeatureHoverStart={(id) => syncedTerraDrawModeManager.syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: true})}
          onFeatureHoverEnd={(id) => syncedTerraDrawModeManager.syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: undefined})}
          onFeatureClick={(id) => {
            if (syncedTerraDrawModeManager.actualMode === ISOLATED_EDIT_MODE_NAME) {
              syncedTerraDrawModeManager.selectIsolatedEdit(id);
            } else {
              syncedTerraDrawModeManager.setUserMode("select");
              syncedTerraDrawModeManager.syncedTerraDraw.syncedSelectFeature(undefined, id);
            }
          }}
          onFeatureDoubleClick={(id) => setCamera(syncedTerraDrawModeManager.syncedTerraDraw.snapshot.find((f) => f.id === id) ?.properties?.camera)}
          onFeatureEdit={(id) => syncedTerraDrawModeManager.selectIsolatedEdit(id)}
        />
      </details>

    </div>
  {/if}
</div>

<style>
  .workspace {
    flex: 1;
    min-height: 0;

    display: grid;
    grid-template-areas:
      "task   task"
      "main   nav"
      "status status";
    grid-template-rows: 0fr 1fr 0fr;
    grid-template-columns: 1fr 0fr;

    background: black;
    .taskbar {
      grid-area: task;
      display: flex;
      gap: calc(3 * var(--gap));
      flex: 0 0;
      background-color: color-mix(in srgb, Canvas, CanvasText 10%);
      align-items: baseline;
      padding: 0 var(--gap);
    }
    .palette {
      align-self: center;

      display: flex;
      overflow-x: auto;
      overflow-y: hidden;
      gap: calc(2 * var(--gap));
      padding-left: var(--gap);
    }
    .main {
      grid-area: main;
      place-items: stretch;
    }
    .sidebar {
      align-self: stretch;
      justify-self: end;
      z-index: 1;

      width: 23em;
      display: flex;
      flex-direction: column;
      min-height: 0;

      border-left: 1px solid color-mix(in srgb, currentColor, transparent 75%);
      background: Canvas;
      details {
        border: 1px solid transparent;
        summary {
          font-size: 1.2rem;
          font-weight: 500;
        }
        &:has(summary:hover) {
          border-color: color-mix(in srgb, CanvasText, Canvas 50%);
        }
      }
      details::details-content {
        display: flex;
        flex-direction: column;
        gap: var(--gap);
      }
    }
    .filter {
      input[type=text]:not(:placeholder-shown) {
        border-color: color-mix(in srgb, greenyellow, transparent 25%);
        outline-color: greenyellow
      }
    }
    .context {
      align-self: start;
      justify-self: end;
      z-index: 1;
      margin: var(--gap);
      width: 100%;
      max-width: 350px;
      overflow-y: auto;
      filter: drop-shadow(5px 5px 10px black);
    }
    dialog {
      border: 1px solid;
      padding: calc(2* var(--gap));
      &::backdrop{
        background-color: color-mix(in srgb, Canvas, transparent 25%);
      }
      .actionbar {
        padding-top: 1lh;
        display: flex;
        flex-direction: row-reverse;
        gap: var(--gap);
        button {
          padding: 0 var(--gap);
        }
      }
    }
  }
  .oneline-input-label {
    display: flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
  }
  .view-tab {
    display: flex;
    border: 1px solid color-mix(in srgb, CanvasText, transparent 85%);
    padding: 0 var(--gap);
    align-items: center;
  }
  .add-view-tab {
    border: 1px solid color-mix(in srgb, CanvasText, transparent 85%);
    input[type=file] {
      display: none;
    }
    button {
      padding: 0 calc(2 * var(--gap));
    }
  }
  .statistics {
    z-index: 1;
    align-self: center;
    justify-self: start;
    pointer-events: none;
    filter: drop-shadow(0 0 5px black) drop-shadow(0px 0px 2px black);

    max-height: 500px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: calc(3 * var(--gap));
    .colorbar {
      display: flex;
      max-height: 400px;
      height: 100%;
    }

  }
</style>
