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
  const modes = [
    new TerraDrawSelectMode({
      flags: {
        point: defaultSelectFlags,
        linestring: defaultSelectFlags,
        polygon: defaultSelectFlags,
        // circle: defaultSelectFlags,
        // rectangle: defaultSelectFlags,
      }
    }),
    new TerraDrawPointMode(),
    new TerraDrawLineStringMode(),
    new TerraDrawPolygonMode(),
    // new TerraDrawCircleMode(),
    // new TerraDrawRectangleMode(),
  ];
  const modeNames = modes.map((mode) => mode.mode);
  let mode = $state('select');
  const undoRedo = {
    modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 100 }),
    sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 100 }),
    keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts(),
  };
  let selected: string | number | null = $state(null);
  let draw: Draw | undefined = $state.raw();
</script>

<MapLibre
  inlineStyle="height: 100%;"
  style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  zoom={2}
  center={{ lng: 60, lat: 20 }}
>
  <!-- Terra Draw -->
  <TerraDraw
    {mode}
    {modes}
    {undoRedo}
    bind:draw
    onselect={(featureId) => (selected = featureId)}
    ondeselect={() => (selected = null)}
    // onfinish={() => (mode = 'select')}
    onhistory={({cause, stack, undoSize, redoSize}) => {
      console.log(cause);
      console.log(stack);
    }}
  />

  <!-- Draw controls -->
  <div id=controls>
    <button
      onclick={() => {
        console.log(draw?.canUndo());
        draw?.undo();
      }}
      >Undo</button>
    {#each modeNames as modeName (modeName)}
      <label><input type="radio" bind:group={mode} value={modeName}/> {modeName}</label>
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
