<script lang="ts">
  import { untrack } from 'svelte';

  import {
    AttributionControl,
    BackgroundLayer,
    HillshadeLayer,
    ColorReliefLayer,
    MapLibre,
    NavigationControl,
    RasterDEMTileSource,
    RasterLayer,
    RasterTileSource,
    Terrain,
    CustomControl
  } from 'svelte-maplibre-gl';
  import { Underzoom } from 'maplibre-xy';
  import maplibregl from 'maplibre-gl';

  import { ViewerData } from './ViewerClasses.svelte';
  import DualRangeInput from './DualRangeInput.svelte';
  import { ColorRelief, COLORMAPS } from './ColorRelief.svelte.js';

  import Minimap from '$lib/mapboxgl-minimap.js';
  import ScaleBar from './ScaleBar.svelte';
  
  const myUnderzoom = new Underzoom(maplibregl, {extendPan: 1.0});
  // function identityTransformConstrain(lngLat, zoom) {
  //   return {center: lngLat, zoom: zoom ?? 0}
  // };

  const locale = {
    'NavigationControl.ResetBearing': 'Reset bearing and pitch'
  };

  function interpolateColorHex(color1: string, color2: string, ratio = 0.5) {
    // https://stackoverflow.com/a/76126221/20921535
    // let color1Six: string = color1;
    // if (color1.length == 4) { // If 4-digit hex
    //   color1Six = "#" +
    //     `${color1Six.at(1)?.repeat(2)}` +
    //     `${color1Six.at(2)?.repeat(2)}` +
    //     `${color1Six.at(3)?.repeat(2)}`
    // }
    
    // TODO: Alpha channel support (8-digit hex)

    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    // Convert the interpolated RGB values back to a hex color
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  let colormap_selected = $state('viridis16');
  const colorRelief = new ColorRelief();
  $effect(() => {
		colorRelief.colormap = colormap_selected;
	});

  let colormapColors = $derived(COLORMAPS[colormap_selected])
  let trackFilledColor: string = $derived(colormapColors.at(0))
  let trackFilledGradientEndColor: string = $derived(colormapColors.at(-1))
  let trackFilledGradientMidColor: string = $derived.by(() => {
    if (colormapColors.length > 2) {
      return colormapColors.at(Math.ceil(colormapColors.length / 2));
    } else {
      return interpolateColorHex(colormapColors.at(0), colormapColors.at(-1));
    }
  });

  function getAttribution(metadata: Any) {
    const attribution = metadata?.attribution ?? 'Attribution undefined';
    const license = metadata?.license ?? 'License undefined';
    const instrument = metadata?.instrument?.name ?? 'Instrument name undefined';
    const dateTime = metadata?.instrument?.dateTime ?? metadata.scanDateTime ?? 'Date-time undefined';
    return `${attribution}, ${license} · ${instrument} ${dateTime}`
  };
  
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
      visibility: true,
      brightness_max: 1.0,
      brightness_min: 0.0,
      contrast: 0.0,
      opacity: 1.0,
      saturation: 0.0,
      hue: 0,
    },
    hillshade: {
      visibility: true,
      angle: 315,
      exaggeration: 0.7,
      shadow_opacity: 1.0,
      accent_opacity: 1.0,
      highlight_opacity: 1.0,
      interval: 1,
    },
    "hillshade-background": {
      visibility: false,
      background: 1.0,
      lightness: 0.5
    },
    pseudocolor: {
      interval: 1,
      // opacity: 1, // See ColorRelief
      // min_low: 1,
      // low: 1,
      // high: 2,
      // max_high: 2
    },
    terrain: {
      exaggeration: 1,
      enabled: true
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
    colorRelief.setBreakpoints.high = colorRelief.setBreakpoints.max;
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
    controls.rgb.saturation;
    controls.rgb.hue;
    controls.rgb.opacity;
    controls.overlay.hue;
    controls.overlay.lightness;
    controls.overlay.opacity;
    controls['hillshade-background'].lightness;
    setTimeout(() => {
      map?.terrain?.tileManager.freeRtt();
      // map?.terrain?.sourceCache.sourceCache.reload();
    }, 200);
  })

  let timeout: ReturnType<typeof setTimeout>;  // Some paint props shouldn't be spammed, so we clear the timeout for those
  $effect(() => {
    colorRelief.opacity;
    colorRelief.setBreakpoints.low;
    colorRelief.setBreakpoints.high;
    controls.hillshade.exaggeration;
    controls.hillshade.shadow_opacity;
    controls.hillshade.accent_opacity;
    controls.hillshade.highlight_opacity;
    controls['hillshade-background'].background;
    controls.hillshade.angle;
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      map?.terrain?.tileManager.freeRtt();
      // map?.terrain?.sourceCache.sourceCache.reload();
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

  let maxZoom: number | undefined;
  let metersPerMaxZoomPixel: number | undefined = $state();
  let metersPerPixel = $derived(2**(maxZoom - mapProps.zoom) * metersPerMaxZoomPixel);

  const getHeaderMetadata = async () => {
    const raster_header = await data?.raster.header 
    const raster_metadata = await data?.raster.metadata 
    const raster_dem_header = await data?.raster_dem.header 
    const raster_dem_metadata = await data?.raster_dem.metadata 
    const raster_overlay_header = await data?.raster_overlay.header 
    const raster_overlay_metadata = await data?.raster_overlay.metadata
    colorRelief.setBreakpoints.max = raster_dem_metadata?.maximum ?? 1;
    controls.rgb.visibility = raster_header ? true : false;
    colorRelief.colorReliefLayerVisibility = raster_dem_header ? 'visible' : 'none';
    controls.hillshade.visibility = raster_dem_header ? true : false;
    controls.overlay.visibility = raster_overlay_header ? true : false;
    controls.terrain.enabled = raster_dem_header ? true : false;
    colorRelief.opacity = raster_header ? 0.0 : 1.0;
    maxZoom = raster_metadata?.maxzoom ?? raster_dem_metadata?.maxzoom ?? raster_overlay_metadata?.maxzoom ?? undefined;
    const version = raster_metadata?.metadataVersion ?? raster_dem_metadata?.metadataVersion ?? raster_overlay_metadata?.metadataVersion;
    if (version === "0.4.0") {
      const key = "spatialResolutionMeters";
      metersPerMaxZoomPixel = raster_metadata?.[key] ?? raster_dem_metadata?.[key] ?? raster_overlay_metadata?.[key];
    } else if (version === "0.2.0") {
      const keyN = "conversionLengthMeters";
      const keyD = "conversionLengthPixels";
      metersPerMaxZoomPixel = (
        (raster_metadata?.[keyN] ?? raster_dem_metadata?.[keyN] ?? raster_overlay_metadata?.[keyN]) /
        (raster_metadata?.[keyD] ?? raster_dem_metadata?.[keyD] ?? raster_overlay_metadata?.[keyD])
      )
    }
    return {
      raster_header,
      raster_metadata,
      raster_dem_header,
      raster_dem_metadata,
      raster_overlay_header,
      raster_overlay_metadata
    }
  }

  $effect(() => {
    if (colorRelief.colorReliefLayerVisibility == 'none' && !controls.rgb.visibility) {
      controls['hillshade-background'].visibility = true;
    }
  })
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
          // () => {}
          map.addControl(new Minimap({
            width: "180px",
            height: "180px",
            lineColor: "#fff",
            fillColor: "#fff",
            // dragPan: false,
            // scrollZoom: false,
            // boxZoom: false,
            // dragRotate: false,
            // keyboard: false,
            // doubleClickZoom: false,
            // touchZoomRotate: false,
            zoom: -2,
            renderWorldCopies: false,
            transformConstrain: myUnderzoom.transformConstrain,
            style: {
              version: 8,
              sources: {
                ...(data?.raster.url && {
                  rgb: {
                    type: "raster",
                    url: data?.raster.url,
                    tileSize: 512
                  }
                }),
                ...(data?.raster_dem.url && {
                  hillshade: {
                    type: "raster-dem",
                    url: data?.raster_dem.url,
                    tileSize: 512,
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
        locale={locale}
        attributionControl={false}
        hash={true}
        renderWorldCopies={false}
        transformConstrain={myUnderzoom.transformConstrain}
        maxPitch={83}
        maxZoom={(hm.raster_header?.maxZoom ?? hm.raster_dem_header?.maxZoom ?? hm.raster_overlay_header?.maxZoom) + 4}
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
          customAttribution={getAttribution(hm.raster_metadata)}
        />
      {:else if hm.raster_dem_metadata}
        <AttributionControl
          compact={true}
          customAttribution={getAttribution(hm.raster_dem_metadata)}
        />
      {:else if hm.raster_overlay_metadata}
        <AttributionControl
          compact={true}
          customAttribution={getAttribution(hm.raster_overlay_metadata)}
        />
      {/if}
      <CustomControl position="bottom-right" class="maplibregl-ctrl-transparent maplibregl-ctrl-flex scale">
        <ScaleBar {metersPerPixel} />
      </CustomControl>
      <NavigationControl position="bottom-right" visualizePitch={true} visualizeRoll={true} />
      <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
        <div>
          <button
            title={"Zoom scale"}
            onclick={() => {
              map?.easeTo({zoom: Math.round(mapProps.zoom)})
            }}
            style={`color: ${((hm.raster_header?.maxZoom ?? hm.raster_dem_header?.maxZoom ?? hm.raster_overlay_header?.maxZoom) < mapProps.zoom) ? "red" : "#333"}; width: fit-content; padding-left: 4px; padding-right: 4px;`}
            >
            {(100 * 1 / 2 ** ((hm.raster_header?.maxZoom ?? hm.raster_dem_header?.maxZoom ?? hm.raster_overlay_header?.maxZoom) - mapProps.zoom)).toFixed(1)}%
          </button>
        </div>
      </CustomControl>
        {#if data?.raster.url}
          <RasterTileSource
            url={data?.raster.url}
            tileSize={256}
          >
            <RasterLayer
              layout={{
                'visibility': controls.rgb.visibility ? 'visible' : 'none',
              }}
              paint={{
                'raster-resampling': 'nearest',
                "raster-brightness-max": controls.rgb.brightness_max,
                "raster-brightness-min": controls.rgb.brightness_min,
                "raster-contrast": controls.rgb.contrast,
                "raster-opacity": controls.rgb.opacity,
                "raster-saturation": controls.rgb.saturation,
                "raster-hue-rotate": controls.rgb.hue,
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
            {#if controls.terrain.enabled}
              <Terrain exaggeration={controls.terrain.exaggeration} />
            {/if}
          </RasterDEMTileSource>
          <RasterDEMTileSource
            id="pseudocolor"
            url={data?.raster_dem.url}
            encoding="custom"
            baseShift={0}
            redFactor={256*256*controls.pseudocolor.interval}
            greenFactor={256*controls.pseudocolor.interval}
            blueFactor={1*controls.pseudocolor.interval}
            tileSize={256}
          >
            <ColorReliefLayer
              layout={colorRelief.layout}
              paint={colorRelief.paint}
            />
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
              layout={{
                'visibility': controls['hillshade-background'].visibility ? 'visible' : 'none',
              }}
              paint={{
                'background-opacity': controls['hillshade-background'].background,
                'background-color': `hsl(0, 0%, ${100*controls['hillshade-background'].lightness}%)`
              }}
            />
            <HillshadeLayer
              layout={{
                'visibility': controls.hillshade.visibility ? 'visible' : 'none',
              }}
              paint={{
                'hillshade-exaggeration': controls.hillshade.exaggeration,
                'hillshade-shadow-color': `rgba(0, 0, 0, ${controls.hillshade.shadow_opacity})`,
                'hillshade-accent-color': `rgba(0, 0, 0, ${controls.hillshade.accent_opacity})`,
                'hillshade-highlight-color': `rgba(255, 255, 255, ${controls.hillshade.highlight_opacity})`,
                // 'hillshade-shadow-color': `hsla(0, 0%, ${100*(controls['hillshade-background'].lightness * controls.hillshade.shadow_opacity)}%, 1.0)`,
                // 'hillshade-accent-color': `hsla(0, 0%, ${100*(controls['hillshade-background'].lightness * controls.hillshade.accent_opacity)}%, 1.0)`,
                // 'hillshade-highlight-color': `hsla(0, 0%, ${100*(controls['hillshade-background'].lightness + (1 - controls['hillshade-background'].lightness) * controls.hillshade.highlight_opacity)}%, 1.0)`,
                'hillshade-illumination-anchor': 'map',
                'hillshade-illumination-direction': controls.hillshade.angle
              }}
            />
          </RasterDEMTileSource>
          <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
            <button
              title={controls.terrain.enabled ? "Disable 3D" : "Enable 3D"}
              onclick={() => {
                controls.terrain.enabled = !controls.terrain.enabled;
              }}
              style:color={controls.terrain.enabled ? "#1b9fd0" : "#555"}
              style:font-weight=900>
              3D
            </button>
          </CustomControl>
        {/if}
        {#if data?.raster_overlay.url}
          <RasterTileSource
            url={data?.raster_overlay.url}
            tileSize={256}
          >
            <RasterLayer
              layout={{
                'visibility': controls.overlay.visibility ? 'visible' : 'none',
              }}
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
      </MapLibre>
    </div>
    <div
      class=controls-container
      style:font-size=1.2rem
    >
      <div class=controls>

        <div class="oneliner">
          <label class=checkbox><input
            type="checkbox"
            name="nan"
            bind:checked={controls.overlay.visibility}
            disabled={!data?.raster_overlay.url}
          /></label>
          <details class={[data?.raster_overlay.url ? 'enabled' : 'disabled']} name="nan">
            <summary>NaN
            </summary>
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
          </details>
        </div>

        <div class="oneliner">
          <label class=checkbox><input
            type="checkbox"
            name="hillshade"
            bind:checked={controls.hillshade.visibility}
            disabled={!data?.raster_dem.url}
          /></label>
          <details class={[data?.raster_dem.url ? 'enabled' : 'disabled']} name="hillshade">
            <summary>Hillshade
            </summary>
              <label>
                <input type="range" min=0 max=360 step=1 bind:value={controls.hillshade.angle} ondblclick={() => controls.hillshade.angle = 335}>
                Angle ({controls.hillshade.angle.toFixed(0).padStart(3, '0')}°)
              </label>
              <label>
                <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.exaggeration} ondblclick={() => controls.hillshade.exaggeration = 1}>
                Intensity ({controls.hillshade.exaggeration.toFixed(2)})
              </label>
              <label>
                <input type="range" min=1 max=20 step=1 bind:value={controls.hillshade.interval} ondblclick={() => controls.hillshade.interval = 1}>
                Multiplier ({controls.hillshade.interval.toFixed(0)}x)
              </label>
              <!-- <label>
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
              </label> -->
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
          </details>
        </div>

        <div class="oneliner">
          <label class=checkbox><input
            type="checkbox"
            name="hillshade-background"
            bind:checked={controls['hillshade-background'].visibility}
            disabled={!data?.raster_dem.url}
          /></label>
          <details class={[data?.raster_dem.url ? 'enabled' : 'disabled']} name="hillshade">
            <summary>Hillshade background
            </summary>
              <label>
                <input type="range" min=0 max=1 step=0.01 bind:value={controls['hillshade-background'].lightness} ondblclick={() => controls['hillshade-background'].lightness = 0.5}>
                Background lightness ({controls['hillshade-background'].lightness.toFixed(2)})
              </label>
          </details>
        </div>
        
        <div class="oneliner">
          <label class=checkbox><input
            type="checkbox"
            name="pseudocolor"
            bind:checked={() => colorRelief.colorReliefLayerVisibility == 'visible' ? true : false, (v) => colorRelief.colorReliefLayerVisibility = v ? 'visible' : 'none' }
            disabled={!data?.raster_dem.url}
          /></label>
          <details class={[data?.raster_dem.url ? 'enabled' : 'disabled']} name="pseudocolor">
            <summary>Pseudocolor
            </summary>
            <label>
              Colormap
              <select bind:value={colormap_selected} name="colormap" id="colormap-select">
                {#each Object.entries(COLORMAPS) as [colormap_name, colormap_array]}
                  <option value={colormap_name}>{colormap_name}</option>
                {/each}
              </select>
            </label>
            <label>
              <input type="range" min=0 max=1 step=0.01 bind:value={colorRelief.opacity} ondblclick={() => colorRelief.opacity = 1}>
              Opacity ({colorRelief.opacity.toFixed(2)})
            </label>
            <DualRangeInput
              min={colorRelief.setBreakpoints.min}
              max={colorRelief.setBreakpoints.max}
              bind:low={colorRelief.setBreakpoints.low}
              bind:high={colorRelief.setBreakpoints.high}
              step={colorRelief.setBreakpoints.step}
              --thumb-width=0.5rem
              --padding-top=0.5rem
              --padding-bottom=0.5rem
              --track-height=0.5rem
              --track-filled-color={trackFilledColor}
              --track-filled-gradient-mid-color={trackFilledGradientMidColor}
              --track-filled-gradient-end-color={trackFilledGradientEndColor}
            />
            <div style="display: flex; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; flex: 1 1 0; width: 0;">
                <span>{(colorRelief.setBreakpoints.min * hm.raster_dem_metadata?.metersPerInteger * 1000).toFixed(0)} mm</span>
                <span>{(colorRelief.setBreakpoints.low * hm.raster_dem_metadata?.metersPerInteger * 1000).toFixed(1)}</span>
              </div>
              <span> – </span>
              <div style="display: flex; justify-content: space-between; flex: 1 1 0; width: 0;">
                <span>{(colorRelief.setBreakpoints.high * hm.raster_dem_metadata?.metersPerInteger * 1000).toFixed(1)}</span>
                <span>{(colorRelief.setBreakpoints.max * hm.raster_dem_metadata?.metersPerInteger * 1000).toFixed(0)}</span>
              </div>
            </div>
          </details>
        </div>

        <div class=oneliner>
          <label class=checkbox><input
            type=checkbox
            name=rgb
            bind:checked={controls.rgb.visibility}
            disabled={!data?.raster.url}
          /></label>
          <details class={[data?.raster.url ? 'enabled' : 'disabled']} name="rgb">
            <summary>RGB
            </summary>
            <label>
              <input type="range" min=0 max=1 step=0.01 bind:value={controls.rgb.opacity} ondblclick={() => controls.rgb.opacity = 1}>
              Opacity ({controls.rgb.opacity.toFixed(2)})
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
            <label>
              <input type="range" min=-1 max=1 step=0.02 bind:value={controls.rgb.saturation} ondblclick={() => controls.rgb.saturation = 0}>
              Saturation ({controls.rgb.saturation.toFixed(2)})
            </label>
            <label>
              <input type="range" min=0 max=360 step=2 bind:value={controls.rgb.hue} ondblclick={() => controls.rgb.hue = 0}>
              Hue ({controls.rgb.hue.toFixed(0)}°)
            </label>
          </details>
        </div>

        <div class="oneliner">
          <label class=checkbox><input
            type="checkbox"
            name="3d"
            bind:checked={controls.terrain.enabled}
            disabled={!data?.raster_dem.url}
          /></label>
          <details class={[data?.raster_dem.url ? 'enabled' : 'disabled']} name="3d">
            <summary>3D
            </summary>
            <label>
              <input type="range" min=1 max=100 step=1 bind:value={controls.terrain.exaggeration} ondblclick={() => controls.terrain.exaggeration = 1}>
              Exaggeration ({controls.terrain.exaggeration.toFixed(0)}x)
            </label>
          </details>
        </div>

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
  .controls {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;  
    width: 400px;
  }

  .controls input[type=checkbox]{
    accent-color: white;
  }

  .controls details > label {
    margin: 0.2em 0; /* space between individual controls */
  }

  .controls * {
    pointer-events: auto;
  }

  .controls .oneliner {
    display: flex;
  }

  .oneliner > label.checkbox {
    padding-left: 0.2em;
    padding-right: 0.3em;
  }

  details summary {
    user-select: none;
    -webkit-user-select: none;
    color: white;
  }

  details summary:hover {
    text-decoration: underline;
  }

  details.disabled * {
    color: #a8a8aa;
    pointer-events: none;
  }

  details.enabled summary:hover::marker {
    color: #1b9fd0;
  }


  .controls label {
    display: block;
    filter: drop-shadow(0px 0px 2px #000000);
  }
  .controls {
    margin-bottom: 10px;
  }
  .controls-container {
    filter: drop-shadow(0px 0px 2px #000000) drop-shadow(0px 0px 10px #000000) drop-shadow(0px 0px 100px #000000);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: flex-end;
    flex-wrap: nowrap;
    grid-row-start: 1;
    grid-column-start: 1;
    overflow: hidden;
    margin-bottom: 4px;
  }
  :global(.maplibregl-ctrl-transparent.maplibregl-ctrl-flex.scale) {
    display: flex;
    flex-direction: column;
		background-color: transparent;
    border-color: transparent;
    box-shadow: none;
    pointer-events: none;
    user-select: none;
	}
	:global(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-transparent.maplibregl-ctrl-flex.scale) {
    align-items: flex-end;
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
