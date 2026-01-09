<script lang="ts">
  import { fade } from 'svelte/transition';
  import hillshadeIconEnabled from '$lib/hillshade-enabled.svg'
  import hillshadeIconDisabled from '$lib/hillshade-disabled.svg'
  import rgbIconEnabled from '$lib/rgb-enabled.svg'
  import rgbIconDisabled from '$lib/rgb-disabled.svg'
  import blenderIconEnabled from '$lib/blender-enabled.svg'
  import blenderIconDisabled from '$lib/blender-disabled.svg'
  import {
    MapLibre,
    RasterTileSource,
    RasterLayer,
    RasterDEMTileSource,
    Terrain,
    HillshadeLayer,
    NavigationControl,
    FullScreenControl,
    CustomControl,
    AttributionControl,
    BackgroundLayer
  } from 'svelte-maplibre-gl';
  import { PMTilesProtocol } from '@svelte-maplibre-gl/pmtiles';
  import { PMTiles } from 'pmtiles';
  import { Underzoom } from 'maplibre-xy';
  import maplibregl from 'maplibre-gl';
  import type { FlyToOptions } from 'maplibre-gl';
  
  let map: maplibregl.Map | undefined = $state()

  let disclaimerVisible = $state(true)
  let colorVisible = $state(false)
  let terrainVisible = $state(true)
  let hillshadeVisible = $state(false)
  let blenderVisible = $state(true)
  let creditsVisible = $state(false)
  let zoom = $state()

  function toggleBlender() {
    blenderVisible = !blenderVisible;
    if (blenderVisible && hillshadeVisible) hillshadeVisible = false;
    if (blenderVisible && colorVisible) colorVisible = false;
    if (!blenderVisible && (!colorVisible && !hillshadeVisible)) {
      colorVisible = true;
      hillshadeVisible = true;
    }
  }
  
  function toggleHillshade() {
    hillshadeVisible = !hillshadeVisible;
    if (hillshadeVisible && blenderVisible) blenderVisible = false;
    if (!hillshadeVisible && !colorVisible) colorVisible = true
  }

  function toggleColor() {
    colorVisible = !colorVisible;
    if (colorVisible && blenderVisible) blenderVisible = false;
    if (!colorVisible && !hillshadeVisible) hillshadeVisible = true
  }

  let maxZoom = $state(5);
</script>

