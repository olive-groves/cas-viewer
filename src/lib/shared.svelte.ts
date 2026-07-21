import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec, SyncedMapLibreLayerKey, OverrideMapLibreLayerKey } from "./synced-layer.svelte";
import { OrderedSvelteMap } from "./utils.svelte";
import { MultiView } from "./v0.8/views.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
// TODO: SyncedMapLibreLayerManager?
export const syncedMapLibreLayers: SvelteMap<SyncedMapLibreLayerKey, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();

// All the views
// TODO: ViewManager?
export const multiView: MultiView = new MultiView();

// TODO: Deprecate in favor of "multiView"
// All the layer groups (for now, one group = a set of layers for a viewer)
// Order matters, because we might change their order. Think of them as windows that can be arranged.s
// A layer group is an ordered map of override keys, each pointing to their parent syncedMapLibreLayer
// This DOES NOT group by unique source because that's an implementation detail for svelte-maplibre-gl
export const layerGroups: OrderedSvelteMap<OverrideMapLibreLayerKey, OrderedSvelteMap<string>> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `override-maplibre-layer_${crypto.randomUUID()}` });
