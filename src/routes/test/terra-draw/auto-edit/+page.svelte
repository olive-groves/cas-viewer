<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre } from 'svelte-maplibre-gl';
  import { TerraDraw as SvelteTerraDraw } from '@svelte-maplibre-gl/terradraw';
  import type { TerraDraw } from 'terra-draw';
  import {
    TerraDrawSelectMode,
    TerraDrawLineStringMode,
  } from 'terra-draw';
    import { untrack } from 'svelte';

  let draw: TerraDraw | undefined = $state.raw();

  type FeatureId = string | number;
  let _lastDrawId: FeatureId | undefined = $state(undefined);
  let _lastDrawMode: string | undefined = $state();

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
    linestring: defaultSelectFlags,
  }
  // Select mode for the last drawn item, which is used to auto-select it, but not allow other selections
  const lastDrawSelectMode = new TerraDrawSelectMode({
    modeName: 'lastDraw',
    allowManualSelection: false,
    flags: selectFlags,
  })
  const modes = [
    new TerraDrawSelectMode({
      flags: selectFlags,
    }),
    new TerraDrawLineStringMode({
      finishOnNthCoordinate: 2,
    }),
  ];
  const modeNames = modes.map((mode) => mode.mode);
  let userMode = $state('linestring');  // Public prop
  let selected: string | number | null = $state(null);
  // KEEP:
  // An error occurs if switching modes when a feature is selected during auto-edit.
  // For now the fix is to explicitly deselect the feature when we change modes.
  // svelte-ignore state_referenced_locally
  let actualMode = $state(userMode);
  $effect(() => {
    const _selected = untrack(() => selected);
    if (_selected) draw?.deselectFeature(_selected);
    actualMode = userMode;
  })

  let autoEdit: boolean = $state(true);

</script>

<div style="display: grid; height: 100%; grid: 1fr / 1fr;">

  <MapLibre
    inlineStyle="height: 100%; width: 100%; grid-area: 1 / 1 / -1 / -1;"
  >
    <SvelteTerraDraw
      mode={actualMode}
      modes={[...modes, lastDrawSelectMode]}
      bind:draw
      onselect={(id: FeatureId) => {
        selected = id;
      }}
      ondeselect={(id: FeatureId) => {
        selected = null;
        // Auto-edit
        if (id === _lastDrawId && _lastDrawMode) {
          _lastDrawId = undefined;
          draw?.setMode(_lastDrawMode);
        }
      }}
      onfinish={(id: FeatureId, context?) => {
        // Auto-edit
        if (
          context?.action === 'draw' && autoEdit
        ) {
          _lastDrawId = id;
          _lastDrawMode = userMode;
          draw?.selectFeature(id, lastDrawSelectMode.mode);
        }
      }}
      onchange={(ids: FeatureId[], type: string, context?) => {
        // TODO: On delete of a selected auto-edit item, return to the lastDrawSelectMode.mode
      }}
    />

    <div class=controls>
      <label>
        <input type="checkbox" bind:checked={autoEdit} /> Auto-edit
      </label>
      <button
        onclick={() => {
          draw?.undo();
        }}
        >Undo</button>
      {#each modeNames as modeName (modeName)}
        <label><input type="radio" bind:group={userMode} value={modeName}/> {modeName}</label>
      {/each}
    </div>
  </MapLibre>
</div>

<style>
    .controls {
      display: flex;
      flex-direction: column;
      position: absolute;
      z-index: 1;
      background-color: black;
    }
</style>
