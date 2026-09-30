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
  } from 'terra-draw';
  import { SyncedTerraDraw, SyncedTerraDrawModeManager, type Validator } from '$lib/v0.8/synced-terra-draw.svelte';
  import SyncedTerraDrawSetup from '$lib/v0.8/SyncedTerraDrawSetup.svelte';
  import FeatureList from '$lib/v0.8/FeatureList.svelte';
  import FeatureInspectorEditor from '$lib/v0.8/FeatureInspectorEditor.svelte';

  // Proof

  // Shared state, options
  const defaultSelectFlags = {
    feature: {
      draggable: false,
      coordinates: {
        deletable: false,
        midpoints: false,
        draggable: false,
      }
    }
  };
  const selectFlags = {
    marker: defaultSelectFlags,
    polyline: defaultSelectFlags,
  }
  const defaultEditFlags = {
    feature: {
      draggable: true,
      coordinates: {
        deletable: true,
        midpoints: true,
        draggable: true
      }
    }
  };
  const editFlags = {
    marker: defaultEditFlags,
    polyline: defaultEditFlags,
  }
  const primary = "#fff";
  const shadow = "#000";
  const secondary = "#000";
  const fillOpacity = 0.2;

  const strokeOpacity = 0.8;
  const selectedStrokeOpacity = 1.0;

  const VIEWBOXSIZE = 256;
  const ARROWX0 = 256;
  const ARROWY0 = 0;
  const viewBoxWidthPx = 128;
  const viewBoxHeightPx = viewBoxWidthPx;
  const pixelsPerViewBoxPixel = VIEWBOXSIZE / viewBoxWidthPx;
  const strokeWidth = 2;
  const selectedStrokeWidth = 3;
  const selectedOutlineWidth = 2;

  const pointSize = 2;
  const selectedPointSize = 4;
  const midPointSize = 3;
  const lineWidth = 2;
  const selectedLineWidth = 4;
  const markerArrowRelativeWidth = 5;
  const selectedMarkerArrowRelativeWidth = 4;

  const svg = `
  <svg
    width="${viewBoxWidthPx}px" height="${viewBoxHeightPx}px"
    viewBox="0 0 ${VIEWBOXSIZE} ${VIEWBOXSIZE}"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 12 12"
        refX="12"
        refY="6"
        markerWidth="${markerArrowRelativeWidth}"
        markerHeight="${markerArrowRelativeWidth}"
        orient="auto-start-reverse"
        fill="${primary}"
        fill-opacity="${strokeOpacity}"
      >
        <path d="M 0 0 L 12 6 L 0 12 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="${1 * pixelsPerViewBoxPixel}"
          dy="${1 * pixelsPerViewBoxPixel}"
          stdDeviation="2"
          flood-color="${shadow}"
          flood-opacity="${strokeOpacity}"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2}" fill="${primary}" />
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2 / 8}" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g filter="url(#filter-shadow)">
      <g mask="url(#mask-inner-outer)">
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="${VIEWBOXSIZE / 2}"
          height="${VIEWBOXSIZE / 2}"
          fill="transparent"
        />
        <line
          x1="${212}"
          y1="${44}"
          x2="${VIEWBOXSIZE / 2}"
          y2="${VIEWBOXSIZE / 2}"
          stroke="${primary}"
          stroke-opacity="${strokeOpacity}"
          stroke-width="${strokeWidth * pixelsPerViewBoxPixel}"
        />
      </g>
      <line
        x1="${ARROWX0}"
        y1="${ARROWY0}"
        x2="${VIEWBOXSIZE / 2}"
        y2="${VIEWBOXSIZE / 2}"
        stroke-width="${strokeWidth * pixelsPerViewBoxPixel}"
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
    width="${viewBoxWidthPx}px" height="${viewBoxHeightPx}px"
    viewBox="0 0 ${VIEWBOXSIZE} ${VIEWBOXSIZE}"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="${selectedMarkerArrowRelativeWidth}"
        markerHeight="${selectedMarkerArrowRelativeWidth}"
        orient="auto-start-reverse"
        fill="${primary}"
        fill-opacity="${selectedStrokeOpacity}"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="${selectedOutlineWidth * pixelsPerViewBoxPixel}"
          dy="${selectedOutlineWidth * pixelsPerViewBoxPixel}"
          stdDeviation="0"
          flood-color="${shadow}"
          flood-opacity="${selectedStrokeOpacity}"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2}" fill="${primary}" />
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2 / 8}" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g filter="url(#filter-shadow)">
      <g mask="url(#mask-inner-outer)">
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="${VIEWBOXSIZE / 2}"
          height="${VIEWBOXSIZE / 2}"
          fill="transparent"
        />
        <line
          x1="${ARROWX0}"
          y1="${ARROWY0}"
          x2="${VIEWBOXSIZE / 2}"
          y2="${VIEWBOXSIZE / 2}"
          stroke="${primary}"
          stroke-opacity="${selectedStrokeOpacity}"
          stroke-width="${selectedStrokeWidth * pixelsPerViewBoxPixel}"
        />
      </g>
      <line
        x1="${ARROWX0}"
        y1="${ARROWY0}"
        x2="${VIEWBOXSIZE / 2}"
        y2="${VIEWBOXSIZE / 2}"
        stroke-width="${selectedStrokeWidth * pixelsPerViewBoxPixel}"
        stroke="transparent"
        marker-end="url(#marker-arrow)"
      />
    </g>
  </svg>
  `;
  const selectedSvgBlob = new Blob([selectedSvg], { type: "image/svg+xml" });
  const selectedSvgBlobUrl = URL.createObjectURL(selectedSvgBlob);
  const selectedMarkerUrl = selectedSvgBlobUrl;

  const editingSvg = `
  <svg
    width="${viewBoxWidthPx}px" height="${viewBoxHeightPx}px"
    viewBox="0 0 ${VIEWBOXSIZE} ${VIEWBOXSIZE}"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMaxYMax meet"
  >
    <defs>
      <marker
        id="marker-arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="${selectedMarkerArrowRelativeWidth}"
        markerHeight="${selectedMarkerArrowRelativeWidth}"
        orient="auto-start-reverse"
        fill="${primary}"
        fill-opacity="${selectedStrokeOpacity}"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>

      <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
        <feDropShadow
          dx="${selectedOutlineWidth * pixelsPerViewBoxPixel}"
          dy="${selectedOutlineWidth * pixelsPerViewBoxPixel}"
          stdDeviation="0"
          flood-color="${shadow}"
          flood-opacity="${selectedStrokeOpacity}"
        />
      </filter>

      <mask id="mask-inner-outer">
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2}" fill="${primary}" />
        <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${VIEWBOXSIZE / 2 / 8}" fill="black" />
      </mask>

    </defs>

    <!-- A line with a marker -->
    <g filter="url(#filter-shadow)">
      <g mask="url(#mask-inner-outer)">
        <rect
          id="_square-spanner"
          x="0"
          y="0"
          width="${VIEWBOXSIZE / 2}"
          height="${VIEWBOXSIZE / 2}"
          fill="transparent"
        />
        <line
          x1="${ARROWX0}"
          y1="${ARROWY0}"
          x2="${VIEWBOXSIZE / 2}"
          y2="${VIEWBOXSIZE / 2}"
          stroke="${primary}"
          stroke-opacity="${selectedStrokeOpacity}"
          stroke-width="${selectedStrokeWidth * pixelsPerViewBoxPixel}"
        />
      </g>
      <line
        x1="${ARROWX0}"
        y1="${ARROWY0}"
        x2="${VIEWBOXSIZE / 2}"
        y2="${VIEWBOXSIZE / 2}"
        stroke-width="${selectedStrokeWidth * pixelsPerViewBoxPixel}"
        stroke="transparent"
        marker-end="url(#marker-arrow)"
      />
    </g>
    <circle cx="${VIEWBOXSIZE / 2}" cy="${VIEWBOXSIZE / 2}" r="${selectedPointSize * pixelsPerViewBoxPixel}" fill="${primary}" stroke="black" stroke-width="${selectedOutlineWidth * pixelsPerViewBoxPixel}" />
  </svg>
  `;
  const editingSvgBlob = new Blob([editingSvg], { type: "image/svg+xml" });
  const editingSvgBlobUrl = URL.createObjectURL(editingSvgBlob);
  const editingMarkerUrl = editingSvgBlobUrl;

  const markerWidth = svg.match(`(width.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
  const markerHeight = svg.match(`(height.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);

  const validator: Validator = (feature, { updateType }) => {
    return { valid: SyncedTerraDraw.outOfBoundsValidator(feature, { updateType }).valid && ValidateNotSelfIntersecting(feature).valid };
  }
  const modeFactory = () => {
    return [
      // Default mode that can only select.
      new TerraDrawSelectMode({
        modeName: "select",
        flags: selectFlags,
        styles: {
          selectedMarkerUrl: selectedMarkerUrl,
          selectedMarkerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          selectedMarkerHeight: markerHeight ? parseInt(markerHeight) : undefined,
          selectedLineStringColor: primary,
          selectedPolygonColor: primary,
          selectedPolygonFillOpacity: fillOpacity,
          selectedPolygonOutlineColor: primary,
          selectedPolygonOutlineWidth: selectedLineWidth,
          selectionPointWidth: 0,
        },
      }),
      // This is not a mode for users. It can select, modify, and delete all features.
      // There is too much power here, and too much handling.
      // Instead, a hidden "isolated-edit" mode is used for editing specific features.
      // Its capabilities and styling are derived here.
      new TerraDrawSelectMode({
        modeName: "edit",
        flags: editFlags,
        styles: {
          selectedMarkerUrl: editingMarkerUrl,
          selectedMarkerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          selectedMarkerHeight: markerHeight ? parseInt(markerHeight) : undefined,
          selectedLineStringColor: primary,
          selectedPolygonColor: primary,
          selectedPolygonFillOpacity: fillOpacity,
          selectedPolygonOutlineColor: primary,
          selectedPolygonOutlineWidth: selectedLineWidth,
          selectionPointColor: primary,
          selectionPointOutlineColor: secondary,
          selectionPointWidth: selectedPointSize,
          midPointColor: primary,
          midPointOutlineColor: secondary,
          midPointWidth: midPointSize,
          midPointOutlineWidth: 1,

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
      // Isolated edit mode, identical to edit mode.
      new TerraDrawSelectMode({
        modeName: SyncedTerraDrawModeManager.ISOLATED_EDIT_MODE_NAME,
        allowManualSelection: false,
        flags: editFlags,
        styles: {
          selectedMarkerUrl: editingMarkerUrl,
          selectedMarkerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          selectedMarkerHeight: markerHeight ? parseInt(markerHeight) : undefined,
          selectedLineStringColor: primary,
          selectedPolygonColor: primary,
          selectedPolygonFillOpacity: fillOpacity,
          selectedPolygonOutlineColor: primary,
          selectedPolygonOutlineWidth: selectedLineWidth,
          selectionPointColor: primary,
          selectionPointOutlineColor: secondary,
          selectionPointWidth: selectedPointSize,
          midPointColor: primary,
          midPointOutlineColor: secondary,
          midPointWidth: midPointSize,
          midPointOutlineWidth: 1,
        },
      }),
      new TerraDrawMarkerMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
        styles: {
          markerUrl: ({properties}) => properties?._currentlyHovering ? selectedMarkerUrl : markerUrl,
          markerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          markerHeight: markerHeight ? parseInt(markerHeight) : undefined,
        },
      }),
      new TerraDrawPolyLineMode({
        validation: validator,
        styles: {
          lineStringColor: primary,
          lineStringOpacity: 1 * 0.8,
          lineStringWidth: ({properties}) => properties?._currentlyHovering ? selectedLineWidth : lineWidth,
          polygonFillColor: primary,
          polygonFillOpacity: ({properties}) => properties?._currentlyHovering ? fillOpacity : (fillOpacity / 2),
          polygonOutlineColor: primary,
          // polygonOutlineOpacity: ,
          polygonOutlineWidth: ({properties}) => properties?._currentlyHovering ? selectedLineWidth : lineWidth,
          closingPointColor: primary,
          // closingPointOpacity: ,
          closingPointWidth: selectedPointSize,
          closingPointOutlineColor: secondary,
          // closingPointOutlineOpacity: ,
          // closingPointOutlineWidth: ,
          snappingPointColor: primary,
          // snappingPointOpacity: ,
          snappingPointWidth: pointSize,
          snappingPointOutlineColor: secondary,
          // snappingPointOutlineOpacity: ,
          // snappingPointOutlineWidth: ,
          // @ts-ignore FIXME: Remove after bumping terra-draw
          coordinatePointColor: primary,
          // coordinatePointOpacity: ,
          coordinatePointWidth: midPointSize,
          coordinatePointOutlineColor: secondary,
          // coordinatePointOutlineOpacity: ,
          // coordinatePointOutlineWidth: ,
        }
      }),
    ];
  }
  let syncedTerraDraw = new SyncedTerraDraw(modeFactory);
  let modeManager = new SyncedTerraDrawModeManager(syncedTerraDraw, {modeOnDeselect: "select"});

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
        syncedTerraDraw.updateSnapshotFeatureProperties(feature.id, {
          // reserved: TerraDraw
          // mode: string,
          // marker: bool,

          // file-esque info
          // consider "custom-" prefix?
          created: now.toISOString(),
          modified: now.toISOString(),
          "created-by": "author0",
          "modified-by": "author1",

          // annotation text info
          category: "",
          tags: [],
          title: "",
          comment: {
            created: "",
            modified: "",
            text: "",
            author: "",
            comments: [
              // {
              //   created: "",
              //   modified: "",
              //   text: "",
              //   author: "",
              //   comments: [], // NESTED REPLIES NOT SUPPORTED
              // }
            ],
          },
          references: [
            // references with respect to... coordinate system? (image -> mercator unity)
          ],
          "coordinate-system": "EPSG:3857",

          // callback which appends props to that object?
          // baseline setter that fills:
          // async for elevation? area? -> no, we await that separately in the UI
          // async for references? filters to unique (no duplicates)
        })
      }
    })
  })

  syncedTerraDraw.onSyncedUpdateFeatureGeometryListeners.push((id) => {
    syncedTerraDraw.updateSnapshotFeatureProperties(id, {
      modified: new Date().toISOString(),
    })
  })

  $effect(() => {
    const element = document.getElementById(`feature-${syncedTerraDraw.selected}`);
    element?.scrollIntoView({block: "center", behavior: "smooth"});
  })

  let tags = $state([
    "urgent",
    "resolved",
  ])

