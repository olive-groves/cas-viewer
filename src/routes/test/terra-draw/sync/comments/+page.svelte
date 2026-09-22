<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw as TerraDrawSvelte } from '@svelte-maplibre-gl/terradraw';
  import {
    TerraDrawSelectMode,
    TerraDrawMarkerMode,
    TerraDrawPolyLineMode,
    ValidateNotSelfIntersecting,
    TerraDrawRenderMode,
  } from 'terra-draw';
  import { SyncedTerraDraw, type Validator } from '$lib/v0.8/synced-terra-draw.svelte';
  import SyncedTerraDrawSetup from '$lib/v0.8/SyncedTerraDrawSetup.svelte';
  import AutogrowTextArea from '$lib/v0.8/AutogrowTextArea.svelte';

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
    // point: defaultSelectFlags,
    marker: defaultSelectFlags,
    // polygon: defaultSelectFlags,
    polyline: defaultSelectFlags,
  }
  const primary = "#fff";
  const shadow = "#000";
  const secondary = "#000";
  const fillOpacity = 0.3;
  // const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-200v-400h80v264l464-464 56 56-464 464h264v80H200Z"/></svg>`;
  const svg = `
  <svg
    width="200px" height="200px"
    viewBox="0 0 200 200"
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
        fill="${primary}"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="1"
          dy="1"
          stdDeviation="2"
          flood-color="${shadow}"
          flood-opacity="1"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="100" cy="100" r="100" fill="${primary}" />
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
          stroke="${primary}"
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
    width="200px" height="200px"
    viewBox="0 0 200 200"
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
        fill="${primary}"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="2"
          dy="2"
          stdDeviation="0"
          flood-color="${shadow}"
          flood-opacity="1"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="100" cy="100" r="100" fill="${primary}" />
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
          stroke="${primary}"
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
    <circle cx="100" cy="100" r="6" fill="${primary}" stroke="black" stroke-width="2" />
  </svg>
  `;
  const selectedSvgBlob = new Blob([selectedSvg], { type: "image/svg+xml" });
  const selectedSvgBlobUrl = URL.createObjectURL(selectedSvgBlob);
  const selectedMarkerUrl = selectedSvgBlobUrl;

  const markerWidth = svg.match(`(width.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
  const markerHeight = svg.match(`(height.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
  const validator: Validator = (feature, { updateType }) => {
    return { valid: SyncedTerraDraw.outOfBoundsValidator(feature, { updateType }).valid && ValidateNotSelfIntersecting(feature).valid };
  }
  const modeFactory = () => {
    return [
      new TerraDrawRenderMode({
        modeName: "view-only",
        styles: {},
      }),
      new TerraDrawSelectMode({
        flags: selectFlags,
        styles: {
          selectedMarkerUrl: selectedMarkerUrl,
          selectedMarkerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          selectedMarkerHeight: markerHeight ? parseInt(markerHeight) : undefined,
          selectedLineStringColor: primary,
          selectedPolygonColor: primary,
          selectedPolygonFillOpacity: fillOpacity,
          selectedPolygonOutlineColor: primary,
          selectionPointColor: primary,
          selectionPointOutlineColor: secondary,
          midPointColor: primary,
          midPointOutlineColor: secondary,

          // selectedPointColor
          // selectedPointWidth
          // selectedPointOpacity
          // selectedPointOutlineColor
          // selectedPointOutlineWidth
          // selectedPointOutlineOpacity

          // selectedMarkerUrl
          // selectedMarkerHeight
          // selectedMarkerWidth

          // selectedLineStringColor
          // selectedLineStringWidth
          // selectedLineStringOpacity
          // selectedLineStringDash

          // selectedPolygonColor
          // selectedPolygonFillOpacity
          // selectedPolygonOutlineColor
          // selectedPolygonOutlineOpacity
          // selectedPolygonOutlineWidth

          // selectionPointWidth
          // selectionPointColor
          // selectionPointOpacity
          // selectionPointOutlineColor
          // selectionPointOutlineWidth
          // selectionPointOutlineOpacity

          // midPointColor
          // midPointOutlineColor
          // midPointOpacity
          // midPointWidth
          // midPointOutlineWidth
          // midPointOutlineOpacity
        },
      }),
      new TerraDrawMarkerMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
        styles: {
          markerUrl: markerUrl,
          markerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          markerHeight: markerHeight ? parseInt(markerHeight) : undefined,
        },
      }),
      new TerraDrawPolyLineMode({
        validation: validator,
        styles: {
          lineStringColor: primary,
          // lineStringOpacity: ,
          // lineStringWidth: ,
          polygonFillColor: primary,
          polygonFillOpacity: fillOpacity,
          polygonOutlineColor: primary,
          // polygonOutlineOpacity: ,
          // polygonOutlineWidth: ,
          closingPointColor: primary,
          // closingPointOpacity: ,
          // closingPointWidth: ,
          closingPointOutlineColor: secondary,
          // closingPointOutlineOpacity: ,
          // closingPointOutlineWidth: ,
          snappingPointColor: primary,
          // snappingPointOpacity: ,
          // snappingPointWidth: ,
          snappingPointOutlineColor: secondary,
          // snappingPointOutlineOpacity: ,
          // snappingPointOutlineWidth: ,
          // @ts-ignore FIXME: Remove after bumping terra-draw
          coordinatePointColor: primary,
          // coordinatePointOpacity: ,
          // coordinatePointWidth: ,
          coordinatePointOutlineColor: secondary,
          // coordinatePointOutlineOpacity: ,
          // coordinatePointOutlineWidth: ,
        }
      }),
    ];
  }
  let syncedTerraDraw = new SyncedTerraDraw(modeFactory);
  let zoom = $state(0)
  let center = $state([0, 0])
  let pitch = $state(0)
  let bearing = $state(0)
  let roll = $state(0)

  syncedTerraDraw.addInstance("0");
  syncedTerraDraw.addInstance("1");

  let render = $state(true);

  syncedTerraDraw.onSyncedAddFeaturesListeners.push((features) => {
    console.warn("FIXME: If features were added from an existing JSON via .syncedAddFeatures(), this callback overwrites exiting custom properties, including created-by time.")
    features.forEach((feature) => {
      if (feature.id) {
        const now = new Date();
        syncedTerraDraw.updateFeatureProperties(feature.id, {
          // consider "custom-" prefix?
          created: now.toISOString(),
          modified: now.toISOString(),
          comment: {
            created: "",
            modified: "",
            text: "",
            author: "",
            replies: [
              // {
              //   created: "",
              //   modified: "",
              //   text: "",
              //   author: "",
              // }
            ],
          },
          category: "",
          tags: [],
          references: [
            // references with respect to... coordinate system? (image -> mercator unity)
          ],
          "coordinate-system": "EPSG:3857",

          // callback which appends props to that object?
          // baseline setter that fills:
          // async for elevation? area? -> no, we await that separately in the UI
        })
      }
    })
  })

  syncedTerraDraw.onSyncedUpdateFeatureGeometryListeners.push((id) => {
    syncedTerraDraw.updateFeatureProperties(id, {
      modified: new Date().toISOString(),
    })
  })

  $effect(() => {
    const element = document.getElementById(`feature-${syncedTerraDraw.selected}`);
    element?.scrollIntoView({block: "center", behavior: "smooth"});
  })

