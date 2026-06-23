import type * as maplibregl from 'maplibre-gl';
import { SvelteMap } from 'svelte/reactivity';

// For nested objects
type DeepPartial<T> = T extends any[] ? T : { [P in keyof T]?: DeepPartial<T[P]> }

// Generic Background for layers, not as a MapLibre spec, though it is meant for adding backgrounds to slots.
type Background = {
  color: string;  // Could restrict to MapLibre background type, but not for now...
  opacity: number;
  visibilty: boolean;
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
  overrides: SvelteMap<string, LayerOverride<TSpec>> = new SvelteMap();

  constructor(spec: TSpec, background?: Background, overrides: [string, LayerOverride<TSpec>][] = []) {
    this.spec = $state(spec);
    this.background = background;
    overrides.forEach(([key, override]) => this.addOverride(key, override))
  }

  addOverride(key: string, override: LayerOverride<TSpec>) {
    let spec = $state(override?.spec ?? {});
    let background = $state(override?.background);
    this.overrides.set(key, {spec, background});
  }
}
