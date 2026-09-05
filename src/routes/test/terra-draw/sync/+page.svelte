<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  // Adapted from https://svelte-maplibre-gl.mierune.dev/examples/terradraw
  import { MapLibre, BackgroundLayer } from 'svelte-maplibre-gl';
  import { TerraDraw as TerraDrawSvelte } from '@svelte-maplibre-gl/terradraw';
  import {
    TerraDraw,
    TerraDrawSelectMode,
    TerraDrawPolygonMode,
    TerraDrawPointMode,
    type TerraDrawEventListeners,
  } from 'terra-draw';
  import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
  import { Map as MapLibreMap } from 'maplibre-gl';
  import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';
  import { isGeometryOutOfBounds, terraDrawMaxBounds, wrapGeometryCoordinatesToBounds } from '$lib/v0.8/geojson-utils';
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';

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

  class SyncedTerraDraw {
    mode = $state('point');
    modes: (TerraDrawSelectMode | TerraDrawPointMode | TerraDrawPolygonMode)[];
    selected: string | number | null = $state(null);

    // For retaining a DOM element
    // TODO: Make private?
    readonly id: string = "terra-draw-synced-parent-map";
    map: MapLibreMap | undefined = $state.raw();
    draw: TerraDraw | undefined = $state.raw();

    instances = new SvelteMap<string, TerraDrawInstance>();

    constructor() {
      $effect(() => {
        this.draw?.setMode(syncedTerraDraw.mode);
      });
      this.modes = SyncedTerraDraw.modesFactory();
    }

    static outOfBoundsValidator = (feature, { updateType }) => {
      if (updateType === "finish" || updateType === "commit" || updateType === "provisional") {
        if (isGeometryOutOfBounds(feature.geometry, terraDrawMaxBounds)) {
          return { valid: false };
        }
      }
      return { valid: true }
    }

    static modesFactory() {
      return [
        new TerraDrawSelectMode({
          flags: selectFlags,
        }),
        new TerraDrawPointMode({
          validation: this.outOfBoundsValidator,
        }),
        new TerraDrawPolygonMode({
          validation: this.outOfBoundsValidator,
        }),
      ];
    }

    addInstance(givenId?: string): TerraDrawInstance {
      const id = givenId ?? crypto.randomUUID();
      let instance = new TerraDrawInstance(id);
      this.instances.set(id, instance);
      instance.onselect = (featureId) => this.propagateonselect([featureId], instance.id);
      instance.ondeselect = (featureId) => this.propagateondeselect([featureId], instance.id);
      instance.onfinish = (featureId, context) => this.propagateonfinish([featureId, context], instance.id);
      instance.onchange = (ids: FeatureId[], type: string, context?) => {console.log("onchange", ids, type, context)}
      // Set timeout, await, or some other trigger for setting snapshot?
      const snapshot = this.draw?.getSnapshot();
      if (snapshot) {
        // Await on draw instanced?
        setTimeout(() => {
          instance.draw?.addFeatures(snapshot);
        }, 500)
      }
      return instance
    }

    propagateonselect = (args: Parameters<TerraDrawEventListeners["select"]>, instanceId: string) => {
      console.log("onselect", ...args);
      this.onselect(...args);
      // this.instances.forEach((instance, id) => {})
    }
    propagateondeselect = (args: Parameters<TerraDrawEventListeners["deselect"]>, instanceId: string) => {
      console.log("ondeselect", ...args);
      this.ondeselect(...args);
      // Bug: Press Escape when dragging a selected feature; onfinish returns undefined id; catch on deselect
      const instance = this.instances.get(instanceId);
      const featureId = args[0];
      let feature = instance?.draw?.getSnapshotFeature(featureId);
      if (feature) {
        this.draw?.updateFeatureGeometry(featureId, feature.geometry);
        this.instances.forEach((_instance, _id) => {
          if (_id === instanceId)
            return;
          _instance.draw?.updateFeatureGeometry(featureId, feature.geometry);
        })
      }
    }
    propagateonfinish = (args: Parameters<TerraDrawEventListeners["finish"]>, instanceId: string) => {
      console.log("onfinish", ...args);
      this.onfinish(...args);
      const instance = this.instances.get(instanceId);
      const featureId = args[0];
      const context = args[1];
      if (!instance || typeof featureId === "undefined")
        return;
      if (context?.action === "draw") {
        const feature = instance.draw?.getSnapshotFeature(featureId);
        if (feature) {
          this.draw?.addFeatures([feature]);
          this.instances.forEach((_instance, _id) => {
            if (_id === instanceId)
              return;
            _instance.draw?.addFeatures([feature]);
          })
        }
      // } else if (context && ["dragCoordinate", "dragFeature", "dragCoordinateResize",].includes(context?.action)) {
      } else {
        const feature = instance.draw?.getSnapshotFeature(featureId);
        if (feature) {
          feature.geometry.coordinates = wrapGeometryCoordinatesToBounds(feature.geometry, terraDrawMaxBounds);
          feature.geometry = roundGeometryCoordinates(feature.geometry);
          instance.draw?.updateFeatureGeometry(featureId, feature.geometry);  // Ensure drawn is wrapped
          this.draw?.updateFeatureGeometry(featureId, feature.geometry);  // Then propogate
          this.instances.forEach((_instance, _id) => {
            if (_id === instanceId)
              return;
            _instance.draw?.updateFeatureGeometry(featureId, feature.geometry);
          })
        }
      }
    }

    onselect: TerraDrawEventListeners["select"] = (id: FeatureId) => {
      this.selected = id;
    };
    ondeselect: TerraDrawEventListeners["deselect"] = (id: FeatureId) => {
      this.selected = null;
    };
    onfinish: TerraDrawEventListeners["finish"] = () => {};
    // onchange: TerraDrawEventListeners["change"] = () => {};
    // onhistory: TerraDrawEventListeners["history"] = () => {};

  }

  let syncedTerraDraw = new SyncedTerraDraw();

  onMount(() => {
    if (document.getElementById(syncedTerraDraw.id) === null) {
      const container = document.createElement("div");
      container.id = syncedTerraDraw.id;
      document.body.appendChild(container);
      syncedTerraDraw.map = new MapLibreMap({
        container: container,
      });
      syncedTerraDraw.draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({map: syncedTerraDraw.map}),
        modes: syncedTerraDraw.modes,
      });
      syncedTerraDraw.draw.start();
    }
  })

  class TerraDrawInstance {
    id: string;
    draw: TerraDraw | undefined = $state.raw();
    modes: (TerraDrawSelectMode | TerraDrawPointMode | TerraDrawPolygonMode)[];
    private snapshot: ReturnType<TerraDraw["getSnapshot"]> = [];
    private _visible: boolean = $state(true);
    readonly visible = $derived(this._visible);

    constructor(id: string) {
      this.id = id;
      this.modes = SyncedTerraDraw.modesFactory();
    }

    onselect: TerraDrawEventListeners["select"] = () => {};
    ondeselect: TerraDrawEventListeners["deselect"] = () => {};
    onfinish: TerraDrawEventListeners["finish"] = () => {};
    onchange: TerraDrawEventListeners["change"] = () => {};
    onhistory: TerraDrawEventListeners["history"] = () => {};

    hide() {
      if (!this.draw) {
        this._visible = false;
        return;
      }
      this.snapshot = this.draw.getSnapshot() ?? [];
      this.draw.stop();
      this._visible = false;
    }

    show() {
      if (!this.draw) {
        this._visible = true;
        return;
      }
      this.draw.start();
      this.draw.addFeatures(this.snapshot);
      this._visible = true;
    }
  }

  // Proof
  const modeNames = syncedTerraDraw.modes.map((mode) => mode.mode);
  let zoom = $state(0)
  let center = $state([0, 0])
  let pitch = $state(0)
  let bearing = $state(0)
  let roll = $state(0)

  syncedTerraDraw.addInstance("0");

</script>

<div class=stack style="height: 100%; width: 100%;">
  <div style="display: flex; height: 100%; width: 100%;">
    <!-- WARNING: DO NOT USE entries(); CLEARS TERRADRAW LAYERS {#each syncedTerraDraw.instances.entries() as instance (instance.id)} -->
    {#each syncedTerraDraw.instances.values() as instance (instance.id)}
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
      {#if instance.visible}
        <TerraDrawSvelte
          // FIXME: hide/show throws error with already registered
          mode={syncedTerraDraw.mode}
          modes={instance.modes}
          bind:draw={instance.draw}
          onselect={instance.onselect}
          ondeselect={instance.ondeselect}
          onfinish={instance.onfinish}
        />
      {/if}
    </MapLibre>
    {/each}
  </div>

  <div class=controls style:align-self=start>
    <button
      onclick={() => {
        syncedTerraDraw.addInstance();
      }}>+ Viewer
    </button>
    <button
      onclick={() => {
        const instance = syncedTerraDraw.instances.get("0");
        if (instance?.visible) {
          instance.hide();
        } else {
          instance?.show();
        }
      }}>{syncedTerraDraw.instances.get("0")?.visible ? "Hide" : "Show"}
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
