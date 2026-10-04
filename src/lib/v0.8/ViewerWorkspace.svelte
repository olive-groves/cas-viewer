<!-- Root-level container for a MultiView with taskbars, cross-view controls, and other orchestration -->
<script lang="ts">
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  import { getSourceManagerContext, getSyncedTerraDrawModeManagerContext } from "$lib/shared-context.svelte";
  import MultiViewer from "./MultiViewer.svelte";
  import type { MultiView } from "./views.svelte";
  import { ISOLATED_EDIT_MODE_NAME } from "./synced-terra-draw-mode-factory.svelte";
  import FeatureInspectorEditor from "./FeatureInspectorEditor.svelte";
  import { SvelteMap } from "svelte/reactivity";
  import FeatureList from "./FeatureList.svelte";

  let {
    multiView,
  }: {
    multiView: MultiView,
  } = $props();

  const sourceManager = getSourceManagerContext();
  const syncedTerraDrawModeManager = getSyncedTerraDrawModeManagerContext();

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
        <div style:display=flex style:border="1px solid gray" style:padding="0 4px" style:align-items=center>
          <label class=oneline-input-label>
            {view.name || `View ${i + 1}`}
            <input type=checkbox checked={view.layout.window.state !== "minimized"} onchange={(e) => view.layout.window.state = e.target.checked ? "normal" : "minimized"}>
          </label>
        </div>
      {/each}
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
</style>
