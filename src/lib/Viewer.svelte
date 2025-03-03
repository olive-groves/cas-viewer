<script lang="ts">
  import {
    AttributionControl,
    BackgroundLayer,
    HillshadeLayer,
    MapLibre,
    RasterDEMTileSource,
    RasterLayer,
    RasterTileSource,
    Terrain,
    TerrainControl
  } from 'svelte-maplibre-gl';

  import { ViewerData } from './ViewerClasses.svelte';
  
  let {
    data,
    mapProps = $bindable({
      center: [0, 0],
      zoom: 0,
      bearing: 0,
      pitch: 0,
      roll: 0,
      elevation: 0
    }),
    pointer = $bindable({
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
    })
  }: {
    data?: ViewerData,
    mapProps?: {},
    pointer?: {}
  } = $props();

  let map = $state();

  let raking = $state(false);

  // let pointer = $state({
  //   x: 0,
  //   y: 0,
  //   clientX: 0,
  //   clientY: 0,
  //   containerLeft: 0,
  //   containerTop: 0,
  //   containerWidth: 0,
  //   containerHeight: 0,
  //   roundedPercentX: 0,
  //   roundedPercentY: 0,
  // })

  $effect(() => {
		pointer.x = pointer.clientX - pointer.containerLeft;
		pointer.y = pointer.clientY - pointer.containerTop;
	});

  let radialX = $derived(pointer.x/pointer.containerWidth*100);
  let radialY = $derived(pointer.y/pointer.containerHeight*100);

  function updateRaking(event) {
		const rect = event.target?.getBoundingClientRect()
    pointer.containerWidth = rect.width
    pointer.containerHeight = rect.height
    pointer.containerLeft = rect.left
    pointer.containerTop = rect.top
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
	}

  let controls = $state({
    rgb: {
      brightness_max: 1.0,
      brightness_min: 0.0,
      contrast: 0.0
    },
    hillshade: {
      angle: 315,
      exaggeration: 0.7,
      interval: 1,
      background: data?.raster.url ? 0 : 1,
      lightness: 50
    },
    overlay: {
      visibility: true,
      hue: 0
    }
  })

  // Certain paint props with terrain on are not immediately reflected
  // Reload here to do so
  $effect(() => {
    controls.rgb.brightness_max;
    controls.rgb.brightness_min;
    controls.rgb.contrast;
    controls.overlay.hue;
    controls.hillshade.background;
    controls.hillshade.lightness;
    setTimeout(() => {
      map?.terrain?.sourceCache.freeRtt();
      map?.terrain?.sourceCache.sourceCache.reload();
    }, 200);
  })

  let timeout;  // Some paint props shouldn't be spammed, so we clear the timeout for those
  $effect(() => {
    controls.hillshade.exaggeration;
    controls.hillshade.angle;
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      map?.terrain?.sourceCache.freeRtt();
      map?.terrain?.sourceCache.sourceCache.reload();
    }, 200);
  })


  $effect(() => {
    if (map) {
      const style = map.getStyle()
      const interval = controls.hillshade.interval;
      if (style?.sources?.hillshade) {
        style.sources.hillshade.redFactor = 256 * 256 * interval;
        style.sources.hillshade.greenFactor = 256 * interval;
        style.sources.hillshade.blueFactor = 1 * interval;
        map.setStyle(style)
      }
    }
  })

  let overlay_visibilty = $derived(controls.overlay.visibility ? "visible" : "none")

  $effect(() => {
    //
    //   +x
    //    ^     ·
    //    |    /
    //    | θ /
    //    |  /
    //    | /
    //    |/
    //————+———————————> +y
    //    |
    //
    const mouseX = pointer.x / pointer.containerWidth;
    const mouseY = pointer.y / pointer.containerHeight;
    const mapCenterX = 0.5;
    const mapCenterY = 0.5;
    const deltaX = mouseX - mapCenterX;
    const deltaY = mouseY - mapCenterY;
    controls.hillshade.exaggeration = Math.min(Math.max(4 * Math.hypot(deltaX, deltaY), 0), 1)
    const angle = Math.atan2(-deltaX, deltaY);  // Considered in a clockwise angle coordinate system where 0 degrees is pointing upwards
    const angleDegrees = angle * (180.0 / Math.PI);
    controls.hillshade.angle = Math.floor((angleDegrees + 180) % 360);  // Shift angle into range [0, 360) to match the input range for hillshade direction

    pointer.roundedPercentX = Math.abs(deltaX) >= Math.abs(deltaY) ? 100*Math.round(mouseX) : 100*mouseX;
    pointer.roundedPercentY = Math.abs(deltaY) >= Math.abs(deltaX) ? 100*Math.round(mouseY) : 100*mouseY;
  })

  const getHeaderMetadata = async () => {
    const raster_header = await data?.raster.header 
    const raster_metadata = await data?.raster.metadata 
    const raster_dem_header = await data?.raster_dem.header 
    const raster_dem_metadata = await data?.raster_dem.metadata 
    const raster_overlay_header = await data?.raster.header 
    const raster_overlay_metadata = await data?.raster.metadata 
    return {
      raster_header,
      raster_metadata,
      raster_dem_header,
      raster_dem_metadata,
      raster_overlay_header,
      raster_overlay_metadata
    }
  }
