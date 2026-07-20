<script lang="ts">
  import MultiViewer from '$lib/v0.8/MultiViewer.svelte';
  import SingleViewer from '$lib/v0.8/SingleViewer.svelte';
  import { cubicInOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { ViewMode } from './views.svelte';

  let {
    views,
    camera = $bindable({}),
    mode = $bindable({type: "side-by-side"}),
  }: {
    views: any,  // FIXME: MultiView.views
    camera: any,
    mode: ViewMode,
  } = $props();

  // Lens
  let lens =$state(
		{
      x: undefined,
      y: undefined,
			diameter: new Tween(200, {
				duration: 100,
				easing: cubicInOut
			}),
			scaler: 1.2,
			clientX: 0,
			clientY: 0,
			containerX: 0,
			containerY: 0,
			i: new Tween(1, {
				duration: 100,
				easing: cubicInOut
			})
		}
	)
  $effect(() => {
		lens.x = lens.clientX - lens.containerX;
		lens.y = lens.clientY - lens.containerY;
	});
  function recordBoundingClientRect(node, obj) {
		obj.containerX = node.getBoundingClientRect().left;
		obj.containerY = node.getBoundingClientRect().top;
	}
  function onKeyUp(event) {
    console.log(event)
		switch (event.key) {
			case "'":
					lens.diameter.target = Math.round(lens.diameter.current * lens.scaler);
					event.preventDefault();
					break;
			case ";":
					lens.diameter.target = Math.round(lens.diameter.current / lens.scaler);
					event.preventDefault();
					break;
			case "]":
					lens.i.target -= 1;
					event.preventDefault();
					break;
			case "[":
					lens.i.target += 1;
					event.preventDefault();
					break;
			case "l":
        mode.type = mode.type !== "lens" ? "lens" : "side-by-side";
        event.preventDefault();
        break;
		}
	}
</script>

<div
  class="multi-viewer"
  role=presentation
  onpointermove={(event) => {lens.clientX = event.clientX; lens.clientY = event.clientY;}}
  onkeyup={onKeyUp}
>
  <div
    class={[
      "views",
      {
        "side-by-side": mode.type === "side-by-side",
        "lens": mode.type === "lens",
      }
    ]}
    use:recordBoundingClientRect={lens}
  >
    {#each views.order as viewKey, i (viewKey)}
      {@const view = views.map.get(viewKey)}
      <div
        class="view"
        style:clip-path={(mode.type !== "lens" || i < 1) ? undefined : `circle(${lens.diameter.current}px at ${lens.x + lens.diameter.current*2*(100/100)*(i-lens.i.current)}px ${lens.y}px)`}
      >
        {#if view.type === "multi"}
          <MultiViewer
            {...view}
            bind:camera
            mode={view.mode}
          />
        {:else}
          <SingleViewer
            {...view}
            bind:camera
          />
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
  @container multiViewer (max-aspect-ratio: 1 / 1) {
    .side-by-side {
      flex-direction: column;
    }
  }
</style>
