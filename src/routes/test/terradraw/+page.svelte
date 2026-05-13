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
    TerraDrawSessionUndoRedo,
    TerraDrawModeUndoRedo,
    TerraDrawUndoRedoKeyboardShortcuts,
  } from 'terra-draw';
    import { untrack } from 'svelte';

  // TODO: Make into enhanced, predefaulted terradraw Svelte component
  // Props:
  //  autoEdit
  // Passing modename with 'auto-edit' flag means it will always autoedit
  //    ...or is there a better way to manage these?
  let autoEdit: boolean = $state(false);


  let draw: Draw | undefined = $state.raw();

  type FeatureId = string | number;
  let _lastDrawId: FeatureId | undefined = $state(undefined);
  let _lastDrawMode: string | undefined = $state();

  const undoRedo = {
    modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 100 }),
    sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 100 }),
    keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts(),
  };
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
    'linestring--auto-edit--profile': {
      ...defaultSelectFlags,
      feature: {
        ...defaultSelectFlags.feature,
        coordinates: {
          ...defaultSelectFlags.feature.coordinates,
          midpoints: false,
        }
      }
    },
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
      modeName: 'linestring--auto-edit--profile',
    }),
  ];
  const modeNames = modes.map((mode) => mode.mode);
  let mode = $state('linestring--auto-edit--profile');  // Public prop
  let selected: string | number | null = $state(null);
  // KEEP:
  // An error occurs if switching modes when a feature is selected during auto-edit.
  // For now the fix is to explicitly deselect the feature when we change modes.
  // svelte-ignore state_referenced_locally
  let _mode = $state(mode);
  $effect(() => {
    const _selected = untrack(() => selected);
    if (_selected) draw?.deselectFeature(_selected);
    _mode = mode;
  })
</script>

<MapLibre
  inlineStyle="height: 100%;"
  style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  zoom={2}
  center={{ lng: 60, lat: 20 }}
  renderWorldCopies={false}
  onload={() => {
    // Auto-save
    // const retrievedFeatures = localStorage.getItem('terra-draw-data');
    // if (retrievedFeatures) {
    //   draw?.addFeatures(JSON.parse(retrievedFeatures))
    // }
  }}
>
  <!-- Terra Draw -->
  <TerraDraw
    mode={_mode}
    modes={[...modes, lastDrawSelectMode]}
    {undoRedo}
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
      // Auto-save
      // const features = draw?.getSnapshot()
      // if (features) {
      //   // We don't want any mid points or selection points so we filter them out
      //   const filteredFeatures = features.filter((f) => !f.properties.midPoint && !f.properties.selectionPoint)
      //   // localStorage can only store strings, so we stringify the features first
      //   localStorage.setItem('terra-draw-data', JSON.stringify(filteredFeatures));
      // }
  
      // Auto-edit
      if (
        context?.action === 'draw' &&
        (
          context?.mode.includes('--auto-edit') ||
          autoEdit
        ) 
      ) {
        _lastDrawId = id;
        _lastDrawMode = mode;
        draw?.selectFeature(id, lastDrawSelectMode.mode);
      }
      
      // Profile tool
      // If linestring-auto-edit finishes, register profile and plot?
      // if (context?.action === "draw" && draw?.getSnapshotFeature(id[0]))
      // console.log(context)
    }}
    onchange={(ids: FeatureId[], type: string, context?) => {
      // TODO: On delete of a selected auto-edit item, return to the lastDrawSelectMode.mode
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
