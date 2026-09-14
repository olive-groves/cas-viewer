<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw as TerraDrawSvelte } from '@svelte-maplibre-gl/terradraw';
  import {
    TerraDrawSelectMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
    TerraDrawMarkerMode,
    TerraDrawPolyLineMode,
  } from 'terra-draw';
  import { SyncedTerraDraw } from '$lib/v0.8/synced-terra-draw.svelte';
  import SyncedTerraDrawSetup from '$lib/v0.8/SyncedTerraDrawSetup.svelte';

  // Proof

  // Shared state, options
  const defaultSelectFlags = {
    feature: {
      draggable: true,
      coordinates: {
        deletable: true,
        midpoints: true,
        draggable: true
      }
    }
  };
  const selectFlags = {
    point: defaultSelectFlags,
    marker: defaultSelectFlags,
    polygon: defaultSelectFlags,
    polyline: defaultSelectFlags,
  }
  // const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-200v-400h80v264l464-464 56 56-464 464h264v80H200Z"/></svg>`;
  const svg = `
  <svg
    width="200px" height="103px"
    viewBox="0 0 200 103"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
        fill="white"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="3"
          dy="3"
          stdDeviation="0"
          flood-color="black"
          flood-opacity="1"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="100" cy="100" r="100" fill="white" />
        <circle cx="100" cy="100" r="10" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g filter="url(#filter-shadow)">
      <g mask="url(#mask-inner-outer)">
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="200"
          height="200"
          fill="transparent"
        />
        <line
          x1="200"
          y1="0"
          x2="100"
          y2="100"
          stroke="white"
          stroke-width="4"
        />
      </g>
      <line
        x1="200"
        y1="0"
        x2="100"
        y2="100"
        stroke-width="4"
        stroke="transparent"
        marker-end="url(#marker-arrow)"
      />
    </g>
  </svg>
  `;
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const svgBlobUrl = URL.createObjectURL(svgBlob);
  const markerUrl = svgBlobUrl;

  const selectedSvg = `
  <svg
    width="200px" height="103px"
    viewBox="0 0 200 103"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
        fill="white"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="3"
          dy="3"
          stdDeviation="0"
          flood-color="black"
          flood-opacity="1"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="100" cy="100" r="100" fill="white" />
        <circle cx="100" cy="100" r="10" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g filter="url(#filter-shadow)">
      <g mask="url(#mask-inner-outer)">
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="200"
          height="200"
          fill="transparent"
        />
        <line
          x1="200"
          y1="0"
          x2="100"
          y2="100"
          stroke="white"
          stroke-width="4"
        />
      </g>
      <line
        x1="200"
        y1="0"
        x2="100"
        y2="100"
        stroke-width="4"
        stroke="transparent"
        marker-end="url(#marker-arrow)"
      />
      <circle cx="100" cy="100" r="4" fill="white" stroke="black" />
    </g>
  </svg>
  `;
  const selectedSvgBlob = new Blob([selectedSvg], { type: "image/svg+xml" });
  const selectedSvgBlobUrl = URL.createObjectURL(selectedSvgBlob);
  const selectedMarkerUrl = selectedSvgBlobUrl;

  const markerWidth = svg.match(`(width.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);;
  const markerHeight = svg.match(`(height.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
  const modeFactory = () => {
    {
      return [
        new TerraDrawSelectMode({
          flags: selectFlags,
          styles: {
            selectedMarkerUrl: selectedMarkerUrl,
            selectedMarkerWidth: markerWidth,
            selectedMarkerHeight: markerHeight,
          },
        }),
        new TerraDrawPointMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
        new TerraDrawMarkerMode({
          styles: {
            markerUrl: markerUrl,
            markerWidth: markerWidth,
            markerHeight: markerHeight,
          },
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
        new TerraDrawPolygonMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
        new TerraDrawPolyLineMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
      ];
    }
  }
  let syncedTerraDraw = new SyncedTerraDraw(modeFactory);
  const modeNames = syncedTerraDraw.modeFactory().map((mode) => mode.mode);
  let zoom = $state(0)
  let center = $state([0, 0])
  let pitch = $state(0)
  let bearing = $state(0)
  let roll = $state(0)

  syncedTerraDraw.addInstance("0");

  let render = $state(true);

</script>

<SyncedTerraDrawSetup
  id={syncedTerraDraw.id}
  bind:map={syncedTerraDraw.map}
  bind:draw={syncedTerraDraw.draw}
  modeFactory={syncedTerraDraw.modeFactory}
/>

<div class=stack style="height: 100%; width: 100%;">
  <div style="display: flex; height: 100%; width: 100%;">
    <!-- WARNING: DO NOT USE entries(); CLEARS TERRADRAW LAYERS {#each syncedTerraDraw.instances.entries() as instance (instance.id)} -->
    {#each syncedTerraDraw.instances.values() as instance (instance.id)}
    {#if render}
    <MapLibre
      inlineStyle="height: 100%; width: 100%;"
      renderWorldCopies={false}
      attributionControl={false}
      transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
      bind:zoom
      bind:center
      bind:pitch
      bind:bearing
      bind:roll
    >
      <BackgroundLayer
        layout={{visibility: "visible"}}
        paint={{"background-color": `rgb(${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)})`}}
      />
      <TerraDrawSvelte
        mode={syncedTerraDraw.mode}
        {...instance}
        bind:draw={instance.draw}
        modes={instance.modeFactory()}
      />
    </MapLibre>
    {/if}
    {/each}
  </div>

  <div class=controls style:align-self=start>
    <button
      onclick={() => {
        syncedTerraDraw.addInstance();
      }}>+ Viewer
    </button>
    <!-- <button
      onclick={() => {
        const instance = syncedTerraDraw.instances.get("0");
        if (instance?.visible) {
          instance.hide();
        } else {
          instance?.show();
        }
      }}>{syncedTerraDraw.instances.get("0")?.visible ? "Hide" : "Show"}
    </button> -->
    <button
      onclick={() => {render = !render}}>{render ? "Unrender" : "Render"}
    </button>
    <button
      onclick={() => {
        console.log(syncedTerraDraw.instances.get("0")?.draw);
      }}>log draw 0
    </button>
    {#each modeNames as modeName (modeName)}
      <label class=unselectable>
        <input type="radio" bind:group={syncedTerraDraw.mode} value={modeName}/>
        {modeName}
      </label>
    {/each}
    <!-- {#if syncedTerraDraw.selected}
      <button
        onclick={() => {
          if (!syncedTerraDraw.selected) return;
          const _selected = syncedTerraDraw.selected;
          drawA?.removeFeatures([_selected]);
          drawB?.removeFeatures([_selected]);
          drawA?.deselectFeature(_selected);
          drawB?.deselectFeature(_selected);
        }}>Remove</button
      >
    {/if} -->
  </div>
</div>

<style>
    .controls {
        display: flex;
        gap: 1em;
        position: absolute;
        z-index: 1;
        background-color: black;
    }
</style>