<div id=main style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; margin: none; background-color: black;">
  <MapLibre
    bind:map={map}
    bind:zoom
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
    hash={true}
    attributionControl={false}
    maxZoom={maxZoom + 2}
  >
    <CustomControl position="top-right" class="credits">
      <div>
        <button
          onclick={() => creditsVisible = !creditsVisible}
          style="color: #333; width: fit-content; padding-left: 4px; padding-right: 4px;"
        >
        Powered by
        </button>
      </div>
      {#if creditsVisible}
        <div style:color=black style:background-color=#333 style:padding=4px>
          <p style:margin=0px>
            <a href='https://maplibre.org/'>MapLibre</a>
            <a href='https://libvips.org/'>libvips</a>
            <a href='https://svelte-maplibre-gl.mierune.dev/'>Svelte MapLibre GL</a>
            <a href='https://blender.org/'>Blender</a>
          </p>
          <p style:margin=0px>
            <a href='https://docs.protomaps.com/'>PMTiles</a>
            <a href='https://python.org/'>Python</a>
            <a href='https://opencv.org/'>OpenCV</a>
            <a href='https://developer.mozilla.org/'>MDN</a>
            <a href='https://svgrepo.com/'>SVG Repo</a>
          </p>
        </div>
      {/if}
    </CustomControl>
    <FullScreenControl position="top-right" container={document.getElementById("main")}/>
    <NavigationControl position="bottom-right" showCompass={true} visualizePitch={true} visualizeRoll={true}/>
    <AttributionControl position="bottom-left" compact={true} customAttribution={"<a href='https://harmbelt.nl/'>Harm Belt · <em>Almond Blossom<em></a>"} />
    <CustomControl position="bottom-left">
      <button
      title={terrainVisible ? "Disable 3D" : "Enable 3D"}
      onclick={() => {
          terrainVisible = !terrainVisible;
          if (terrainVisible) {setTimeout(() => ease3D(), 200)}
          else {setTimeout(() => ease2D(), 200)}
        }}
        style:color={terrainVisible ? "#1b9fd0" : "#555"}
        style:font-weight=900>
        3D
      </button>
    </CustomControl>
    <CustomControl position="bottom-left">
      <button
        title={colorVisible ? "Hide RGB" : "Show RGB"}
        onclick={() => {toggleColor()}}>
        <img alt="RGB icon" src={colorVisible ? rgbIconEnabled : rgbIconDisabled} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
      <button
        title={hillshadeVisible ? "Hide shading" : "Show shading"}
        onclick={() => {toggleHillshade()}}>
        <img alt="Hillshade icon" src={hillshadeVisible ? hillshadeIconEnabled : hillshadeIconDisabled} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
    </CustomControl>
    <CustomControl position="bottom-left">
      <button
        title={blenderVisible ? "Hide raytracing render" : "Show raytracing render"}
        onclick={() => {toggleBlender()}}>
        <img alt="Blender icon" src={blenderVisible ? blenderIconEnabled : blenderIconDisabled} style="position: relative; width: 80%; margin-bottom: -2px;"/>
      </button>
    </CustomControl>
    <CustomControl position="top-left">
      <div>
        <button
          onclick={() => {
          }}
          style="color: #333; padding-left: 4px; padding-right: 4px;"
        >
        Fly
        </button>
      </div>
    </CustomControl>
    <CustomControl position="bottom-right" class="maplibregl-ctrl maplibregl-ctrl-group">
      <div>
        <button
          title={"Zoom level"}
          onclick={() => {
            map?.easeTo({zoom: Math.round(map.getZoom())})
          }}
          style="font-family: system-ui; color: #333; width: fit-content; padding-left: 4px; padding-right: 4px; font-variant-numeric: tabular-nums;"
          >
          {(100 * 1 / 2 ** (maxZoom - zoom)).toFixed(1)}%
        </button>
      </div>
    </CustomControl>
    <CustomControl position="bottom-right" class="maplibregl-ctrl-transparent maplibregl-ctrl-flex scale">
      <div
        style={`width: ${( (1 / 2 ** (maxZoom - zoom)) * (2.5 / 1000) / (0.024000000208616257 / 3072) ).toFixed(0)}px`}
        style:border-top={`1px solid #fff`}
        style:border-bottom={`1px solid #000`}>
      </div>
      <div
        style:text-align="end">
        <div
          style:color="white"
          style:font-family="system-ui"
          style:font-weight=600
          style="text-shadow: 1px 1px 1px rgb(0 0 0 / 100%);"
        >
          {2.5} mm
        </div>
      </div>
    </CustomControl>
  </MapLibre>
  {#if disclaimerVisible}
    <em
    style="position: absolute; pointer-events: none; font-size: 2em; text-shadow: 2px 2px 8px black;" transition:fade>
      No layers
    </em>
  {/if}
</div>

<style>
	:global(.maplibregl-ctrl-transparent.maplibregl-ctrl-flex.scale) {
    display: flex;
    flex-direction: column;
		background-color: transparent;
    border-color: transparent;
    box-shadow: none;
	}
	:global(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-transparent.maplibregl-ctrl-flex.scale) {
    align-items: flex-end;
	}
  :global(.scale) {
    pointer-events: none;
  }
	:global(.maplibregl-ctrl-top-right) {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
	}
	:global(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-group) {
    display: flex;
    flex-direction: row-reverse;
    align-items: flex-end;
	}
	:global(.maplibregl-ctrl-bottom-right .maplibregl-ctrl-group button+button) {
    border-top: unset;
    border-right: 1px solid #ddd
	}
	:global(.credits) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
	}

</style>
