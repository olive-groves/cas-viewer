import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec, SyncedMapLibreLayerKey, SyncedMapLibreSurfaceKey, MapLibreSyncedSurface } from "./synced-layer.svelte";
import { MultiView } from "./v0.8/views.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
// TODO: layerManager
export const syncedMapLibreLayers: SvelteMap<SyncedMapLibreLayerKey, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();
export const syncedMapLibreSurfaces: SvelteMap<SyncedMapLibreSurfaceKey, MapLibreSyncedSurface> = new SvelteMap();

// All the views
// TODO: ViewManager?
export const multiView: MultiView = new MultiView();
