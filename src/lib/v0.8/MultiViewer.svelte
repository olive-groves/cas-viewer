<script lang="ts">
  import MultiViewer from '$lib/v0.8/MultiViewer.svelte';
  import SingleViewer from '$lib/v0.8/SingleViewer.svelte';
  import { cubicInOut, cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { type ViewMode, type ViewLayout, type ViewPreview, SingleView, type ViewKey, MultiView } from './views.svelte';
	import type { Attachment } from 'svelte/attachments';
  import DropZone from "$lib/v0.8/DropZone.svelte";
  import { scale } from 'svelte/transition';
  import { getSourceManagerContext, getSyncedMapLibreLayersContext, getSyncedMapLibreSurfacesContext } from "$lib/shared-context.svelte";
  import { SourceManager, type SourceKey } from '$lib/source-manager.svelte';
  import { MapLibreSyncedLayer, type AnyLayerSpec, type SyncedMapLibreLayerKey } from '$lib/synced-layer.svelte';
  const sourceManager = getSourceManagerContext();
  const syncedMapLibreLayers = getSyncedMapLibreLayersContext();
  const syncedMapLibreSurfaces = getSyncedMapLibreSurfacesContext();

  let {
    views,
    camera = $bindable({}),
    mode = $bindable({type: "side-by-side"}),
    layout = $bindable({window: "normal"}),
    preview = $bindable({}),
  }: {
    views: any,  // FIXME: MultiView.views OrderedSvelteMap<ViewKey, SingleView | MultiView>
    camera: any,
    mode: ViewMode,
    layout: ViewLayout,
    preview: ViewPreview,
  } = $props();

  // TODO: Instead of fold, separate taskbar from MultiViewer:
  // MultiViewerWindow(Taskbar(multiView), MultiViewer(multiView))
  // Have floating taskbar even, with nested taskbar elements:
  // Multi(View 1, View 2) Multi(Multi(View 3, View 4), View 5)
  // TODO: Optionally fold multiviews?
  // Example 1:
  // I have a multiview.
  // I pass its views to this.
  // There is only one view.
  // That view is a multiview.
  // That multiview has only one view.
  // Instead of multiview(multiview(view)), do multiview(view).
  //
  // Generic:
  // I have a multiview.
  // I pass its views to this.
  // For each view that is multiview and has just one (multi)view, fold the view:
  //  MULTIVIEW.VIEWS(..., multiview(view), ...) --> MULTIVIEW.VIEWS(..., view, ...).
  let visibleViewsOrder = $derived(views.order.filter((viewKey) => views.map.get(viewKey)?.layout.window !== "minimized"))

  // Lens
  // FIXME: Lens (mouse) alignment issue on nested MultiViewers
  let lens = $state(
		{
      x: 0,
      y: 0,
			diameter: new Tween(200, {
				duration: 100,
				easing: cubicInOut
			}),
			scaler: 1.2,
			clientX: 0,
			clientY: 0,
      boundingClientRect: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      },
			i: new Tween(1, {
				duration: 100,
				easing: cubicInOut
			})
		}
	)
  $effect(() => {
		lens.x = lens.clientX - lens.boundingClientRect.left;
		lens.y = lens.clientY - lens.boundingClientRect.top;
	});
  function recordBoundingClientRectToLens(lens): Attachment {
    return (element) => {
      const {left, top} = element.getBoundingClientRect();
      lens.boundingClientRect.left = left;
      lens.boundingClientRect.top = top;
    }
  }
  function onKeyUp(event) {
    // FIXME: Instead of stopping propagation, can we check if keyUp came from itself vs
    // child MultiView and ignore is yes? I think stopping propagation is a smell.
    // event.stopPropagation()
    // event.preventDefault();
		switch (event.key) {
			case "'":
        lens.diameter.target = Math.round(lens.diameter.current * lens.scaler);
        break;
			case ";":
        lens.diameter.target = Math.round(lens.diameter.current / lens.scaler);
        break;
			case "]":
        lens.i.target -= 1;
        break;
			case "[":
        lens.i.target += 1;
        break;
			case "l":
        mode.type = mode.type !== "lens" ? "lens" : "side-by-side";
        break;
			case "b":
        mode.type = mode.type !== "blink" ? "blink" : "side-by-side";
        break;
			case "f":
        mode.type = mode.type !== "fade" ? "fade" : "side-by-side";
        break;
		}
	}
  function onKeyDown(event) {
		switch (event.key) {
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "0":
        if (mode.type === "blink" || mode.type === "fade") {
          const i = Math.min(Number(event.key), visibleViewsOrder.length) - 1;
          lens.clientX = (i + 0.5) * lens.boundingClientRect.width / visibleViewsOrder.length;
        }
        break;
    }
  }

  function handleDropSuperOuter(e: DragEvent) {
    async function handleFiles(files: FileList) {
      const existingNestedMultiView = new MultiView();
      const existingViewKeys = views.order;
      existingViewKeys.forEach((existingViewKey) => {
        existingNestedMultiView.views.add(views.map.get(existingViewKey), {key: existingViewKey});
      })
      // FIXME: error here when this is called with views containing a multiview of view(s)
      // Might also do something we how we are copying, nesting, clearing etc.
      views.clear();
      views.add(existingNestedMultiView);
      const newNestedMultiView = new MultiView();
      [...files].forEach(async (file) => {
        const sourceKey = sourceManager.add(SourceManager.fileToSource(file));
        const layers = await deriveSyncedLayersFromMapLibreSource(sourceKey);
        layers.forEach(([syncedLayer, syncedLayerKey, overrideKey]) => {
          syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
          const view = new SingleView();
          view.layers.add(syncedLayerKey, {key: overrideKey});
          newNestedMultiView.views.add(view);
        })
      })
      views.add(newNestedMultiView);
    }
    const dataTransfer = e.dataTransfer;
    const files = dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }

  function handleDropOuter(e: DragEvent) {
    async function handleFiles(files: FileList) {
      [...files].forEach(async (file) => {
        const sourceKey = sourceManager.add(SourceManager.fileToSource(file));
        const layers = await deriveSyncedLayersFromMapLibreSource(sourceKey);
        layers.forEach(([syncedLayer, syncedLayerKey, overrideKey]) => {
          syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
          const view = new SingleView();
          view.layers.add(syncedLayerKey, {key: overrideKey});
          views.add(view);
        })
      })
    }
    const dataTransfer = e.dataTransfer;
    const files = dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }

  function handleDropSubOuter(e: DragEvent, vK: ViewKey) {
    async function handleFiles(files: FileList, vK: ViewKey) {
      const nestedMultiView = new MultiView();
      nestedMultiView.views.add(views.get(vK));
      [...files].forEach(async (file) => {
        const sourceKey = sourceManager.add(SourceManager.fileToSource(file));
        const layers = await deriveSyncedLayersFromMapLibreSource(sourceKey);
        layers.forEach(([syncedLayer, syncedLayerKey, overrideKey]) => {
          syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
          const view = new SingleView();
          view.layers.add(syncedLayerKey, {key: overrideKey});
          nestedMultiView.views.add(view);
        })
      })
      views.map.set(vK, nestedMultiView);
    }
    const dataTransfer = e.dataTransfer;
    const files = dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files, vK);
    }
  }

  function handleDropSubInner(e: DragEvent, vK: ViewKey) {
    async function handleFiles(files: FileList, vk: ViewKey) {
      [...files].forEach(async (file) => {
        const sourceKey = sourceManager.add(SourceManager.fileToSource(file));
        const layers = await deriveSyncedLayersFromMapLibreSource(sourceKey);
        const view = views.map.get(vK);
        layers.forEach(([syncedLayer, syncedLayerKey, overrideKey]) => {
          syncedMapLibreLayers.set(syncedLayerKey, syncedLayer);  // TODO: Layers manager? .add() auto generates key
          view.layers.add(syncedLayerKey, {key: overrideKey});
        })
      })
    }
    const dataTransfer = e.dataTransfer;
    const files = dataTransfer?.files;
    if (files && files.length > 0) {
      handleFiles(files, vK);
    }
  }

  async function deriveSyncedLayersFromMapLibreSource(mapLibreSourceKey: SourceKey) {
    const mapLibreSource = sourceManager.mapLibreSources.get(mapLibreSourceKey);
    if (mapLibreSource === undefined) return [];
    const sourceSpec = {
      ...await mapLibreSource.source.spec,
      ...mapLibreSource?.override
    }
    const metadata = mapLibreSource.source.source.format === "pmtiles" ? await mapLibreSource.source.source.metadata : undefined;

    if (sourceSpec.type === "raster" || sourceSpec.type === "image") {  // If raster, add a raster layer to each group
      const layerSpecType = "raster";
      const initialPaintSpec = {
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
      return [[syncedLayer, syncedLayerKey, overrideKey]]
    } else if (sourceSpec.type === "raster-dem") {  // If raster-dem, add a hillshade AND color-relief layer to each group
      const layerSpecTypes = ["color-relief", "hillshade"];
      return layerSpecTypes.map((layerSpecType) => {
        const initialPaintSpec =
          layerSpecType === "hillshade" ?
          {
            "hillshade-illumination-direction": 315,
            "hillshade-exaggeration": 0.5,
          } :
          {
            'color-relief-color': [
              'interpolate',
              ['linear'],
              ['elevation'],
              0, 'rgba(0, 0, 0, 1)',
              metadata?.maximum ?? 5000, 'rgba(0, 255, 0, 1)'
            ]
          }
        const initialBackgroundSpec: Background | undefined =
          layerSpecType === "hillshade" ?
          {
            color: "#7f7f7f",
            opacity: 1.0,
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
        const overrideKey = syncedLayer.addOverride({spec: {}})
        const syncedLayerKey: SyncedMapLibreLayerKey = `synced-maplibre-layer_${crypto.randomUUID()}`;
        return [syncedLayer, syncedLayerKey, overrideKey]
      })
    } else {
      return []
    }
  }
  let allowMultiViewNesting = $derived(views.order.length > 1);
  let allowSubViewNesting = $derived(views.order.length > 1);
</script>

<DropZone
  enabled={allowMultiViewNesting}
  ondropOuter={(e) => {
    if (allowMultiViewNesting) {
      e.preventDefault();
      handleDropSuperOuter(e);
    }
  }}
  ondragoverOuter={(e) => {
    if (allowMultiViewNesting) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      preview.nest = e.dataTransfer?.items?.length ?? 1;
    }
  }}
  draggingOuterChanged={(dragging) => {
    preview.addSibling = dragging ? 1 : 0;
    preview.nest = dragging ? 1 : 0;
  }}
>
  <div class=multi-viewer-size-container>
    <div
      class={[
        "multi-viewer",
        {
          add: preview.addSibling > 0,
        }
      ]}
      role=presentation
      onpointermove={(event) => {lens.clientX = event.clientX; lens.clientY = event.clientY;}}
      onkeyup={onKeyUp}
      onkeydown={onKeyDown}
    >
      <DropZone
        --dragging-margin=initial
        preferInner={visibleViewsOrder.length !== 1}
        --flex-direction=column
        ondropOuter={(e) => {
          handleDropOuter(e);
          e.preventDefault();
        }}
        ondragoverOuter={(e) => {
          e.preventDefault();
          preview.addChild = e.dataTransfer?.items?.length ?? 1;
          e.dataTransfer.dropEffect = "copy";
        }}
        ondropInner={(e) => {
          if (visibleViewsOrder.length < 1) {
            handleDropOuter(e);
            e.preventDefault();
          }
        }}
        ondragoverInner={(e) => {
          if (visibleViewsOrder.length < 1) {
            e.preventDefault();
            preview.addChild = e.dataTransfer?.items?.length ?? 1;
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        draggingChanged={(dragging, draggingInner) => {
          const draggingOuter = dragging && !draggingInner;
          preview.addChild = (draggingOuter || (dragging && (visibleViewsOrder.length < 1))) ? 1 : 0;
        }}
      >
        <!-- <div class=taskbar>
          <div style:display=flex class=unselectable>
            <div style:display=flex style:border="1px solid gray" style:padding="0 6px">
              Taskbar
            </div>
            {#each views.order as viewKey, i (viewKey)}
              {@const view = views.map.get(viewKey)}
              <div style:display=flex style:border="1px solid gray" style:padding="0 6px">
                <label style:display=flex style:gap=2px>
                  {view.name || `View ${i + 1}`}
                  <input type=checkbox checked={view.layout.window !== "minimized"} onchange={(e) => view.layout.window = e.target.checked ? "normal" : "minimized"}>
                </label>
              </div>
            {/each}
          </div>
          {#if visibleViewsOrder.length > 1}
            <div style:display=flex style:border="1px solid gray" class=unselectable style:gap=4px style:padding="0 4px">
              {#each ["Side-by-Side", "Lens", "Blink", "Fade"] as modeType}
                <label style:display=flex style:align-items=center style:gap=2px>
                  <input type=radio value={modeType.toLowerCase()} bind:group={mode.type} />
                  {modeType}
                </label>
              {/each}
            </div>
          {/if}
        </div> -->
        <div
          class={[
            "views",
            {
              "side-by-side": mode.type === "side-by-side",
              lens: mode.type === "lens",
              blink: mode.type === "blink",
              fade: mode.type === "fade",
            },
            {
              add: preview.addChild > 0,
            }
          ]}
          {@attach recordBoundingClientRectToLens(lens)}
          bind:clientWidth={lens.boundingClientRect.width}
          bind:clientHeight={lens.boundingClientRect.height}
        >
          {#each visibleViewsOrder as viewKey, i (viewKey)}
            {@const view = views.map.get(viewKey)}
            <div
              class=view
              // animate:/transition: don't work because we neither reorder nor remove.
              style:clip-path={
                mode.type !== "lens" ? undefined :
                i < 1 ? undefined : `circle(${lens.diameter.current}px at ${lens.x + lens.diameter.current*2*(100/100)*(i-lens.i.current)}px ${lens.y}px)`
              }
              style:z-index={
                mode.type !== "blink" ? undefined :
                ((i / visibleViewsOrder.length) <= (lens.clientX / lens.boundingClientRect.width) && (lens.clientX / lens.boundingClientRect.width) < ((i + 1) / visibleViewsOrder.length) ? 1 : undefined)
              }
              style:opacity={
                mode.type !== "fade" ? 1 :
                i < 1 ? 1 :
                  Math.max(0, Math.min(1, (
                    lens.clientX / (lens.boundingClientRect.width / visibleViewsOrder.length) - ( i - 0.5 )
                  )))
              }
            >
              {#if view.type === "multi"}
                <MultiViewer
                  {...view}
                  bind:camera
                  bind:mode={view.mode}
                  bind:preview={view.preview}
                />
              {:else}
                <!-- Outer: Dump existing view into multiview, add new view as sibling in that multiview -->
                <!-- Inner: Add new view as layer -->
                <DropZone
                  --dragging-margin=initial
                  enabled={allowSubViewNesting}
                  draggingChanged={(dragging, draggingInner) => {
                    const draggingOuter = dragging && !draggingInner;
                    view.preview.nest = draggingOuter ? 1 : 0;
                    view.preview.addSibling = draggingOuter ? 1 : 0;
                    view.preview.addChild = draggingInner ? 1 : 0;
                  }}
                  ondropOuter={(e) => {
                    e.preventDefault();
                    handleDropSubOuter(e, viewKey);
                  }}
                  ondragoverOuter={(e) => {
                    e.preventDefault();
                    view.preview.addSibling = e.dataTransfer?.items?.length ?? 1;
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  ondropInner={(e) => {
                    e.preventDefault();
                    handleDropSubInner(e, viewKey);
                  }}
                  ondragoverInner={(e) => {
                    e.preventDefault();
                    view.preview.addChild = e.dataTransfer?.items?.length ?? 1;
                    e.dataTransfer.dropEffect = "copy";
                  }}
                >
                  <div class={["sub-view-container", {"add-drag-border": view.preview.addChild > 0, add: view.preview.addSibling > 0}]}>
                    {#if view.layers.order.length < 1}
                      <div class=views-notice>
                        No layers in this view.
                      </div>
                    {:else}
                      <SingleViewer
                        {...view}
                        bind:camera
                      />
                    {/if}
                    <!-- WARNING: Hide, don't {if}, because elements removed from DOM cause issues with ondrag- handlers -->
                    {#each {length: view.preview.addSibling}}
                      <div class=add-drag>
                        + sub-view
                      </div>
                    {/each}
                  </div>
                </DropZone>
              {/if}
            </div>
          {/each}
          {#each {length: preview.addChild} }
            <div class=add-drag>
              + view
            </div>
          {/each}
          {#if !(preview.addChild > 0)}
            {#if views.order.length < 1}
              <div class=views-notice>
                No views in this multi-view.
              </div>
            {:else if visibleViewsOrder.length < 1}
              <div class=views-notice>
                All views minimized.
              </div>
            {/if}
          {/if}
        </div>
      </DropZone>
      {#each {length: preview.addSibling}}
        <div class=add-drag>
        {#if preview.nest > 0}
           <div class=multi-viewer-size-container>
            <div class={["multi-viewer", "add"]} style:margin=1em>
              {#each {length: preview.nest}}
                <div class=add-drag>
                  + view
                </div>
              {/each}
            </div>
           </div>
        {:else}
           + multi-view
        {/if}
        </div>
      {/each}
    </div>
  </div>
</DropZone>

<style>
  .add {
    gap: 1em;
  }
  .add-drag-border {
    border: 2px dashed white;
    padding: 0.5em;
  }
  .add-drag {
    pointer-events: none;
    overflow: hidden;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px dashed white;
    &.collapsed {
      display: none;
    }
  }
  .views-notice {
    pointer-events: none;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
  .multi-viewer-size-container {
    container: multiViewerContainer / size;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
  }
  .multi-viewer {
    container: multiViewer / size;
    flex: 1;
    display: flex;
    flex-direction: row;
  }
  .taskbar {
    column-gap: 6px;
    display: flex;
    flex-wrap: wrap;
    border-bottom: none;
    background-color: oklch(0 0 0 / 50%);
  }
  .views {
    flex: 1;
  }
  .view {
    container: ViewContainer / size;
    display: flex;
  }
  .sub-view-container {
    flex: 1;
    display: flex;
  }
  @container ViewContainer (max-aspect-ratio: 1 / 1) {
    .sub-view-container {
      flex-direction: column;
    }
  }
  .side-by-side {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    .view {
      flex: 1;
    }
  }
  .lens {
    display: grid;
    .view {
      grid-area: 1 / 1;
    }
  }
  .blink {
    display: grid;
    .view {
      grid-area: 1 / 1;
    }
  }
  .fade {
    display: grid;
    .view {
      grid-area: 1 / 1;
    }
  }
  @container multiViewer (max-aspect-ratio: 1 / 1) {
    .side-by-side {
      flex-direction: column;
    }
  }
  @container multiViewerContainer (max-aspect-ratio: 1 / 1) {
    .multi-viewer {
      flex-direction: column;
    }
  }
</style>
