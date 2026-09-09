<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw as TerraDrawSvelte } from '@svelte-maplibre-gl/terradraw';
  import {
    TerraDrawSelectMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
    TerraDrawPolyLineMode,
  } from 'terra-draw';
  import { SyncedTerraDraw } from '$lib/v0.8/synced-terra-draw.svelte';
  import SyncedTerraDrawSetup from '$lib/v0.8/SyncedTerraDrawSetup.svelte';

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
    point: defaultSelectFlags,
    polygon: defaultSelectFlags,
    polyline: defaultSelectFlags,
  }
  const modeFactory = () => {
    {
      return [
        new TerraDrawSelectMode({
          flags: selectFlags,
        }),
        new TerraDrawPointMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
        new TerraDrawPolygonMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
        new TerraDrawPolyLineMode({
          validation: SyncedTerraDraw.outOfBoundsValidator,
        }),
      ];
    }
  }
  let syncedTerraDraw = new SyncedTerraDraw(modeFactory);
  const modeNames = syncedTerraDraw.modeFactory().map((mode) => mode.mode);
  let zoom = $state(0)
  let center = $state([0, 0])
  let pitch = $state(0)
  let bearing = $state(0)
  let roll = $state(0)

  syncedTerraDraw.addInstance("0");

  let render = $state(true);

</script>

<SyncedTerraDrawSetup
  id={syncedTerraDraw.id}
  bind:map={syncedTerraDraw.map}
  bind:draw={syncedTerraDraw.draw}
  modeFactory={syncedTerraDraw.modeFactory}
/>

<div class=stack style="height: 100%; width: 100%;">
  <div style="display: flex; height: 100%; width: 100%;">
    <!-- WARNING: DO NOT USE entries(); CLEARS TERRADRAW LAYERS {#each syncedTerraDraw.instances.entries() as instance (instance.id)} -->
    {#each syncedTerraDraw.instances.values() as instance (instance.id)}
    {#if render}
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
        paint={{"background-color": `rgb(${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)}, ${(Math.random()*255).toFixed(0)})`}}
      />
      <TerraDrawSvelte
        mode={syncedTerraDraw.mode}
        {...instance}
        bind:draw={instance.draw}
        modes={instance.modeFactory()}
      />
    </MapLibre>
    {/if}
    {/each}
  </div>

  <div class=controls style:align-self=start>
    <button
      onclick={() => {
        syncedTerraDraw.addInstance();
      }}>+ Viewer
    </button>
    <!-- <button
      onclick={() => {
        const instance = syncedTerraDraw.instances.get("0");
        if (instance?.visible) {
          instance.hide();
        } else {
          instance?.show();
        }
      }}>{syncedTerraDraw.instances.get("0")?.visible ? "Hide" : "Show"}
    </button> -->
    <button
      onclick={() => {render = !render}}>{render ? "Unrender" : "Render"}
    </button>
    <button
      onclick={() => {
        console.log(syncedTerraDraw.instances.get("0")?.draw);
      }}>log draw 0
    </button>
    {#each modeNames as modeName (modeName)}
      <label class=unselectable>
        <input type="radio" bind:group={syncedTerraDraw.mode} value={modeName}/>
        {modeName}
      </label>
    {/each}
    <!-- {#if syncedTerraDraw.selected}
      <button
        onclick={() => {
          if (!syncedTerraDraw.selected) return;
          const _selected = syncedTerraDraw.selected;
          drawA?.removeFeatures([_selected]);
          drawB?.removeFeatures([_selected]);
          drawA?.deselectFeature(_selected);
          drawB?.deselectFeature(_selected);
        }}>Remove</button
      >
    {/if} -->
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
