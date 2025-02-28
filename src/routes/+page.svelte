<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';

  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import Select from '$lib/Select.svelte';
  import Viewer from '$lib/Viewer.svelte';
  import { ViewerData } from '$lib/ViewerClasses.svelte';

  
  let n = $state(1);  // n viewers

  const MODES = ['Side by side', 'Lens'] as const;
  type Modes = (typeof MODES)[number];
	let mode: Modes = $state('Lens')

  let lens =$state(
		{
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
	
	function on_key_up(event) {
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
					mode = "Lens";
					event.preventDefault();
					break;
			case "s":
					mode = "Side by side";
					event.preventDefault();
					break;
		}
	}


  let viewers = $derived.by(() => {  // n viewers
    let viewers = [];
    for (let i = 0; i < n; i++) {
      viewers.push(new ViewerData())
    }
    return viewers
  })

  let loaded_conv = $derived(viewers.map((v) => v.loaded)) 

  let all_pmtiles = $derived.by(() => {
    let all_pmtiles = [];
    for (let i = 0; i < n; i++) {
      if (viewers[i].raster.pmtiles) {
        all_pmtiles.push(viewers[i].raster.pmtiles);
      }
      if (viewers[i].raster_dem.pmtiles) {
        all_pmtiles.push(viewers[i].raster_dem.pmtiles);
      }
      if (viewers[i].raster_overlay.pmtiles) {
        all_pmtiles.push(viewers[i].raster_overlay.pmtiles);
      }
    }
    return all_pmtiles;
  })

  let mapProps = $state({
  });
</script>


{#if loaded_conv.some((x) => x === true)}
  <PMTilesProtocol pmtiles={all_pmtiles} />
{/if}


<svelte:window
	onpointermove={(event) => {lens.clientX = event.clientX; lens.clientY = event.clientY;}}
	on:keyup={on_key_up} 
	/>


<div class="main">
  <div
    class={[((mode === 'Lens') && ( loaded_conv.every((x) => x === true) )) ? "viewers-grid" : "viewers-flex"]} 
    use:recordBoundingClientRect={lens}
  >
    {#if loaded_conv.some((x) => x === false)}
      <div class="viewer-add-remove">
        <button onclick={(e) => n -= 1}>–</button>
      </div>
    {/if}
    <!-- Index viewers[i] to trigger reactive state -->
    {#each viewers as viewer, i} 
      {#if viewer.loaded}
        <Viewer
          --height="100%"
          --width="100%"
          data={viewers[i]}
          bind:mapProps
          --z-index={i + 1}
          --grid-row-start={1}
          --grid-column-start={1}
          --clippath={((mode === 'Lens') && ( loaded_conv.every((x) => x === true) ) && (i)) && `circle(${lens.diameter.current}px at ${lens.x + lens.diameter.current*2*(100/100)*(i-lens.i.current)}px ${lens.y}px)`}
        />
      {:else}
        <Select
          --width="300px"
          loaded={() => viewer.loaded = !viewer.loaded}
          bind:files={viewers[i].raster.files}
          bind:files_dem={viewers[i].raster_dem.files}
          bind:files_overlay={viewers[i].raster_overlay.files}
        />
      {/if}
    {/each}
    {#if loaded_conv.some((x) => x === false)}
      <div class="viewer-add-remove">
        <button onclick={(e) => n += 1}>+</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .main {
    container: main / size;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .viewers-flex {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    height: 100%;
    margin: 0;
    padding: 0;
    justify-content: space-evenly;
    align-items: center;
  }
  .viewers-grid {
    display: grid;
    grid-template-columns: 1fr;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .viewer-add-remove {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
  }
  .viewer-add-remove button {
    display: block;
    font-size: 2rem;
  }
  @container main (max-aspect-ratio: 1 / 1) {
    .viewers-flex {
      flex-direction: column;
    }
  }
</style>