</script>

{#await getHeaderMetadata()}
  <p>Loading...</p>
{:then hm}
  <!-- {hm.raster_header}
  {hm.raster_dem_header}
  {hm.raster_overlay_header} -->
  <!-- <table>
    <tbody>
      {#if hm.raster_metadata}
        {#each Object.entries(hm.raster_metadata) as [key, value]}
          <tr>
            <th scope="row" style="text-align: end">{key}</th>
            <td>{value}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table> -->

  <div
    class="container"
    bind:clientWidth={pointer.containerWidth}
    bind:clientHeight={pointer.containerHeight}
    onpointermove={(e) => {
      if (raking) updateRaking(e)
    }}
  >
    <div class="map">
      <MapLibre
        bind:map={map}
        autoloadGlobalCss={false}
        inlineStyle="height: 100%; width: 100%;"
        attributionControl={false}
        hash={true}
        renderWorldCopies={false}
        maxPitch={87}
        aroundCenter={false}
        bind:center={mapProps.center}
        bind:zoom={mapProps.zoom}
        bind:bearing={mapProps.bearing}
        bind:pitch={mapProps.pitch}
        bind:roll={mapProps.roll}
        bind:elevation={mapProps.elevation}
      >
      {#if hm.raster_metadata}
        <AttributionControl
          compact={true}
          customAttribution={
            `${hm.raster_metadata.attribution} ${hm.raster_metadata.scanDateTime}`
          }
        />
      {:else if hm.raster_dem_metadata}
        <AttributionControl
          compact={true}
          customAttribution={
            `${hm.raster_dem_metadata.attribution} ${hm.raster_dem_metadata.scanDateTime}`
          }
        />
      {/if}
        {#if data?.raster.url}
          <RasterTileSource
            url={data?.raster.url}
            tileSize={256}
          >
            <RasterLayer
              layout={{
                // 'visibility': "none"
              }}
              paint={{
                'raster-resampling': 'nearest',
                "raster-brightness-max": controls.rgb.brightness_max,
                "raster-brightness-min": controls.rgb.brightness_min,
                "raster-contrast": controls.rgb.contrast
              }}
            />
          </RasterTileSource>
        {/if}
        {#if data?.raster_dem.url}
          <RasterDEMTileSource
            id="terrain"
            url={data?.raster_dem.url}
            encoding="custom"
            baseShift={0}
            redFactor={256*256}
            greenFactor={256}
            blueFactor={1}
          >
            <TerrainControl position="top-right" />
            <Terrain exaggeration={10} />
          </RasterDEMTileSource>
          <RasterDEMTileSource
            id="hillshade"
            url={data?.raster_dem.url}
            encoding="custom"
            baseShift={0}
            redFactor={256*256*controls.hillshade.interval}
            greenFactor={256*controls.hillshade.interval}
            blueFactor={1*controls.hillshade.interval}
            tileSize={256}
          >
            <BackgroundLayer
              paint={{
                'background-opacity': controls.hillshade.background,
                'background-color': `hsl(0, 0%, ${controls.hillshade.lightness}%)`
              }}
            />
            <HillshadeLayer
              paint={{
                'hillshade-exaggeration': 1.0,
                'hillshade-shadow-color': `rgba(0, 0, 0, ${Math.min(Math.max(2*controls.hillshade.exaggeration, 0), 1)})`,
                'hillshade-accent-color': "rgba(0, 0, 0, 0)",
                'hillshade-highlight-color': `rgba(255, 255, 255, ${Math.min(2*Math.max(controls.hillshade.exaggeration, 0), 1)})`,
                'hillshade-illumination-anchor': 'map',
                'hillshade-illumination-direction': controls.hillshade.angle
              }}
            />
          </RasterDEMTileSource>
        {/if}
        {#if data?.raster_overlay.url}
          <RasterTileSource
            url={data?.raster_overlay.url}
            tileSize={256}
          >
            <RasterLayer
              layout={{
                'visibility': overlay_visibilty
              }}
              paint={{
                'raster-resampling': 'nearest',
                'raster-hue-rotate': controls.overlay.hue
              }}
            />
          </RasterTileSource>
        {/if}
      </MapLibre>
    </div>
    <div
      class="controls-container"
    >
      <div class="controls">
        <h3>RGB</h3>
        <label>
          <input type="range" min=0 max=1 step=0.01 bind:value={controls.rgb.brightness_max}>
          Highlights
        </label>
        <label>
          <input type="range" min=0  max=1 step=0.01 bind:value={controls.rgb.brightness_min}>
          Shadows
        </label>
        <label>
          <input type="range" min=-1 max=1 step=0.01 bind:value={controls.rgb.contrast}>
          Contrast
        </label>
        <h3>Hillshade</h3>
        <label>
          <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.exaggeration} ondblclick={() => controls.hillshade.exaggeration = 1}>
          Intensity ({controls.hillshade.exaggeration.toFixed(2)})
        </label>
        <label>
          <input type="range" min=1 max=20 step=1 bind:value={controls.hillshade.interval} ondblclick={() => controls.hillshade.interval = 1}>
          Multiplier ({controls.hillshade.interval.toFixed(0)})
        </label>
        <label>
          <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.background}>
          Background opacity ({controls.hillshade.background.toFixed(2)})
        </label>
        <label>
          <input type="range" min=0 max=100 step=1 bind:value={controls.hillshade.lightness} ondblclick={() => controls.hillshade.lightness = 50}>
          Background lightness ({controls.hillshade.lightness.toFixed(0)})
        </label>
        <figure
          class="circle"
          style={`background: radial-gradient(circle at ${radialX}px ${radialY}px, rgb(227, 227, 227) 0%, #000000 80%);`}
          onpointermove={(e) => {
            if (raking) updateRaking(e)
          }}
          onpointerup={(e) => {
            raking = !raking;
            if (raking) updateRaking(e)
          }}
          ondblclick={() => {pointer.x = 0; pointer.y = 0}}
        >
        </figure>
        <h3>NaN</h3>
        <label>
          <input type="checkbox" bind:checked={controls.overlay.visibility}>
          Show
        </label>
        <label>
          <input type="range" min=0 max=360 step=5 bind:value={controls.overlay.hue}>
          Hue shift ({controls.overlay.hue}°)
        </label>
      </div>
    </div>
  </div>
{/await}

<style>
  .circle {
    display: block;
    background: black;
    border-radius: 50%;
    height: 100px;
    width: 100px;
    margin: 20px;
  }
  .controls h3 {
    margin-bottom: 0;
    font-weight: normal;
  }
  .controls {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    width: 400px;
  }
  .controls * {
    pointer-events: auto;
  }
  .controls label, h3 {
    filter: drop-shadow(0px 0px 2px #000000);
  }
  .controls-container {
    filter: drop-shadow(0px 0px 2px #000000) drop-shadow(0px 0px 10px #000000) drop-shadow(0px 0px 100px #000000);
    pointer-events: none;
    display: flex;
    flex-direction: row;
    align-items: start;
    flex-wrap: nowrap;
    grid-row-start: 1;
    grid-column-start: 1;
    overflow: hidden;
  }
  .map {
    height: 100%;
    width: 100%;
    grid-row-start: 1;
    grid-column-start: 1;
  }
  .container {
    display: grid;
    grid-template-columns: 1fr;
    height: var(--height);
    width: var(--width);
    grid-row-start: var(--grid-row-start);
    grid-column-start: var(--grid-column-start);
    margin: 0;
    padding: 0;
    position: var(--position, relative);
    clip-path: var(--clippath, none);
    overflow: hidden;
  }
</style>