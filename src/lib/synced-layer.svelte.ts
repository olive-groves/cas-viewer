import type * as maplibregl from 'maplibre-gl';
import { SvelteMap } from 'svelte/reactivity';

// For nested objects
type DeepPartial<T> = T extends any[] ? T : { [P in keyof T]?: DeepPartial<T[P]> }

// Generic Background for layers, not as a MapLibre spec, though it is meant for adding backgrounds to slots.
export type Background = {
  color: string;  // Could restrict to MapLibre background type, but not for now...
  opacity: number;
  visibility: boolean;
}

type LayerType = maplibregl.LayerSpecification["type"];

type MakeOptional<T, K extends PropertyKey> = T extends
  unknown
  ? Omit<T, Extract<keyof T, K>> & Partial<Pick<T, Extract<keyof T, K>>>
  : never;

type LayerSpecByType<TType extends LayerType> = MakeOptional<
  Extract<maplibregl.LayerSpecification, { type: TType }>,
  "id"
>;

export type LayerOverride<TSpec> = {
  spec: DeepPartial<Omit<TSpec, "type">>;
  background?: DeepPartial<Background>;
};

export type AnyLayerSpec = LayerSpecByType<LayerType>;

export class MapLibreSyncedLayer<TSpec extends AnyLayerSpec> {
  spec: TSpec;
  background?: Background = $state();
  overrides: SvelteMap<OverrideMapLibreLayerKey, LayerOverride<TSpec>> = new SvelteMap();

  constructor(spec: TSpec, background?: Background) {
    this.spec = $state(spec);
    this.background = background;
  }

  addOverride(override: LayerOverride<TSpec>): OverrideMapLibreLayerKey {
    const key: OverrideMapLibreLayerKey = `override-maplibre-layer_${crypto.randomUUID()}`;
    let spec = $state(override?.spec ?? {});
    let background = $state(override?.background);
    this.overrides.set(key, { spec, background });
    return key;
  }
}

export type SyncedMapLibreLayerKey = `synced-maplibre-layer_${string}-${string}-${string}-${string}-${string}`;
export type OverrideMapLibreLayerKey = `override-maplibre-layer_${string}-${string}-${string}-${string}-${string}`;

// Call this 'surface', not 'terrain', because it's a better generic term for the 3D
// mesh upon which to drape the layers of a view.
export type SurfaceSpec = {
  source: string;
  layout: {
    exaggeration: number;
    enabled: boolean;
  }
}
export type SurfaceOverride = {
  spec: DeepPartial<SurfaceSpec>;
};
export class MapLibreSyncedSurface {
  spec: SurfaceSpec;
  overrides: SvelteMap<OverrideMapLibreSurfaceKey, SurfaceOverride> = new SvelteMap();
  constructor(spec: SurfaceSpec) {
    this.spec = $state(spec);
  }
  addOverride(override: SurfaceOverride): OverrideMapLibreSurfaceKey {
    const key: OverrideMapLibreSurfaceKey = `override-maplibre-surface_${crypto.randomUUID()}`;
    let spec = $state(override?.spec ?? {});
    this.overrides.set(key, { spec });
    return key;
  }
}

export type SyncedMapLibreSurfaceKey = `synced-maplibre-surface_${string}-${string}-${string}-${string}-${string}`;
export type OverrideMapLibreSurfaceKey = `override-maplibre-surface_${string}-${string}-${string}-${string}-${string}`;
