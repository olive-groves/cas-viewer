<script lang="ts">
  import {
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
    mapProps = $bindable()
  }: {
    data?: ViewerData,
    mapProps?: {}
  } = $props();

  let map = $state();

  let controls = $state({
    rgb: {
      brightness_max: 1.0,
      brightness_min: 0.0,
      contrast: 0.0
    },
    hillshade: {
      exaggeration: 0.7,
      interval: 1
    },
    overlay: {
      visibility: true
    }
  })


  // Paint props with terrain on are not immediately reflected
  // Reload here to do so
  $effect(() => {
    controls.rgb.brightness_max;
    controls.rgb.brightness_min;
    controls.rgb.contrast;
    controls.hillshade.exaggeration;
    setTimeout(() => {
        map?.terrain?.sourceCache.freeRtt();
        map?.terrain?.sourceCache.sourceCache.reload();
    }, 200);
  })

  $effect(() => {
    if (map) {
      const style = map.getStyle()
      const interval = controls.hillshade.interval;
      
      console.log(style)
  
      if (style?.sources?.hillshade) {
        style.sources.hillshade.redFactor = 256 * 256 * interval;
        style.sources.hillshade.greenFactor = 256 * interval;
        style.sources.hillshade.blueFactor = 1 * interval;
        map.setStyle(style)
      }
    }
  })

  let overlay_visibilty = $derived(controls.overlay.visibility ? "visible" : "none")

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
  <div class="container">
    <MapLibre
      bind:map={map}
      autoloadGlobalCss={false}
      inlineStyle="
        height: 100%;
        width: 100%;
        grid-row-start: 1;
        grid-column-start: 1;
      "
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
      <RasterTileSource
        url={data?.raster.url}
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
      >
        <HillshadeLayer
          paint={{
            'hillshade-exaggeration': controls.hillshade.exaggeration,
            'hillshade-shadow-color': "#000000",
            'hillshade-accent-color': "#00000080",
            'hillshade-highlight-color': "#ffffffff",
            'hillshade-illumination-anchor': 'map',
            'hillshade-illumination-direction': 0.0
          }}
        />
      </RasterDEMTileSource>
      <RasterTileSource
        url={data?.raster_overlay.url}
      >
        <RasterLayer
          layout={{
            'visibility': overlay_visibilty
          }}
          paint={{
            'raster-resampling': 'nearest'
          }}
        />
      </RasterTileSource>
    </MapLibre>
    <div
      class="controls"
    >
      <label>
        <input type="checkbox" bind:checked={controls.overlay.visibility}>
        NaN
      </label>
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
      <label>
        <input type="range" min=0 max=1 step=0.01 bind:value={controls.hillshade.exaggeration}>
        Hillshade ({controls.hillshade.exaggeration.toFixed(2)})
      </label>
      <label>
        <input type="range" min=0 max=100 step=1 bind:value={controls.hillshade.interval}>
        Hillshade overdrive ({controls.hillshade.interval.toFixed(0)})
      </label>
    </div>
  </div>
{/await}

<style>
  .controls * {
    pointer-events: auto;
  }
  .controls {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    pointer-events: none;
    /* justify-content: end; */
    z-index: 1;
    grid-row-start: 1;
    grid-column-start: 1;
  }
  .container {
    display: grid;
    grid-template-columns: 1fr;
    background-color: gray;
    height: var(--height);
    width: var(--width);
    grid-row-start: var(--grid-row-start);
    grid-column-start: var(--grid-column-start);
    margin: 0;
    padding: 0;
    position: var(--position, relative);
    clip-path: var(--clippath, none);
  }
</style>