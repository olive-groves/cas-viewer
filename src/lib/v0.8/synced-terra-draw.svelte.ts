import { SvelteMap } from 'svelte/reactivity';

import type { MapLibreMap } from 'maplibre-gl';
import {
  type TerraDraw,
  TerraDrawSelectMode,
  type TerraDrawPolygonMode,
  type TerraDrawPointMode,
  type TerraDrawPolyLineMode,
  type TerraDrawEventListeners,
  type GeoJSONStoreFeatures,
  type TerraDrawMarkerMode,
  type TerraDrawRenderMode,
} from 'terra-draw';

import { roundGeometryCoordinates } from '$lib/v0.8/maplibre-gl-terradraw/lib/helpers/roundFeatureCoordinates';
import { isGeometryOutOfBounds, terraDrawMaxBounds, wrapGeometryCoordinatesToBounds } from '$lib/v0.8/geojson-utils';
import { untrack } from 'svelte';

type Mode = TerraDrawSelectMode | TerraDrawPointMode | TerraDrawPolygonMode | TerraDrawPolyLineMode | TerraDrawMarkerMode | TerraDrawRenderMode;

type ModeFactory = () => Mode[];
type LastDrawSelectModeFactory = () => TerraDrawSelectMode;

type FeatureId = string | number;

export type Validator = (feature: GeoJSONStoreFeatures, { updateType }: { updateType: "finish" | "commit" | "provisional" }) => { valid: boolean }

export class SyncedTerraDraw {
  userMode: string = $state("");
  actualMode: string = $state("");
  modeFactory: ModeFactory;
  readonly modeNames: Mode["mode"][];
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

  // Automatically select on draw finish
  private autoSelectOnFinish = true;
  private lastDrawId: FeatureId | null = $state(null);
  private lastDrawMode: string | null = $state(null);
  readonly lastDrawSelectModeFactory: LastDrawSelectModeFactory;
  readonly lastDrawSelectModeName: string = '_select-last-draw';

  constructor(modeFactory: ModeFactory, userMode?: string) {
    // If userMode is set, set the actualMode
    $effect(() => {
      const _selected = untrack(() => this.selected);
      if (_selected) {
        this.draw?.deselectFeature(_selected);
        this.instances.forEach((_instance, _instanceId) => {
          _instance.deselectFeature(_selected);
        })
      }
      this.actualMode = this.userMode;
    });
    $effect.root(() => {
      this.draw?.setMode(this.actualMode);
    });
    this.userMode = userMode ?? modeFactory().find((mode) => mode.type === "drawing")?.mode ?? ""
    this.modeFactory = modeFactory;
    this.modeNames = modeFactory().map((mode) => mode.mode);

    // Auto-select
    const selectMode = (modeFactory().find((mode) => mode.type === "select") as TerraDrawSelectMode);
    // @ts-ignore
    const selectFlags = selectMode?.flags ?? {};
    const selectStyles = selectMode?.styles ?? {};
    if (selectFlags === undefined) {
      console.warn("Auto-select mode flags are set empty because no select flags could be parsed from modeFactory.")
    }
    this.lastDrawSelectModeFactory = () => new TerraDrawSelectMode({
      modeName: this.lastDrawSelectModeName,
      allowManualSelection: false,
      flags: selectFlags,
      styles: selectStyles,
    });
  }

  static outOfBoundsValidator: Validator = (feature, { updateType }) => {
    return { valid: !isGeometryOutOfBounds(feature.geometry, terraDrawMaxBounds) }
  }

