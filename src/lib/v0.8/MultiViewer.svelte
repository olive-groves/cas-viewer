<script lang="ts">
  import MultiViewer from '$lib/v0.8/MultiViewer.svelte';
  import SingleViewer from '$lib/v0.8/SingleViewer.svelte';
  import { cubicInOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { ViewMode, ViewLayout } from './views.svelte';
	import type { Attachment } from 'svelte/attachments';

  let {
    views,
    camera = $bindable({}),
    mode = $bindable({type: "side-by-side"}),
    layout = $bindable({window: "normal"}),
  }: {
    views: any,  // FIXME: MultiView.views OrderedSvelteMap<ViewKey, SingleView | MultiView>
    camera: any,
    mode: ViewMode,
    layout: ViewLayout,
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
  let lens =$state(
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
</script>

<div
  class="multi-viewer"
  role=presentation
  onpointermove={(event) => {lens.clientX = event.clientX; lens.clientY = event.clientY;}}
  onkeyup={onKeyUp}
  onkeydown={onKeyDown}
>
  <div class=taskbar>
    <div style:display=flex class=unselectable>
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
  </div>
  <div
    class={[
      "views",
      {
        "side-by-side": mode.type === "side-by-side",
        lens: mode.type === "lens",
        blink: mode.type === "blink",
        fade: mode.type === "fade",
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
          // animate
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
            />
          {:else}
            {#if view.layers.order.length < 1}
              <div style:display=flex style:justify-content=center style:align-items=center style:height=100%>
                No layers in view.
              </div>
            {:else}
              <SingleViewer
                {...view}
                bind:camera
              />
            {/if}
          {/if}
        </div>
    {/each}
  </div>
</div>

<style>
  .multi-viewer {
    container: multiViewer / size;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .taskbar {
    column-gap: 6px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    border-bottom: none;
    background-color: oklch(0 0 0 / 50%);
  }
  .views {
    height: 100%;
    width: 100%;
  }
  .side-by-side {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    .view {
      flex: 1 1;
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
</style>
