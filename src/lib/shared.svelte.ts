import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec, SyncedMapLibreLayerKey, SyncedMapLibreSurfaceKey, MapLibreSyncedSurface } from "./synced-layer.svelte";
import { MultiView } from "./v0.8/views.svelte";
import {
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
  TerraDrawPointMode,
  TerraDrawPolyLineMode,
} from "terra-draw";
import { SyncedTerraDraw } from "./v0.8/synced-terra-draw.svelte";

// All the sources
export const sourceManager = new SourceManager();

// All the layers (they're all synced)
// TODO: LayerManager?
export const syncedMapLibreLayers: SvelteMap<SyncedMapLibreLayerKey, MapLibreSyncedLayer<AnyLayerSpec>> = new SvelteMap();
export const syncedMapLibreSurfaces: SvelteMap<SyncedMapLibreSurfaceKey, MapLibreSyncedSurface> = new SvelteMap();

// TODO: SyncedTerraDrawManager?
const defaultSelectFlags = {
  feature: {
    draggable: true,
    coordinates: {
      deletable: true,
      midpoints: true,
      draggable: true
    }
  }
};
const selectFlags = {
  point: defaultSelectFlags,
  polygon: defaultSelectFlags,
  polyline: defaultSelectFlags,
}
const modeFactory = () => {
  {
    return [
      new TerraDrawSelectMode({
        flags: selectFlags,
      }),
      new TerraDrawPointMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
      }),
      new TerraDrawPolygonMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
      }),
      new TerraDrawPolyLineMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
      }),
    ];
  }
}
export const syncedTerraDraw = new SyncedTerraDraw(modeFactory);

// All the views
// TODO: ViewManager?
export const multiView: MultiView = new MultiView();