</script>

<SyncedTerraDrawSetup
  id={syncedTerraDraw.id}
  bind:map={syncedTerraDraw.map}
  bind:draw={syncedTerraDraw.draw}
  modeFactory={syncedTerraDraw.modeFactory}
/>

<div class="container">
  <div class="viewer stack">
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
              mode={modeManager.actualMode}
              {...instance}
              bind:draw={instance.draw}
              modes={instance.modeFactory()}
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
        {#if !modeName.includes("edit")}
          <label class=unselectable>
            <input
              type="radio"
              name="syncedTerraDraw.userMode"
              value={modeName}
              checked={modeName === modeManager.userMode}
              onclick={() => modeManager.setUserMode(modeName)}
            />
            {modeName}
          </label>
        {/if}
      {/each}
      <div>
        (Actual mode: {modeManager.actualMode})
      </div>
    </div>

    {#if syncedTerraDraw.selected !== null}
      {@const feature = syncedTerraDraw.snapshot.find((f) => f.id === syncedTerraDraw.selected)}
      <div class="context">
        <FeatureInspectorEditor
          mode={modeManager.actualMode === SyncedTerraDrawModeManager.ISOLATED_EDIT_MODE_NAME ? "editing" : "selected"}
          properties={syncedTerraDraw.snapshot.find((f) => f.id === syncedTerraDraw.selected).properties}
          geometry={feature?.geometry}
          onEditClick={() => syncedTerraDraw.selected !== null && modeManager.selectIsolatedEdit(syncedTerraDraw.selected)}
          onDoneClick={() => modeManager.deselectIsolatedEdit(undefined, true)}
          onSelectedCloseClick={() => syncedTerraDraw.syncedDeselectFeature(undefined, null)}
          onEditingCloseClick={() => modeManager.deselectIsolatedEdit(undefined, true)}
          onDrawAnotherClick={() => modeManager.deselectIsolatedEdit(feature?.properties?.mode)}
        />
      </div>
    {/if}
  </div>

  <div class=sidebar>

    <details open>
      <summary class="unselectable">Annotations</summary>
      <FeatureList
        features={syncedTerraDraw.snapshot}
        selectedFeature={syncedTerraDraw.selected}
        onFeatureHoverStart={(id) => syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: true})}
        onFeatureHoverEnd={(id) => syncedTerraDraw.syncedUpdateFeatureProperties(undefined, id, {_currentlyHovering: undefined})}
        onFeatureClick={(id) => {
          if (modeManager.actualMode === SyncedTerraDrawModeManager.ISOLATED_EDIT_MODE_NAME) {
            modeManager.selectIsolatedEdit(id);
          } else {
            modeManager.setUserMode("select");
            syncedTerraDraw.syncedSelectFeature(undefined, id);
          }
        }}
        onFeatureDoubleClick={() => console.warn("Implement fit-feature-on-map.")}
        onFeatureEdit={(id) => modeManager.selectIsolatedEdit(id)}
      />
    </details>

  </div>
</div>

<style>
  .container {
    flex: 1;
    min-height: 0;

    display: flex;
    .viewer {
      flex: 1;
      .views {
        align-self: stretch;
        justify-self: stretch;

        display: flex;
    }
    }
  }
  .controls {
    align-self: start;
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

    min-width: 40ch;

    display: flex;
    flex-direction: column;
    min-height: 0;

    background-color: rgba(0, 0, 0, 25%);
  }

  .context {
    align-self: start;
    justify-self: end;
    z-index: 1;
    margin: var(--gap);
    width: 100%;
    max-width: 350px;
    overflow-y: auto;
  }
</style>
