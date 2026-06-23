import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec } from "./synced-layer.svelte";
import { OrderedSvelteMap } from "./utils.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
export const syncedMapLibreLayers: SvelteMap<string, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();

// All the layer groups (for now, one group = a set of layers for a viewer)
// Order matters, because we might change their order. Think of them as windows that can be arranged.s
// A layer group is an ordered map of override keys, each pointing to their parent syncedMapLibreLayer
// This DOES NOT group by unique source because that's an implementation detail for svelte-maplibre-gl
export const layerGroups: OrderedSvelteMap<OrderedSvelteMap<string>> = new OrderedSvelteMap([], {reorderItemInPlace: true});
