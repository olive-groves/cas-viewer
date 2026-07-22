import type { OverrideMapLibreLayerKey, SyncedMapLibreLayerKey } from "$lib/synced-layer.svelte";
import { OrderedSvelteMap } from "$lib/utils.svelte";

// MODEL /////////////////////////////////////////////////////////////////////////////
// Define the WHAT of a single view
// A single view is a set of layers that are "fused".
// They MUST be presented as a single view, not side by side.
// If a set of 3 layers should be presented side by side, then the
// responsibility is on someone else to create 3 single views and arrange them
// side by side.
type SideBySideMode = {
  type: "side-by-side";
}
type LensMode = {
  type: "lens";
}
export type ViewMode = SideBySideMode | LensMode;

export type ViewKey = `view_${string}-${string}-${string}-${string}-${string}`;

export class SingleView {
  type = "single";
  layers: OrderedSvelteMap<OverrideMapLibreLayerKey, SyncedMapLibreLayerKey> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `override-maplibre-layer_${crypto.randomUUID()}` });
}
export class MultiView {
  type = "multi";
  mode: ViewMode = $state({
    type: "side-by-side",
  });
  views: OrderedSvelteMap<ViewKey, SingleView | MultiView> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `view_${crypto.randomUUID()}` });
}
