<script lang="ts">
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, GlobeControl } from 'svelte-maplibre-gl';
  import { TerraDraw } from '@svelte-maplibre-gl/terradraw';
  import type { TerraDraw as Draw } from 'terra-draw';
  import {
    TerraDrawSelectMode,
    TerraDrawLineStringMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
    // TerraDrawCircleMode,
    // TerraDrawRectangleMode,
    TerraDrawSessionUndoRedo,
    TerraDrawModeUndoRedo,
    TerraDrawUndoRedoKeyboardShortcuts,
  } from 'terra-draw';
    import { untrack } from 'svelte';

  let draw: Draw | undefined = $state.raw();

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
  // Select mode for the last drawn item, which is used to auto-select it, but not allow other selections
  const lastDrawSelectMode = new TerraDrawSelectMode({
    modeName: 'lastDraw',
    allowManualSelection: false,
    flags: {
      point: defaultSelectFlags,
      linestring: defaultSelectFlags,
      polygon: defaultSelectFlags,
      'profile': defaultSelectFlags,
    }
  })
  const modes = [
    new TerraDrawSelectMode({
      flags: {
        point: defaultSelectFlags,
        linestring: defaultSelectFlags,
        polygon: defaultSelectFlags,
        'profile': defaultSelectFlags,
        // circle: defaultSelectFlags,
        // rectangle: defaultSelectFlags,
      }
    }),
    new TerraDrawPointMode(),
    new TerraDrawLineStringMode(),
    new TerraDrawPolygonMode(),
    new TerraDrawLineStringMode({
      finishOnNthCoordinate: 2,
      modeName: 'profile',
    }),
    // new TerraDrawCircleMode(),
    // new TerraDrawRectangleMode(),
  ];
  const modeNames = modes.map((mode) => mode.mode);
  let mode = $state('profile')
  // svelte-ignore state_referenced_locally
  let modeUI = $state(mode);
  $effect(() => {// If modeUI changed, set draw mode only if different.
    if (modeUI != draw?.getMode()) {
      mode = modeUI;
    }
  })
  $effect(() => {  // If mode changes, set modeUI
    if (mode != untrack(() => modeUI)) modeUI = mode;
  })
  const undoRedo = {
    modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 100 }),
    sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 100 }),
    // keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts(),
  };
  let selected: string | number | null = $state(null);
</script>

<MapLibre
  inlineStyle="height: 100%;"
  style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  zoom={2}
  center={{ lng: 60, lat: 20 }}
  renderWorldCopies={false}
>
  <!-- Terra Draw -->
  <TerraDraw
    {mode}
    modes={[...modes, lastDrawSelectMode]}
    {undoRedo}
    bind:draw
    onselect={(id: FeatureId) => {
      selected = id;
    }}
    ondeselect={(id: FeatureId) => {
      selected = null;
      if (id === _lastDrawId && _lastDrawMode) {
        _lastDrawId = undefined;
        draw?.setMode(_lastDrawMode);
      }
    }}
    onfinish={(id: FeatureId, context?) => {
      if (context?.action === 'draw') {
        _lastDrawId = id;
        _lastDrawMode = mode;
        draw?.selectFeature(id, lastDrawSelectMode.mode);
      }
    }}
    onchange={(ids: FeatureId[], type: string, context?) => {
    }}
    onhistory={({cause, stack, undoSize, redoSize}) => {
    }}
  />

  <!-- Draw controls -->
  <div id=controls>
    <button
      onclick={() => {
        draw?.undo();
      }}
      >Undo</button>
    {#each modeNames as modeName (modeName)}
      <label><input type="radio" bind:group={modeUI} value={modeName}/> {modeName}</label>
    {/each}
    {#if selected}
      <button
        onclick={() => {
          if (!selected) return;
          draw?.removeFeatures([selected]);
          draw?.deselectFeature(selected);
        }}>Remove</button
      >
    {/if}
  </div>
  <GlobeControl />
</MapLibre>

<style>
    #controls {
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 1;
        background-color: black;
    }
</style>
