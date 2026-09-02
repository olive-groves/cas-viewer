<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw } from '@svelte-maplibre-gl/terradraw';
  import type { TerraDraw as Draw } from 'terra-draw';
  import type { Point, Polygon, LineString, Position } from "geojson";
  import {
    TerraDrawSelectMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
  } from 'terra-draw';
  import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';

  type FeatureId = string | number;
  type Feature = Point | Polygon | LineString;
  const bounds = {
    min: {
      lng: -180,
      lat: -85.049,
      // lat: -85.051129,  // TODO: Report bug that can be dragged below this lat?
    },
    max: {
      lng: 180,
      lat: 85.051129,
    }
  };
  function isFeatureOutOfBounds(feature: Feature): boolean {
    let coordinates: Position[];
    if (feature.type === "Point") {
      coordinates = [feature.coordinates];
    } else if (feature.type === "Polygon") {
      coordinates = feature.coordinates[0];
    } else if (feature.type === "LineString") {
      coordinates = feature.coordinates;
    } else {
      throw new Error(`Feature type "${feature?.['type']}" not supported.`)
    }
    for (const coordinate of coordinates) {
      if (isPositionOutOfBounds(coordinate)) {
        return true
      }
    }
    return false

    function isPositionOutOfBounds(position: Position): boolean {
      const lng = position[0];
      const lat = position[1];
      return (
        lng <= bounds.min.lng
        || lng > bounds.max.lng
        || lat < bounds.min.lat
        || lat > bounds.max.lat
      );
    }
  }
  function wrapFeatureCoordinatesToBounds(feature: Feature): Position | Position[] | Position[][] {
    let coordinates: Position[];
    if (feature.type === "Point") {
      coordinates = [feature.coordinates];
    } else if (feature.type === "Polygon") {
      coordinates = feature.coordinates[0];
    } else if (feature.type === "LineString") {
      coordinates = feature.coordinates;
    } else {
      throw new Error(`Feature type "${feature?.['type']}" not supported.`)
    }
    coordinates.forEach((coordinate, i) => {
      coordinates[i][0] = wrap(coordinate[0], bounds.min.lng, bounds.max.lng);
      coordinates[i][1] = Math.max(bounds.min.lat, Math.min(coordinate[1], bounds.max.lat));
    });
    if (feature.type === "Point") {
      return coordinates[0];
    } else if (feature.type === "Polygon") {
      return [coordinates];
    }
    return coordinates;
    function wrap(n: number, min: number, max: number): number {
      const d = max - min;
      const w = ((n - min) % d + d) % d + min;
      return (w === min) ? max : w;
    }
  }

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
          if (isFeatureOutOfBounds(feature.geometry)) {
            return { valid: false };
          }
        }
        return { valid: true }
      }
    }),
    new TerraDrawPolygonMode({
      validation: (feature, { updateType }) => {
        if (updateType === "finish" || updateType === "commit" || updateType === "provisional") {
          if (isFeatureOutOfBounds(feature.geometry)) {
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
              featureA.geometry.coordinates = wrapFeatureCoordinatesToBounds(featureA.geometry);
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