  addInstance(customId?: string): TerraDrawInstance {
    const id = customId ?? crypto.randomUUID();
    let instance = new TerraDrawInstance(id, this.modeFactory, this.lastDrawSelectModeFactory);
    instance.onreadyListeners.push((...args) => this.synconready(instance.id, args));
    instance.onselectListeners.push((...args) => this.synconselect(instance.id, args));
    instance.ondeselectListeners.push((...args) => this.syncondeselect(instance.id, args));
    instance.onfinishListeners.push((...args) => this.synconfinish(instance.id, args));
    instance.onchangeListeners.push((...args) => this.synconchange(instance.id, args));
    // FIXME: Set timeout, await, or some other trigger for setting snapshot?
    // 'ready' doesn't fire on first component instantiation; only after explicit stop-start (hide-show)
    // instance.onreadyListeners.push(() => instance.draw?.addFeatures(this.draw?.getSnapshot() ?? []));
    // setTimeout(() => {
    //   if (this.draw === undefined)
    //     console.warn("No synced TerraDraw parent from which to get a snapshot. Perhaps you forgot to instantiate the parent draw and map with <SyncedTerraDrawComponent>?");
    //   instance.addFeatures(this.draw?.getSnapshot() ?? []);
    // }, 200)
    if (this.draw === undefined) {
      console.warn("No synced TerraDraw parent from which to get a snapshot. Perhaps you forgot to instantiate the parent draw and map with <SyncedTerraDrawComponent>?")
    } else {
      instance.addFeatures(this.draw?.getSnapshot().filter((f) => !f.properties.midPoint && !f.properties.selectionPoint) ?? []);
    };
    this.instances.set(id, instance);
    const selected = this.selected;
    if (selected) {
      // FIXME: Await draw instantiation rather than timeout?
      setTimeout(() => {
        instance.selectFeature(selected);
      }, 200)
    }
    return instance
  }

  synconready = (instanceId: string, args: Parameters<TerraDrawEventListeners["ready"]>) => {
    // console.log("synconready", ...args);
  }

