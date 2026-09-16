<!-- Root-level container for a MultiView with taskbars, cross-view controls, and other orchestration -->
<script lang="ts">
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  import { getSourceManagerContext, getSyncedTerraDrawContext } from "$lib/shared-context.svelte";
  import MultiViewer from "./MultiViewer.svelte";
  import type { MultiView } from "./views.svelte";

  let {
    multiView,
  }: {
    multiView: MultiView,
  } = $props();

  const sourceManager = getSourceManagerContext();
  const syncedTerraDraw = getSyncedTerraDrawContext();

  let camera = $state({
    zoom: undefined,
    center: undefined,
  })

  // A mode where I only see images. That's it.
  // A mode where I see images and most settings.
  // A mode where I see images as framed windows and all settings.
  let mode: "full" | "lite" | "presentation" = $state("full");
  let lights: "on" | "dim" | "out" = $state("on");

</script>

<PMTilesProtocol pmtiles={sourceManager.pmtiles} />

<!-- Side panel is not here. Yet. -->
<!-- Container to hold taskbar, MultiViewer, status bar, etc. -->
<div class=workspace>
  <div class="taskbar unselectable">
    <div style:display=flex style:overflow-x=auto style:border="1px solid gray" style:align-items=center>
      {#each syncedTerraDraw.modeNames as modeName (modeName)}
        <div style:display=flex style:padding="0 4px" style:align-items=center>
          <label class=oneline-input-label>
            <input
              type="radio"
              name="drawMode"
              group={syncedTerraDraw.userMode}
              value={modeName}
              onclick={() => syncedTerraDraw.setUserMode(modeName)}
            />
            <span style:text-transform=capitalize>
              {modeName}
            </span>
          </label>
        </div>
      {/each}
    </div>
    <div style="margin-inline-start: var(--gap); margin-inline-end: var(--gap); align-self: center;">
      ·
    </div>
    <div>
      <select bind:value={multiView.mode.type}>
        {#each ["Side-by-Side", "Lens", "Blink", "Fade"] as modeType}
          <option value={modeType.toLowerCase()}>
            {modeType}
          </option>
        {/each}
      </select>
    </div>
    <div style:display=flex style:overflow-x=auto>
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
    <div style:display=flex style:margin-inline-start=auto style:border="1px solid gray" style:padding="0 4px" style:align-items=center>
      <label class=oneline-input-label>
        Window Frames
        <input
          type=checkbox
          checked={multiView.layout.window.frame}
          onchange={(e) => {multiView.layout.window.frame = e.target.checked; multiView.layout.window.titlebar = e.target.checked;}}>
      </label>
    </div>
  </div>
  <MultiViewer
    {...multiView}
    bind:camera
    bind:mode={multiView.mode}
    bind:layout={multiView.layout}
  />
</div>

<style>
  .workspace {
    display: flex;
    width: 100%;
    flex-direction: column;
    background: black;
    .taskbar {
      display: flex;
      gap: calc(var(--gap));
      flex: 0 0;
      background-color: color-mix(in srgb, Canvas, CanvasText 10%);
      align-items: flex-start;
    }
  }
  .oneline-input-label {
    display: flex;
    gap: 2px;
    white-space: nowrap;
  }
</style>
