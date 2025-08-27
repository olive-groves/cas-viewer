<script lang="ts">
  import {
    AttributionControl,
    BackgroundLayer,
    HillshadeLayer,
    MapLibre,
    NavigationControl,
    RasterDEMTileSource,
    RasterLayer,
    RasterTileSource,
    Terrain,
    TerrainControl
  } from 'svelte-maplibre-gl';

  import { ViewerData } from './ViewerClasses.svelte';

  import Minimap from '$lib/mapboxgl-minimap.js';

  let visible_controls = $state([]);
  
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
      contrast: 0.0,
      opacity: 1.0
    },
    hillshade: {
      angle: 315,
      exaggeration: 0.7,
      shadow_opacity: 1.0,
      accent_opacity: 1.0,
      highlight_opacity: 1.0,
      interval: 1,
      background: data?.raster.url ? 0 : 1,
      lightness: 0.5
    },
    terrain: {
      exaggeration: 1 
    },
    overlay: {
      visibility: true,
      opacity: 1,
      hue: 0,
      lightness: 0.5,
      brightness_max: 1,
      brightness_min: 0
    }
  })

  $effect(() => {
    const li = controls.overlay.lightness;
    if (li >= 0.5) {
      controls.overlay.brightness_min = (li - 0.5) * 2;
      controls.overlay.brightness_max = 1;
    } else {
      controls.overlay.brightness_max = li * 2;
      controls.overlay.brightness_min = 0;
    }
  })

  // Certain paint props with terrain on are not immediately reflected
  // Reload here to do so
  $effect(() => {
    controls.rgb.brightness_max;
    controls.rgb.brightness_min;
    controls.rgb.contrast;
    controls.rgb.opacity;
    controls.overlay.hue;
    controls.overlay.lightness;
    controls.overlay.opacity;
    controls.hillshade.lightness;
    setTimeout(() => {
      map?.terrain?.sourceCache.freeRtt();
      map?.terrain?.sourceCache.sourceCache.reload();
    }, 200);
  })

  let timeout: ReturnType<typeof setTimeout>;  // Some paint props shouldn't be spammed, so we clear the timeout for those
  $effect(() => {
    controls.hillshade.exaggeration;
    controls.hillshade.shadow_opacity;
    controls.hillshade.accent_opacity;
    controls.hillshade.highlight_opacity;
    controls.hillshade.background;
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
    if (raking) {
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
    }
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
    class={["container", "dark"]}
    bind:clientWidth={pointer.containerWidth}
    bind:clientHeight={pointer.containerHeight}
    onpointermove={(e) => {
      if (raking) updateRaking(e)
    }}
  >
    <div class="map">
      <MapLibre
        bind:map={map}
        onload={
        map.addControl(new Minimap({
            zoom: -2,
            renderWorldCopies: false,
            width: "180px",
            height: "180px",
            lineColor: "#fff",
            fillColor: "#fff",
            style: {
              version: 8,
              sources: {
                ...(data?.raster.url && {
                  rgb: {
                    type: "raster",
                    url: data?.raster.url,
                    tileSize: 256
                  }
                }),
                ...(data?.raster_dem.url && {
                  hillshade: {
                    type: "raster-dem",
                    url: data?.raster_dem.url,
                    tileSize: 256,
                    encoding: "custom",
                    baseShift: 0,
                    redFactor: 256*256*2,
                    greenFactor: 256*2,
                    blueFactor: 2
                  }
                })
              },
              layers: [
                ... data?.raster.url ? [{
                  'id': 'raster',
                  'type': 'raster',
                  'source': 'rgb',
                  'paint': {
                      'raster-resampling': 'linear',
                      'raster-opacity': 0.7,
                      'raster-saturation': 0
                  }
                }] : [],
                ... data?.raster_dem.url ? [{
                  'id': 'hillshade',
                  'type': 'hillshade',
                  'source': 'hillshade',
                  'paint': {
                      'hillshade-exaggeration': 1.0
                  }
                }] : [],
              ]
            }
          }), 'top-right')
        }
        autoloadGlobalCss={false}
        inlineStyle="height: 100%; width: 100%;"
        attributionControl={false}
        hash={true}
        renderWorldCopies={false}
        maxPitch={83}
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
                "raster-contrast": controls.rgb.contrast,
                "raster-opacity": controls.rgb.opacity
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
            <TerrainControl position="bottom-right" />
            <Terrain exaggeration={controls.terrain.exaggeration} />
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
                'background-color': `hsl(0, 0%, ${100*controls.hillshade.lightness}%)`
              }}
            />
            <HillshadeLayer
              paint={{
                'hillshade-exaggeration': controls.hillshade.exaggeration,
                'hillshade-shadow-color': `rgba(0, 0, 0, ${controls.hillshade.shadow_opacity})`,
                'hillshade-accent-color': `rgba(0, 0, 0, ${controls.hillshade.accent_opacity})`,
                'hillshade-highlight-color': `rgba(255, 255, 255, ${controls.hillshade.highlight_opacity})`,
                // 'hillshade-shadow-color': `hsla(0, 0%, ${100*(controls.hillshade.lightness * controls.hillshade.shadow_opacity)}%, 1.0)`,
                // 'hillshade-accent-color': `hsla(0, 0%, ${100*(controls.hillshade.lightness * controls.hillshade.accent_opacity)}%, 1.0)`,
                // 'hillshade-highlight-color': `hsla(0, 0%, ${100*(controls.hillshade.lightness + (1 - controls.hillshade.lightness) * controls.hillshade.highlight_opacity)}%, 1.0)`,
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
              paint={{
                'raster-resampling': 'nearest',
                'raster-opacity': controls.overlay.opacity,
                'raster-hue-rotate': controls.overlay.hue,
                'raster-brightness-max': controls.overlay.brightness_max,
                'raster-brightness-min': controls.overlay.brightness_min
              }}
            />
          </RasterTileSource>
        {/if}
        <NavigationControl position="bottom-right" visualizePitch={true} visualizeRoll={true} />
      </MapLibre>
    </div>
    <div
      class="controls-container"
    >
      <div class="controls">

        <label><input type="checkbox" name="controls" value="RGB" bind:group={visible_controls} disabled={!data?.raster.url}/><span>RGB</span></label>
        {#if visible_controls.includes("RGB")}
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.rgb.opacity} ondblclick={() => controls.rgb.opacity = 1}>
            Opacity ({controls.rgb.brightness_max.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.rgb.brightness_max} ondblclick={() => controls.rgb.brightness_max = 1}>
            Highlights ({controls.rgb.brightness_max.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0  max=1 step=0.01 bind:value={controls.rgb.brightness_min} ondblclick={() => controls.rgb.brightness_min = 0}>
            Shadows ({controls.rgb.brightness_min.toFixed(2)})
          </label>
          <label>
            <input type="range" min=-1 max=1 step=0.02 bind:value={controls.rgb.contrast} ondblclick={() => controls.rgb.contrast = 0}>
            Contrast ({controls.rgb.contrast.toFixed(2)})
          </label>
        {/if}

        <label><input type="checkbox" name="controls" value="Terrain" bind:group={visible_controls} disabled={!data?.raster_dem.url}/><span>Terrain</span></label>
        {#if visible_controls.includes("Terrain")}
          <label>
            <input type="range" min=1 max=100 step=1 bind:value={controls.terrain.exaggeration} ondblclick={() => controls.terrain.exaggeration = 1}>
            Exaggeration ({controls.terrain.exaggeration.toFixed(0)}x)
          </label>
        {/if}

        <label><input type="checkbox" name="controls" value="Hillshade" bind:group={visible_controls} disabled={!data?.raster_dem.url}/><span>Hillshade</span></label>
        {#if visible_controls.includes("Hillshade")}
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.exaggeration} ondblclick={() => controls.hillshade.exaggeration = 1}>
            Intensity ({controls.hillshade.exaggeration.toFixed(2)})
          </label>
          <label>
            <input type="range" min=1 max=20 step=1 bind:value={controls.hillshade.interval} ondblclick={() => controls.hillshade.interval = 1}>
            Multiplier ({controls.hillshade.interval.toFixed(0)}x)
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.shadow_opacity} ondblclick={() => controls.hillshade.shadow_opacity = 1}>
            Shadow opacity ({controls.hillshade.shadow_opacity.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.accent_opacity} ondblclick={() => controls.hillshade.accent_opacity = 1}>
            Accent opacity ({controls.hillshade.accent_opacity.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.highlight_opacity} ondblclick={() => controls.hillshade.highlight_opacity = 1}>
            Highlight opacity ({controls.hillshade.highlight_opacity.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.background} ondblclick={() => controls.hillshade.background = 0}>
            Background opacity ({controls.hillshade.background.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.lightness} ondblclick={() => controls.hillshade.lightness = 0.5}>
            Background lightness ({controls.hillshade.lightness.toFixed(2)})
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
        {/if}

        <label><input type="checkbox" name="controls" value="NaN" bind:group={visible_controls} disabled={!data?.raster_overlay.url}/><span>NaN</span></label>
        {#if visible_controls.includes("NaN")}
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.overlay.opacity} ondblclick={() => controls.overlay.opacity = 1}>
            Opacity ({controls.overlay.opacity.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=1 step=0.01 bind:value={controls.overlay.lightness} ondblclick={() => controls.overlay.lightness = 0.5}>
            Lightness ({controls.overlay.lightness.toFixed(2)})
          </label>
          <label>
            <input type="range" min=0 max=360 step=5 bind:value={controls.overlay.hue} ondblclick={() => controls.overlay.hue = 0}>
            Hue ({controls.overlay.hue.toFixed(0)}°)
          </label>
        {/if}
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
  .controls label {
    margin-top: 1px;
  }
  .controls input:disabled + span {
    color: gray;
  }
  .controls input[type=checkbox]{
    accent-color: white;
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
  .controls label {
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