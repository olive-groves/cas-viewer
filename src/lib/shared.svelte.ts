import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec } from "./synced-layer.svelte";
import { OrderedSvelteMap } from "./utils.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
export const syncedMapLibreLayers: SvelteMap<string, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();

// All the layer groups (one per viewer)
// A layer group is an ordered map of override keys, each pointing to their parent layer
// It doesn't group by unique source because that's an implementation detail for svelte-maplibre-gl
export const layerGroups: OrderedSvelteMap<MapLibreSyncedLayer<AnyLayerSpec>> = new OrderedSvelteMap();