  synconselect = (instanceId: string, args: Parameters<TerraDrawEventListeners["select"]>) => {
    // console.log("synconselect", ...args);
    this.selected = args[0] ?? null;
    this.draw?.selectFeature(...args);
    this.instances.forEach((_instance, _instanceId) => {
      if (_instanceId === instanceId)
        return;
      _instance.selectFeature(...args);
    })
  }
  syncondeselect = (instanceId: string, args: Parameters<TerraDrawEventListeners["deselect"]>) => {
    // console.log("syncondeselect", ...args);

    this.selected = null;
    const featureId = args[0];

    // Sync
    if (featureId) {
      this.draw?.deselectFeature(...args);
      this.instances.forEach((_instance, _instanceId) => {
        if (_instanceId === instanceId)
          return;
        _instance.deselectFeature(...args);
      })
    }

    // Auto-edit
    if (featureId === this.lastDrawId && this.lastDrawMode) {
      this.lastDrawId = null;
      this.actualMode = this.lastDrawMode;
    }

    // This fixes a bug when pressing Escape (cancelling) when dragging a selected feature; onfinish returns undefined id; catch on deselect
    const instance = this.instances.get(instanceId);
    let feature = instance?.draw?.getSnapshotFeature(featureId);
    if (feature) {
      this.draw?.updateFeatureGeometry(featureId, feature.geometry);
      this.instances.forEach((_instance, _id) => {
        if (_id === instanceId)
          return;
        _instance.updateFeatureGeometry(featureId, feature.geometry);
      })
    }
  }
  synconfinish = (instanceId: string, args: Parameters<TerraDrawEventListeners["finish"]>) => {
    // console.log("synconfinish", ...args);
    const instance = this.instances.get(instanceId);
    const featureId = args[0];
    const context = args[1];
    if (!instance || typeof featureId === "undefined")
      return;
    if (context?.action === "draw") {
      const feature = instance.getSnapshotFeature(featureId);
      if (feature) {
        this.draw?.addFeatures([feature]);
        this.instances.forEach((_instance, _instanceId) => {
          if (_instanceId === instanceId)
            return;
          _instance.addFeatures([feature]);
        })
      }
    // } else if (context && ["dragCoordinate", "dragFeature", "dragCoordinateResize",].includes(context?.action)) {
    } else {
      const feature = instance.getSnapshotFeature(featureId);
      if (feature) {
        feature.geometry.coordinates = wrapGeometryCoordinatesToBounds(feature.geometry, terraDrawMaxBounds);
        feature.geometry = roundGeometryCoordinates(feature.geometry);
        instance.updateFeatureGeometry(featureId, feature.geometry);  // Ensure drawn is wrapped
        this.draw?.updateFeatureGeometry(featureId, feature.geometry);  // Then propogate
        this.instances.forEach((_instance, _instanceId) => {
          if (_instanceId === instanceId)
            return;
          _instance.updateFeatureGeometry(featureId, feature.geometry);
        })
      }
    }

    // Auto-select
    if (context?.action === 'draw' && this.autoSelectOnFinish) {
      this.lastDrawId = featureId;
      this.lastDrawMode = this.userMode;
      this.actualMode = this.lastDrawSelectModeName;
      // FIXME: Avoid race condition a better way? Or a don't-propagate-select mode?
      this.draw?.selectFeature(featureId, this.lastDrawSelectModeName);
      setTimeout(() => {
        this.instances.forEach((_instance) => {
          _instance.selectFeature(featureId, this.lastDrawSelectModeName);
        })
      })
    }
  }
  synconchange = (instanceId: string, args: Parameters<TerraDrawEventListeners["change"]>) => {
    // console.log("synconchange", ...args);
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
  lastDrawSelectModeFactory: LastDrawSelectModeFactory;
  private snapshot: ReturnType<TerraDraw["getSnapshot"]> = [];
  private _visible: boolean = $state(true);
  readonly visible = $derived(this._visible);
  private selected: FeatureId | null = null;

  onreadyListeners: TerraDrawEventListeners["ready"][] = [];
  onfinishListeners: TerraDrawEventListeners["finish"][] = [];
  onchangeListeners: TerraDrawEventListeners["change"][] = [];
  onselectListeners: TerraDrawEventListeners["select"][] = [];
  ondeselectListeners: TerraDrawEventListeners["deselect"][] = [];
  onhistoryListeners: TerraDrawEventListeners["history"][] = [];
  onstartListeners: ((draw: TerraDraw) => void)[] = [];
  onbeforestopListeners: ((draw: TerraDraw) => void)[] = [];

  constructor(id: string, modeFactory: ModeFactory, lastDrawSelectModeFactory: LastDrawSelectModeFactory,) {
    this.id = id;
    this.modeFactory = modeFactory;
    this.lastDrawSelectModeFactory = lastDrawSelectModeFactory;
    this.onstartListeners.push((draw) => draw.addFeatures(this.snapshot));
    this.onbeforestopListeners.push((draw) => this.snapshot = draw.getSnapshot() ?? []);
    this.onselectListeners.push((featureId) => this.selected = featureId);
    this.ondeselectListeners.push(() => this.selected = null);
  }

  readonly onready: TerraDrawEventListeners["ready"] = (...args) => this.onreadyListeners.forEach((listener) => listener(...args));
  readonly onfinish: TerraDrawEventListeners["finish"] = (...args) => this.onfinishListeners.forEach((listener) => listener(...args));
  readonly onchange: TerraDrawEventListeners["change"] = (...args) => this.onchangeListeners.forEach((listener) => listener(...args));
  readonly onselect: TerraDrawEventListeners["select"] = (...args) => this.onselectListeners.forEach((listener) => listener(...args));
  readonly ondeselect: TerraDrawEventListeners["deselect"] = (...args) => this.ondeselectListeners.forEach((listener) => listener(...args));
  readonly onhistory: TerraDrawEventListeners["history"] = (...args) => this.onhistoryListeners.forEach((listener) => listener(...args));
  readonly onstart: (draw: TerraDraw) => void = (...args) => this.onstartListeners.forEach((listener) => listener(...args));
  readonly onbeforestop: (draw: TerraDraw) => void = (...args) => this.onbeforestopListeners.forEach((listener) => listener(...args));

  addFeatures = (...args: Parameters<TerraDraw["addFeatures"]>): ReturnType<TerraDraw["addFeatures"]> | "not-validated" => {
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

  getSnapshotFeature(...args: Parameters<TerraDraw["getSnapshotFeature"]>): ReturnType<TerraDraw["getSnapshotFeature"]> {
    return this.draw?.getSnapshotFeature(...args);
  }

  selectFeature(...args: Parameters<TerraDraw["selectFeature"]>): ReturnType<TerraDraw["selectFeature"]> {
    // Guard against recursive onselect events when already selected.
    if (this.selected !== args[0]) {
      return this.draw?.selectFeature(...args);
    }
    console.debug(`selectFeature skipped because feature ${args[0]} is already selected.`)
    return
  }

  deselectFeature(...args: Parameters<TerraDraw["deselectFeature"]>): ReturnType<TerraDraw["deselectFeature"]> {
    // Guard against recursive ondeselect events when already null.
    if (this.selected !== null) {
      return this.draw?.deselectFeature(...args);
    }
    console.debug(`deselectFeature skipped because there is already nothing selected.`)
    return
  }
}
