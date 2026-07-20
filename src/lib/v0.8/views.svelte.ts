import { OrderedSvelteMap } from "$lib/utils.svelte";

// MODEL /////////////////////////////////////////////////////////////////////////////
// Define the WHAT of a single view
// A single view is a set of layers that are "fused".
// They must be presented as a single view, not side by side.
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

export class SingleView {
  type = "single";
  // key: overrideKey
  // value: syncedLayerKey
  layers: OrderedSvelteMap<string> = new OrderedSvelteMap();
}
export class MultiView {
  type = "multi";
  mode: ViewMode = $state({
    // type: "lens",
    type: "side-by-side",
  });
  views: OrderedSvelteMap<SingleView | MultiView> = new OrderedSvelteMap();
}