</script>

<SyncedTerraDrawSetup
  id={syncedTerraDraw.id}
  bind:map={syncedTerraDraw.map}
  bind:draw={syncedTerraDraw.draw}
  modeFactory={syncedTerraDraw.modeFactory}
  lastDrawSelectModeFactory={syncedTerraDraw.lastDrawSelectModeFactory}
/>

<div class="container stack">
  <div class="views">
    <!-- WARNING: DO NOT USE entries(); CLEARS TERRADRAW LAYERS {#each syncedTerraDraw.instances.entries() as instance (instance.id)} -->
    {#each syncedTerraDraw.instances.values() as instance, i (instance.id)}
      {#if render || i }
        <MapLibre
          inlineStyle="height: 100%; width: 100%;"
          renderWorldCopies={false}
          attributionControl={false}
          transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
          bind:zoom
          // @ts-ignore
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
            mode={syncedTerraDraw.actualMode}
            {...instance}
            bind:draw={instance.draw}
            modes={instance.modeFactory().concat(instance.lastDrawSelectModeFactory())}
          />
        </MapLibre>
      {/if}
    {/each}
  </div>

  <div class="controls unselectable">
    <button onclick={() => syncedTerraDraw.addInstance()}>
      + Viewer
    </button>
    <button onclick={() => render = !render}>
      {render ? "Unrender" : "Render"}
    </button>
    {#each syncedTerraDraw.modeNames as modeName (modeName)}
      <label class=unselectable>
        <input
          type="radio"
          name="syncedTerraDraw.userMode"
          value={modeName}
          checked={modeName === syncedTerraDraw.userMode}
          onclick={() => syncedTerraDraw.setUserMode(modeName)}
        />
        {modeName}
      </label>
    {/each}
    <div>
      (Actual mode: {syncedTerraDraw.actualMode})
    </div>
  </div>

  <div class=sidebar>

    <h2>Features</h2>

    <div class="features unselectable">

      {#each syncedTerraDraw.snapshot as feature (feature.id)}
      <div id={`feature-${feature.id}`} class={["feature", {selected: syncedTerraDraw.selected === feature.id}]}>
        <h3>id: {feature.id}</h3>
        <details>
          <summary>geometry</summary>
          <ul>
            {#each Object.entries(feature.geometry) as [key, value] (key) }
            <li>
              {key}: {value}
            </li>
            {/each}
          </ul>
        </details>
        <details>
          <summary>properties</summary>
          <ul>
            {#each Object.entries(feature.properties) as [key, value] (key) }
              <li>
                {key}: {value}
              </li>
            {/each}
          </ul>
        </details>
        <label>
          <select bind:value={feature.properties.category}>
            <option value="">Select a category</option>
            {#each ["crack", "loss", "uncategorized",] as category}
              <option value={category.toLowerCase()}>
                {category}
              </option>
            {/each}
          </select>
        </label>
        {#if feature.properties?.comment !== undefined}

          <!-- Comment widget with edit, cancel, etc. instead of binding -->
          <AutogrowTextArea
            placeholder="Start a conversation"
            bind:value={feature.properties.comment.text}
          />

          <!-- {#each feature.properties.comment.replies as }

          {/each} -->

        {/if}
        </div>
      {/each}

    </div>
  </div>
</div>

<style>
  .container {
    flex: 1;
    min-height: 0;

    .views {
      align-self: stretch;
      justify-self: stretch;

      display: flex;
    }
  }
  .controls {
    align-self: end;
    justify-self: start;
    z-index: 1;

    display: flex;

    gap: 1em;
    background-color: black;
  }
  .sidebar {
    align-self: stretch;
    justify-self: end;
    z-index: 1;

    max-width: 400px;

    display: flex;
    flex-direction: column;
    min-height: 0;

    background-color: rgba(0, 0, 0, 25%);

    .features {
      display: flex;
      flex-direction: column;
      overflow: auto;

      gap: 1em;
      background-color: rgba(0, 0, 0, 25%);

      .feature {
        border: 1px solid transparent;
        &.selected {
          border: 1px solid white;
        }
      }
    }
  }
</style>
