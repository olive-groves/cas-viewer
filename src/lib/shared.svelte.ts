import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec, SyncedMapLibreLayerKey, SyncedMapLibreSurfaceKey, MapLibreSyncedSurface } from "./synced-layer.svelte";
import { MultiView } from "./v0.8/views.svelte";
import { modeFactory } from "./v0.8/synced-terra-draw-mode-factory.svelte";
import { SyncedTerraDraw, SyncedTerraDrawModeManager } from "./v0.8/synced-terra-draw.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
// TODO: LayerManager?
export const syncedMapLibreLayers: SvelteMap<SyncedMapLibreLayerKey, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();
export const syncedMapLibreSurfaces: SvelteMap<SyncedMapLibreSurfaceKey, MapLibreSyncedSurface> = new SvelteMap();

const syncedTerraDraw = new SyncedTerraDraw(modeFactory);
export let syncedTerraDrawModeManager = new SyncedTerraDrawModeManager(syncedTerraDraw, {modeOnDeselect: "select"});

// All the views
// TODO: ViewManager?
export const multiView: MultiView = new MultiView();
