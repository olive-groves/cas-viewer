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

  // TODO: Make into enhanced terradraw componenent
  // Props:
  //  autoEdit
  // Passing modename with 'auto-edit' flag means it will always autoedit
  //    ...or is there a better way to manage these?
  let autoEdit: boolean = $state(false);


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
  const selectFlags = {
    point: defaultSelectFlags,
    linestring: defaultSelectFlags,
    polygon: defaultSelectFlags,
    'linestring-auto-edit': defaultSelectFlags,
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
    new TerraDrawPointMode(),
    new TerraDrawLineStringMode(),
    new TerraDrawPolygonMode(),
    new TerraDrawLineStringMode({
      finishOnNthCoordinate: 2,
      modeName: 'linestring-auto-edit',
    }),
    // new TerraDrawCircleMode(),
    // new TerraDrawRectangleMode(),
  ];
  const modeNames = modes.map((mode) => mode.mode);
  let mode = $state('linestring-auto-edit')
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
      if (context?.action === 'draw' && (draw?.getMode().includes('auto-edit') || autoEdit)) {
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
    <label>
      <input type="checkbox" bind:checked={autoEdit} /> Auto-edit
    </label>
    <button
      onclick={() => {
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
