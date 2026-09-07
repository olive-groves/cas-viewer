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
    TerraDrawPolyLineMode,
    type TerraDrawEventListeners,
  } from 'terra-draw';
  import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
  import { Map as MapLibreMap } from 'maplibre-gl';
  import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';
  import { isGeometryOutOfBounds, terraDrawMaxBounds, wrapGeometryCoordinatesToBounds } from '$lib/v0.8/geojson-utils';
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';

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

  type Mode = TerraDrawSelectMode | TerraDrawPointMode | TerraDrawPolygonMode | TerraDrawPolyLineMode;

  type ModeFactory = () => Mode[];

  class SyncedTerraDraw {
    mode = $state('point');
    modes: Mode[];
    private modeFactory: ModeFactory;
    selected: string | number | null = $state(null);

    onreadyListeners: TerraDrawEventListeners["ready"][] = [];
    onfinishListeners: TerraDrawEventListeners["finish"][] = [];
    onchangeListeners: TerraDrawEventListeners["change"][] = [];
    onselectListeners: TerraDrawEventListeners["select"][] = [];
    ondeselectListeners: TerraDrawEventListeners["deselect"][] = [];
    onhistoryListeners: TerraDrawEventListeners["history"][] = [];

    // For retaining a DOM element
    // TODO: Make private?
    readonly id: string = "terra-draw-synced-parent-map";
    map: MapLibreMap | undefined = $state.raw();
    draw: TerraDraw | undefined = $state.raw();

    instances = new SvelteMap<string, TerraDrawInstance>();

    constructor(modeFactory: ModeFactory) {
      $effect(() => {
        this.draw?.setMode(this.mode);
      });
      this.modeFactory = modeFactory;
      this.modes = modeFactory();
    }

    static outOfBoundsValidator = (feature, { updateType }) => {
      if (updateType === "finish" || updateType === "commit" || updateType === "provisional") {
        if (isGeometryOutOfBounds(feature.geometry, terraDrawMaxBounds)) {
          return { valid: false };
        }
      }
      return { valid: true }
    }

    addInstance(customId?: string): TerraDrawInstance {
      const id = customId ?? crypto.randomUUID();
      let instance = new TerraDrawInstance(id, this.modeFactory());
      instance.onreadyListeners.push((...args) => this.synconready(instance.id, args));
      instance.onselectListeners.push((...args) => this.synconselect(instance.id, args));
      instance.ondeselectListeners.push((...args) => this.syncondeselect(instance.id, args));
      instance.onfinishListeners.push((...args) => this.synconfinish(instance.id, args));
      instance.onchangeListeners.push((...args) => this.synconchange(instance.id, args));
      // FIXME: Set timeout, await, or some other trigger for setting snapshot?
      // 'ready' doesn't fire on first component instantiation; only after explicit stop-start (hide-show)
      // instance.onreadyListeners.push(() => instance.draw?.addFeatures(this.draw?.getSnapshot() ?? []));
      setTimeout(() => {
        instance.draw?.addFeatures(this.draw?.getSnapshot() ?? []);
      }, 500)
      this.instances.set(id, instance);
      return instance
    }

    synconready = (id: string, args: Parameters<TerraDrawEventListeners["ready"]>) => {
      console.log("synconready", ...args);
    }

    synconselect = (id: string, args: Parameters<TerraDrawEventListeners["select"]>) => {
      console.log("synconselect", ...args);
      this.selected = id;
    }
    syncondeselect = (id: string, args: Parameters<TerraDrawEventListeners["deselect"]>) => {
      console.log("syncondeselect", ...args);
      this.selected = null;
      // This fixes a bug when pressing Escape (cancelling) when dragging a selected feature; onfinish returns undefined id; catch on deselect
      const instance = this.instances.get(id);
      const featureId = args[0];
      let feature = instance?.draw?.getSnapshotFeature(featureId);
      if (feature) {
        this.draw?.updateFeatureGeometry(featureId, feature.geometry);
        this.instances.forEach((_instance, _id) => {
          if (_id === id)
            return;
          _instance.draw?.updateFeatureGeometry(featureId, feature.geometry);
        })
      }
    }
    synconfinish = (id: string, args: Parameters<TerraDrawEventListeners["finish"]>) => {
      console.log("synconfinish", ...args);
      const instance = this.instances.get(id);
      const featureId = args[0];
      const context = args[1];
      if (!instance || typeof featureId === "undefined")
        return;
      if (context?.action === "draw") {
        const feature = instance.draw?.getSnapshotFeature(featureId);
        if (feature) {
          this.draw?.addFeatures([feature]);
          this.instances.forEach((_instance, _id) => {
            if (_id === id)
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
            if (_id === id)
              return;
            _instance.draw?.updateFeatureGeometry(featureId, feature.geometry);
          })
        }
      }
    }
    synconchange = (id: string, args: Parameters<TerraDrawEventListeners["change"]>) => {
      console.log("synconchange", ...args);
    }

    readonly onready: TerraDrawEventListeners["ready"] = (...args) => this.onreadyListeners.forEach((listener) => listener(...args));
    readonly onfinish: TerraDrawEventListeners["finish"] = (...args) => this.onfinishListeners.forEach((listener) => listener(...args));
    readonly onchange: TerraDrawEventListeners["change"] = (...args) => this.onchangeListeners.forEach((listener) => listener(...args));
    readonly onselect: TerraDrawEventListeners["select"] = (...args) => this.onselectListeners.forEach((listener) => listener(...args));
    readonly ondeselect: TerraDrawEventListeners["deselect"] = (...args) => this.ondeselectListeners.forEach((listener) => listener(...args));
    readonly onhistory: TerraDrawEventListeners["history"] = (...args) => this.onhistoryListeners.forEach((listener) => listener(...args));
  }

  class TerraDrawInstance {
    id: string;
    draw: TerraDraw | undefined = $state.raw();
    modes: Mode[];
    private snapshot: ReturnType<TerraDraw["getSnapshot"]> = [];
    private _visible: boolean = $state(true);
    readonly visible = $derived(this._visible);

    onreadyListeners: TerraDrawEventListeners["ready"][] = [];
    onfinishListeners: TerraDrawEventListeners["finish"][] = [];
    onchangeListeners: TerraDrawEventListeners["change"][] = [];
    onselectListeners: TerraDrawEventListeners["select"][] = [];
    ondeselectListeners: TerraDrawEventListeners["deselect"][] = [];
    onhistoryListeners: TerraDrawEventListeners["history"][] = [];

    constructor(id: string, modes: Mode[]) {
      this.id = id;
      this.modes = modes;
    }

    readonly onready: TerraDrawEventListeners["ready"] = (...args) => this.onreadyListeners.forEach((listener) => listener(...args));
    readonly onfinish: TerraDrawEventListeners["finish"] = (...args) => this.onfinishListeners.forEach((listener) => listener(...args));
    readonly onchange: TerraDrawEventListeners["change"] = (...args) => this.onchangeListeners.forEach((listener) => listener(...args));
    readonly onselect: TerraDrawEventListeners["select"] = (...args) => this.onselectListeners.forEach((listener) => listener(...args));
    readonly ondeselect: TerraDrawEventListeners["deselect"] = (...args) => this.ondeselectListeners.forEach((listener) => listener(...args));
    readonly onhistory: TerraDrawEventListeners["history"] = (...args) => this.onhistoryListeners.forEach((listener) => listener(...args));

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

  // TODO: Svelte component on the SingleViewer side? Or MultiViewer side?
  // We just need a place to call this onMount. So if we pack it in a MultiViewer...?
  // ONE syncedTerraDraw instance could be spread across nested multi-viewers. We
  // don't necessarily want to spam that component. What if we made it a shared instance?
  // Then, whenever we use the shared instance (at the root level), we have to declare
  // that component:
  //   <SyncedTerraDraw {...syncedTerraDraw} />
  // If there are MULTIPLE synced draws?
  //  #each syncedTerraDraws (SvelteMap?)
  //    <SyncedTerraDraw {...draw} /> (we just need onMount to be called for each)
  // For now just one :|
  onMount(() => {
    if (document.getElementById(syncedTerraDraw.id) === null) {
      const container = document.createElement("div");
      container.id = syncedTerraDraw.id;
      document.body.appendChild(container);
      syncedTerraDraw.map = new MapLibreMap({  // bind:map={syncedDraw.map}
        container: container,
      });
      syncedTerraDraw.draw = new TerraDraw({  // bind:draw={syncedDraw.draw}
        adapter: new TerraDrawMapLibreGLAdapter({map: syncedTerraDraw.map}),
        modes: syncedTerraDraw.modes,
      });
      syncedTerraDraw.draw.start();
    }
  })

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
      <!-- FIXME: show, hide, show throws error with already registered -->
      <TerraDrawSvelte
        mode={syncedTerraDraw.mode}
        modes={instance.modes}
        bind:draw={instance.draw}
        onready={(instance.onready)}
        onfinish={instance.onfinish}
        onselect={instance.onselect}
        ondeselect={instance.ondeselect}
        onchange={instance.onchange}
      />
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
