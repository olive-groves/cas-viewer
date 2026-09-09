import { SvelteMap } from 'svelte/reactivity';

import type { MapLibreMap } from 'maplibre-gl';
import type {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
  TerraDrawPointMode,
  TerraDrawPolyLineMode,
  TerraDrawEventListeners,
  GeoJSONStoreFeatures,
} from 'terra-draw';

import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';
import { isGeometryOutOfBounds, terraDrawMaxBounds, wrapGeometryCoordinatesToBounds } from '$lib/v0.8/geojson-utils';

type Mode = TerraDrawSelectMode | TerraDrawPointMode | TerraDrawPolygonMode | TerraDrawPolyLineMode;

type ModeFactory = () => Mode[];

export class SyncedTerraDraw {
  mode = $state('point');
  modeFactory: ModeFactory;
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
    $effect.root(() => {
      this.draw?.setMode(this.mode);
    });
    this.modeFactory = modeFactory;
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
    let instance = new TerraDrawInstance(id, this.modeFactory);
    instance.onreadyListeners.push((...args) => this.synconready(instance.id, args));
    instance.onselectListeners.push((...args) => this.synconselect(instance.id, args));
    instance.ondeselectListeners.push((...args) => this.syncondeselect(instance.id, args));
    instance.onfinishListeners.push((...args) => this.synconfinish(instance.id, args));
    instance.onchangeListeners.push((...args) => this.synconchange(instance.id, args));
    // FIXME: Set timeout, await, or some other trigger for setting snapshot?
    // 'ready' doesn't fire on first component instantiation; only after explicit stop-start (hide-show)
    // instance.onreadyListeners.push(() => instance.draw?.addFeatures(this.draw?.getSnapshot() ?? []));
    setTimeout(() => {
      if (this.draw === undefined)
        console.warn("No synced TerraDraw parent from which to get a snapshot. Perhaps you forgot to instantiate the parent draw and map with <SyncedTerraDrawComponent>?")
      instance.addFeatures(this.draw?.getSnapshot() ?? []);
    }, 200)
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
        _instance.updateFeatureGeometry(featureId, feature.geometry);
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
          // _instance.draw?.addFeatures([feature]);  // If not enabled (hidden), can't add!
          _instance.addFeatures([feature]);
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

export class TerraDrawInstance {
  id: string;
  draw: TerraDraw | undefined = $state.raw();
  modeFactory: ModeFactory;
  private snapshot: ReturnType<TerraDraw["getSnapshot"]> = [];
  private _visible: boolean = $state(true);
  readonly visible = $derived(this._visible);

  onreadyListeners: TerraDrawEventListeners["ready"][] = [];
  onfinishListeners: TerraDrawEventListeners["finish"][] = [];
  onchangeListeners: TerraDrawEventListeners["change"][] = [];
  onselectListeners: TerraDrawEventListeners["select"][] = [];
  ondeselectListeners: TerraDrawEventListeners["deselect"][] = [];
  onhistoryListeners: TerraDrawEventListeners["history"][] = [];

  constructor(id: string, modeFactory: ModeFactory) {
    this.id = id;
    this.modeFactory = modeFactory;
  }

  readonly onready: TerraDrawEventListeners["ready"] = (...args) => this.onreadyListeners.forEach((listener) => listener(...args));
  readonly onfinish: TerraDrawEventListeners["finish"] = (...args) => this.onfinishListeners.forEach((listener) => listener(...args));
  readonly onchange: TerraDrawEventListeners["change"] = (...args) => this.onchangeListeners.forEach((listener) => listener(...args));
  readonly onselect: TerraDrawEventListeners["select"] = (...args) => this.onselectListeners.forEach((listener) => listener(...args));
  readonly ondeselect: TerraDrawEventListeners["deselect"] = (...args) => this.ondeselectListeners.forEach((listener) => listener(...args));
  readonly onhistory: TerraDrawEventListeners["history"] = (...args) => this.onhistoryListeners.forEach((listener) => listener(...args));

  addFeatures(...args: Parameters<TerraDraw["addFeatures"]>): ReturnType<TerraDraw["addFeatures"]> | "not-validated" {
    if (this.draw?.enabled) {
      return this.draw.addFeatures(...args);
    } else {
      // Validation of pushed features occurs when (re)enabled... kinda kicking the can down the road.
      this.snapshot.push(...args[0])
      return "not-validated"
    }
  }

  updateFeatureGeometry(...args: Parameters<TerraDraw["updateFeatureGeometry"]>): ReturnType<TerraDraw["updateFeatureGeometry"]> {
    if (this.draw?.enabled) {
      return this.draw.updateFeatureGeometry(...args);
    } else {
      const featureIndex = this.snapshot.findIndex((feature) => feature.id === args[0]);
      if (featureIndex < 0)
        return;
      this.snapshot[featureIndex] = { ...this.snapshot.at(featureIndex) as GeoJSONStoreFeatures, geometry: args[1] }
      return
    }
  }
}
