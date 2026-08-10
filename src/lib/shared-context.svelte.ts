import { createContext } from 'svelte';
import type { SourceManager } from './source-manager.svelte';
import type { SvelteMap } from 'svelte/reactivity';
import type { AnyLayerSpec, MapLibreSyncedLayer, MapLibreSyncedSurface, SyncedMapLibreLayerKey, SyncedMapLibreSurfaceKey } from './synced-layer.svelte';

export const [getSourceManagerContext, setSourceManagerContext] = createContext<SourceManager>();
export const [getSyncedMapLibreLayersContext, setSyncedMapLibreLayersContext] = createContext<SvelteMap<SyncedMapLibreLayerKey, MapLibreSyncedLayer<AnyLayerSpec>>>();
export const [getSyncedMapLibreSurfacesContext, setSyncedMapLibreSurfacesContext] = createContext<SvelteMap<SyncedMapLibreSurfaceKey, MapLibreSyncedSurface>>();
