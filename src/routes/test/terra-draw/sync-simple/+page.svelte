<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw } from '@svelte-maplibre-gl/terradraw';
  import type { TerraDraw as Draw } from 'terra-draw';
  import {
    TerraDrawSelectMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
  } from 'terra-draw';
  import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';
  import { isGeometryOutOfBounds, terraDrawMaxBounds, wrapGeometryCoordinatesToBounds } from '$lib/v0.8/geojson-utils';

  type FeatureId = string | number;

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
    polygon: defaultSelectFlags,
  }

  let mode = $state('point');
  let selected: string | number | null = $state(null);

  // Individual state
  let drawA: Draw | undefined = $state.raw();
  let drawB: Draw | undefined = $state.raw();
  const modesA = [
    new TerraDrawSelectMode({
      flags: selectFlags,
    }),
    new TerraDrawPointMode({
      validation: (feature, { updateType }) => {
        if (updateType === "finish" || updateType === "commit" || updateType === "provisional") {
          if (isGeometryOutOfBounds(feature.geometry, terraDrawMaxBounds)) {
            return { valid: false };
          }
        }
        return { valid: true }
      }
    }),
    new TerraDrawPolygonMode({
      validation: (feature, { updateType }) => {
        if (updateType === "finish" || updateType === "commit" || updateType === "provisional") {
          if (isGeometryOutOfBounds(feature.geometry, terraDrawMaxBounds)) {
            return { valid: false };
          }
        }
        return { valid: true }
      }
    }),
  ];
  const modesB = [
    new TerraDrawSelectMode({
      flags: selectFlags,
    }),
    new TerraDrawPointMode(),
    new TerraDrawPolygonMode(),
  ];

  // Proof
  const modeNames = modesA.map((mode) => mode.mode);
  let zoom = $state(0)
  let center = $state()
  let pitch = $state()
  let bearing = $state()
  let roll = $state()

</script>

<!-- Minimum example of two maps A and B whose TerraDraws are synchronized:
- Draw on A, add to B
- Delete on A, delete on B
- Move on A, move on B

One global toolbar shared between both maps:
- Point mode is Point mode on A and B
-->

<div class=stack style="height: 100%; width: 100%;">
  <div style="display: flex; height: 100%; width: 100%;">
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
        paint={{"background-color": "blue"}}
      />
      <TerraDraw
        mode={mode}
        modes={modesA}
        bind:draw={drawA}
        onselect={(id: FeatureId) => {
          console.log("onselect", id);
          selected = id;
        }}
        ondeselect={(id: FeatureId) => {
          console.log("ondeselect", id);
          // TODO: Report
          // Bug: Press Escape when dragging a selected feature; onfinish returns undefined id; position A not progogated to B
          let featureA = drawA?.getSnapshotFeature(id);
          if (featureA) {
            drawB?.updateFeatureGeometry(id, featureA.geometry);  // Then propogate
          }
          selected = null;
        }}
        onfinish={(id: FeatureId, context?) => {
          console.log("onfinish", id, context);
          if (typeof id === "undefined") return;
          if (context?.action === "draw") {
            const featureA = drawA?.getSnapshotFeature(id);
            if (featureA) {
              drawB?.addFeatures([featureA]);
            }
          // } else if (context && ["dragCoordinate", "dragFeature", "dragCoordinateResize",].includes(context?.action)) {
          } else {
            let featureA = drawA?.getSnapshotFeature(id);
            if (featureA) {
              featureA.geometry.coordinates = wrapGeometryCoordinatesToBounds(featureA.geometry, terraDrawMaxBounds);
              featureA.geometry = roundGeometryCoordinates(featureA.geometry);
              drawA?.updateFeatureGeometry(id, featureA.geometry);  // Ensure drawn is wrapped
              drawB?.updateFeatureGeometry(id, featureA.geometry);  // Then propogate
            }
          }
        }}
        onchange={(ids: FeatureId[], type: string, context?) => {
          console.log("onchange", ids, type, context);
        }}
        onhistory={({cause, stack, undoSize, redoSize}) => {
          console.log("onhistory", cause, stack, undoSize, redoSize);
        }}
      />
    </MapLibre>

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
        paint={{"background-color": "gray"}}
      />
      <TerraDraw
        mode={mode}
        modes={modesB}
        bind:draw={drawB}
        // onselect={(id: FeatureId) => {
        //   selected = id;
        // }}
        // ondeselect={(id: FeatureId) => {
        //   selected = null;
        // }}
        // onfinish={(id: FeatureId, context?) => {
        //   const feature = drawB?.getSnapshotFeature(id);
        //   drawA?.addFeatures([feature])
        // }}
        // onchange={(ids: FeatureId[], type: string, context?) => {
        //   console.log(ids, type, context);
        // }}
        // onhistory={({cause, stack, undoSize, redoSize}) => {
        //   console.log(cause, stack, undoSize, redoSize);
        // }}
      />
    </MapLibre>
  </div>

  <div class=controls style:align-self=start>
    {#each modeNames as modeName (modeName)}
      <label class=unselectable>
        <input type="radio" bind:group={mode} value={modeName}/>
        {modeName}
      </label>
    {/each}
    {#if selected}
      <button
        onclick={() => {
          if (!selected) return;
          const _selected = selected;
          drawA?.removeFeatures([_selected]);
          drawB?.removeFeatures([_selected]);
          drawA?.deselectFeature(_selected);
          drawB?.deselectFeature(_selected);
        }}>Remove</button
      >
    {/if}
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
