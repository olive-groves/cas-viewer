import { SvelteMap } from "svelte/reactivity";
import { MapLibreSourceSpecAdapter, SingleImage, type MapLibreSourceSpecType, type OverrideMapLibreSourceSpec, type PMTilesTileset } from "./sources";

export type MapLibreSource = {
  source: MapLibreSourceSpecAdapter,
  override: OverrideMapLibreSourceSpec
}

export type SourceKey = `source_${string}-${string}-${string}-${string}-${string}`;

export class SourceManager {
  // TODO: Abstract this out with adapters; that is, elect to have mapLibre, openseadragon, etc.?
  sources: SvelteMap<SourceKey, PMTilesTileset | SingleImage> = new SvelteMap();
  mapLibreSources: SvelteMap<SourceKey, MapLibreSource> = new SvelteMap();

  add(
    source: PMTilesTileset | SingleImage,
    adapters?: {
      mapLibre?: {
        forceSpecType?: MapLibreSourceSpecType,
        override?: OverrideMapLibreSourceSpec,
      }
    }) {
    const key: SourceKey = `source_${crypto.randomUUID()}`;

    this.sources.set(key, source);

    const override = $state(adapters?.mapLibre?.override ?? {});
    const mapLibreSource = {
      source: new MapLibreSourceSpecAdapter(source, adapters?.mapLibre?.forceSpecType),
      override,  // TODO: Prove is reactive!
    }
    this.mapLibreSources.set(key, mapLibreSource);
    return key
  }

  delete(key: SourceKey) {
    this.sources.delete(key);
    this.mapLibreSources.delete(key);
  }
}
