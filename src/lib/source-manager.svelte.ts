import { SvelteMap } from "svelte/reactivity";
import { MapLibreSourceSpecAdapter, type MapLibreSourceSpecType, type OverrideMapLibreSourceSpec, type PMTilesTileset } from "./sources";

export class SourceManager {
  // TODO: Abstract this out with adapters; that is, elect to have mapLibre, openseadragon, etc.?
  sources: SvelteMap<string, PMTilesTileset> = new SvelteMap();
  mapLibreSources: SvelteMap<string, {source: MapLibreSourceSpecAdapter, override: OverrideMapLibreSourceSpec}> = new SvelteMap();

  add(
    source: PMTilesTileset,
    adapters?: {
      mapLibre?: {
        forceSpecType?: MapLibreSourceSpecType,
        override?: OverrideMapLibreSourceSpec,
      }
    }) {
    const key = crypto.randomUUID();

    this.sources.set(key, source);

    const override = $state(adapters?.mapLibre?.override ?? {});
    const mapLibreSource = {
      source: new MapLibreSourceSpecAdapter(source, adapters?.mapLibre?.forceSpecType),
      override,  // TODO: Prove is reactive!
    }
    this.mapLibreSources.set(key, mapLibreSource);
    return key
  }

  delete(key: string) {
    this.sources.delete(key);
    this.mapLibreSources.delete(key);
  }
}
