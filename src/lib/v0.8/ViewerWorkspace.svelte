<!-- Root-level container for a MultiView with taskbars, cross-view controls, and other orchestration -->
<script lang="ts">
  import { PMTilesProtocol } from "@svelte-maplibre-gl/pmtiles";

  import { getSourceManagerContext } from "$lib/shared-context.svelte";
  import MultiViewer from "./MultiViewer.svelte";
  import type { MultiView } from "./views.svelte";
  import ToolButton from "./ToolButton.svelte";

  let {
    multiView,
  }: {
    multiView: MultiView,
  } = $props();

  const sourceManager = getSourceManagerContext();

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
        <div style:display=flex style:border="1px solid gray" style:padding="0 6px" style:align-items=center>
          <label style:display=flex style:gap=2px style:white-space=nowrap>
            {view.name || `View ${i + 1}`}
            <input type=checkbox checked={view.layout.window.state !== "minimized"} onchange={(e) => view.layout.window.state = e.target.checked ? "normal" : "minimized"}>
          </label>
        </div>
      {/each}
    </div>
    <div style:display=flex style:margin-inline-start=auto>
      <ToolButton
        toggle
        --font-size=1.5rem
        symbol=select_window
        symbolOff=select_window_off
        toggled={multiView.layout.window.frame}
        ontoggle={(toggled) => {multiView.layout.window.frame = toggled; multiView.layout.window.titlebar = toggled;}}
        />
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
      gap: var(--gap);
      flex: 0 0;
      background-color: color-mix(in srgb, Canvas, CanvasText 10%);
      align-items: flex-start;
    }
  }
</style>
