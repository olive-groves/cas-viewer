<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw as TerraDrawSvelte } from '@svelte-maplibre-gl/terradraw';
  import { SyncedTerraDraw, SyncedTerraDrawModeManager } from '$lib/v0.8/synced-terra-draw.svelte';
  import { modeFactory, ISOLATED_EDIT_MODE_NAME } from "$lib/v0.8/synced-terra-draw-mode-factory.svelte";
  import SyncedTerraDrawSetup from '$lib/v0.8/SyncedTerraDrawSetup.svelte';
  import FeatureList from '$lib/v0.8/FeatureList.svelte';
  import FeatureInspectorEditor from '$lib/v0.8/FeatureInspectorEditor.svelte';

  // Proof
  let syncedTerraDraw = new SyncedTerraDraw(modeFactory);
  let modeManager = new SyncedTerraDrawModeManager(syncedTerraDraw, {modeOnDeselect: "select"});

  let zoom = $state(0)
  let center = $state([0, 0])
  let pitch = $state(0)
  let bearing = $state(0)
  let roll = $state(0)

  syncedTerraDraw.addInstance("0");
  syncedTerraDraw.addInstance("1");

  let render = $state(true);

  syncedTerraDraw.onSyncedAddFeaturesListeners.push((features) => {
    console.warn("FIXME: If features were added from an existing JSON via .syncedAddFeatures(), this callback overwrites exiting custom properties, including created-by time.")
    features.forEach((feature) => {
      if (feature.id) {
        const now = new Date();
        syncedTerraDraw.updateSnapshotFeatureProperties(feature.id, {
          // reserved: TerraDraw
          // mode: string,
          // marker: bool,

          // file-esque info
          // consider "custom-" prefix?
          created: now.toISOString(),
          modified: now.toISOString(),
          "created-by": "Author W. Created",
          "modified-by": "Author W. Modified",

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
              {
                text: "Reply 1.",
                created: now.toISOString(),
              },
              {
                text: "Reply 2."
              },
            ],
          },
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

  syncedTerraDraw.onSyncedUpdateFeatureGeometryListeners.push((id) => {
    syncedTerraDraw.updateSnapshotFeatureProperties(id, {
      modified: new Date().toISOString(),
    })
  })

  $effect(() => {
    const element = document.getElementById(`feature-${syncedTerraDraw.selected}`);
    element?.scrollIntoView({block: "center", behavior: "smooth"});
  })

  let tags = $state([
    "urgent",
    "resolved",
  ])

</script>

<SyncedTerraDrawSetup
  id={syncedTerraDraw.id}
  bind:map={syncedTerraDraw.map}
  bind:draw={syncedTerraDraw.draw}
  modeFactory={syncedTerraDraw.modeFactory}
/>

<div class="container">
  <div class="viewer stack">
    <div class="views">
      <!-- WARNING: DO NOT USE entries(); CLEARS TERRADRAW LAYERS {#each syncedTerraDraw.instances.entries() as instance (instance.id)} -->
      {#each syncedTerraDraw.instances.values() as instance, i (instance.id)}
        {#if render || i }
          <MapLibre
            inlineStyle="height: 100%; width: 100%;"
            renderWorldCopies={false}
            attributionControl={false}
            transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
            bind:zoom
            // @ts-ignore
            bind:center
            bind:pitch
            bind:bearing
            bind:roll
          >
            <BackgroundLayer
              layout={{visibility: "visible"}}
              paint={{"background-color": `rgb(${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)})`}}
            />
            <TerraDrawSvelte
              mode={modeManager.actualMode}
              {...instance}
              bind:draw={instance.draw}
              modes={instance.modeFactory()}
            />
          </MapLibre>
        {/if}
      {/each}
    </div>

    <div class="controls unselectable">
      <button onclick={() => syncedTerraDraw.addInstance()}>
        + Viewer
      </button>
      <button onclick={() => render = !render}>
        {render ? "Unrender" : "Render"}
      </button>
      {#each syncedTerraDraw.modeNames as modeName (modeName)}
        {#if !modeName.includes("edit")}
          <label class=unselectable>
            <input
              type="radio"
              name="syncedTerraDraw.userMode"
              value={modeName}
              checked={modeName === modeManager.userMode}
              onclick={() => modeManager.setUserMode(modeName)}
            />
            {modeName}
          </label>
        {/if}
      {/each}
      <div>
        (Actual mode: {modeManager.actualMode})
      </div>
    </div>

    {#if syncedTerraDraw.selected !== null}
      {@const feature = syncedTerraDraw.snapshot.find((f) => f.id === syncedTerraDraw.selected)}
      <div class="context">
        <FeatureInspectorEditor
          mode={modeManager.actualMode === ISOLATED_EDIT_MODE_NAME ? "editing" : "selected"}
          properties={syncedTerraDraw.snapshot.find((f) => f.id === syncedTerraDraw.selected).properties}
          geometry={feature?.geometry}
          onEditClick={() => syncedTerraDraw.selected !== null && modeManager.selectIsolatedEdit(syncedTerraDraw.selected)}
          onDoneClick={() => modeManager.deselectIsolatedEdit(undefined, true)}
          onSelectedCloseClick={() => syncedTerraDraw.syncedDeselectFeature(undefined, null)}
          onEditingCloseClick={() => modeManager.deselectIsolatedEdit(undefined, true)}
          onDrawAnotherClick={() => modeManager.deselectIsolatedEdit(feature?.properties?.mode)}
          onDeleteClick={() => {
            modeManager.deselectIsolatedEdit();
          }}
        />
      </div>
    {/if}
  </div>

  <div class=sidebar>

    <details open>
      <summary class="unselectable">Annotations</summary>
      <FeatureList
        features={syncedTerraDraw.snapshot}
        selectedFeature={syncedTerraDraw.selected}
        onFeatureHoverStart={(id) => syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: true})}
        onFeatureHoverEnd={(id) => syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: undefined})}
        onFeatureClick={(id) => {
          if (modeManager.actualMode === ISOLATED_EDIT_MODE_NAME) {
            modeManager.selectIsolatedEdit(id);
          } else {
            modeManager.setUserMode("select");
            syncedTerraDraw.syncedSelectFeature(undefined, id);
          }
        }}
        onFeatureDoubleClick={() => console.warn("Implement fit-feature-on-map.")}
        onFeatureEdit={(id) => modeManager.selectIsolatedEdit(id)}
      />
    </details>

  </div>
</div>

<style>
  .container {
    flex: 1;
    min-height: 0;

    display: flex;
    .viewer {
      flex: 1;
      .views {
        align-self: stretch;
        justify-self: stretch;

        display: flex;
    }
    }
  }
  .controls {
    align-self: start;
    justify-self: start;
    z-index: 1;

    display: flex;

    gap: 1em;
    background-color: black;
  }
  .sidebar {
    align-self: stretch;
    justify-self: end;
    z-index: 1;

    min-width: 40ch;

    display: flex;
    flex-direction: column;
    min-height: 0;

    background-color: rgba(0, 0, 0, 25%);
  }

  .context {
    align-self: start;
    justify-self: end;
    z-index: 1;
    margin: var(--gap);
    width: 100%;
    max-width: 350px;
    overflow-y: auto;
  }
</style>
