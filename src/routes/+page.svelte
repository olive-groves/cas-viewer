<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';

  import { PMTilesProtocol } from 'svelte-maplibre-gl/pmtiles';
  import Select from '$lib/Select.svelte';
  import Viewer from '$lib/Viewer.svelte';
  import { ViewerData } from '$lib/ViewerClasses.svelte';
  
  let n = $state(2);  // n viewers

  const MODES = ['Side by side', 'Lens'] as const;
  type Modes = (typeof MODES)[number];
	let mode: Modes = $state('Side by side')

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

  let mapProps = $state({});
  let pointer = $state({
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    containerLeft: 0,
    containerTop: 0,
    containerWidth: 0,
    containerHeight: 0,
    roundedPercentX: 0,
    roundedPercentY: 0
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
        <button onclick={(e) => n -= 1} disabled={n <= 1}>–</button>
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
          bind:pointer
          --grid-row-start={1}
          --grid-column-start={1}
          --clippath={((mode === 'Lens') && ( loaded_conv.every((x) => x === true) ) && (i)) && `circle(${lens.diameter.current}px at ${lens.x + lens.diameter.current*2*(100/100)*(i-lens.i.current)}px ${lens.y}px)`}
        />
      {:else}
        <Select
          --width="300px"
          loaded={() => viewer.loaded = !viewer.loaded}
          header={(n === 1 ? `Viewer` : (`Viewer ${i + 1}`) + ((n > 0 && i === 0) ? ' · Main' : ' · Lens'))}
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
  {#if n > 1 && loaded_conv.every((x) => x === true)}
    <div class="viewers-controls">
      <div class="mode">
        <label>
          <input type="radio" name="mode" value="Side by side" bind:group={mode}/>
          Side by side
        </label>
        <label>
          <input type="radio" name="mode" value="Lens" bind:group={mode}/>
          Lens
        </label>
      </div>
    </div>
  {/if}
</div>

<style>
  .main {
    display: grid;
    grid-template-columns: 1fr;
    container: main / size;
    height: 100%;
    margin: 0;
    padding: 0;
  }
  .viewers-flex, .viewers-grid, .viewers-controls {
      grid-row-start: 1;
      grid-column-start: 1;
  }
  .viewers-controls {
    display: flex;
    flex-direction: column;
    justify-content: end;
    pointer-events: none;
    z-index: 1;
  }
  .viewers-controls * {
    pointer-events: auto;
    color: white;
  }
  .mode {
    margin-bottom: 4px;
  }
  .viewers-controls label {
    filter: drop-shadow(0px 0px 2px #000000) drop-shadow(0px 0px 10px #000000) drop-shadow(0px 0px 100px #000000);
  }
  .viewers-controls input[type=radio]{
    accent-color: white;
  }
  .viewers-flex {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    height: 100%;
    margin: 0;
    padding: 0;
    justify-content: space-between;
    align-items: center;
  }
  .viewers-grid {
    grid-row-start: 1;
    grid-column-start: 1;
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
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }
  @container main (max-aspect-ratio: 1 / 1) {
    .viewers-flex {
      flex-direction: column;
    }
  }
</style>
