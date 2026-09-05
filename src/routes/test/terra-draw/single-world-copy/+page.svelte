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
  import { isGeometryOutOfBounds, wrapGeometryCoordinatesToBounds, terraDrawMaxBounds } from '$lib/v0.8/geojson-utils';

  type FeatureId = string | number;

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
  let draw: Draw | undefined = $state.raw();
  const modes = [
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
  const modeNames = modes.map((mode) => mode.mode);

</script>

<div class=stack style="height: 100%; width: 100%;">
  <MapLibre
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    attributionControl={false}
    transformConstrain={(lngLat, zoom) => ({center: lngLat, zoom: zoom ?? 0})}
  >
    <BackgroundLayer
      layout={{visibility: "visible"}}
      paint={{"background-color": "blue"}}
    />
    <TerraDraw
      mode={mode}
      modes={modes}
      bind:draw={draw}
      onselect={(id: FeatureId) => {
        selected = id;
      }}
      ondeselect={(id: FeatureId) => {
        // TODO: Report
        // Bug: Press Escape when dragging a selected feature; onfinish returns undefined id; position A not progogated to B
        selected = null;
      }}
      onfinish={(id: FeatureId, context?) => {
        console.log("onfinish", id, context);
        if (typeof id === "undefined") return;
        // TODO: Report
        // Bug?: Dragging features on single-world maps
        // 1) Drag across antimeridian visibly wraps to other side, rather than keep on side
        // 2) Drag above max latitude (+85) becomes stuck on top bound and unselectable
        // 3) Drag below min latitude (-85) goes off-map, in the "shadow" outside the world bounds
        // TODO: Feature: Resect maxBounds, renderWorldCopies
        if (context && ["dragCoordinate", "dragFeature", "dragCoordinateResize",].includes(context?.action)) {
          let feature = draw?.getSnapshotFeature(id);
          if (feature) {
            feature.geometry.coordinates = wrapGeometryCoordinatesToBounds(feature.geometry, terraDrawMaxBounds);
            feature.geometry = roundGeometryCoordinates(feature.geometry);
            draw?.updateFeatureGeometry(id, feature.geometry);  // Ensure drawn is wrapped
          }
        }
      }}
    />
  </MapLibre>

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
          draw?.removeFeatures([_selected]);
          draw?.deselectFeature(_selected);
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
