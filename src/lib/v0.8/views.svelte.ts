import type {
  SyncedMapLibreLayerKey,
  OverrideMapLibreLayerKey,
  SyncedMapLibreSurfaceKey,
  OverrideMapLibreSurfaceKey,
} from "$lib/synced-layer.svelte";
import { OrderedSvelteMap } from "$lib/utils.svelte";
import type { WindowState } from "$lib/v0.8/viewer-window";

// A single view is a set of layers that are "fused".
// They MUST be presented as a single view, not side by side.
// If a set of 3 layers should be presented side by side, then the
// responsibility is on someone else to create 3 single views and arrange them
// side by side.
type SideBySideMode = {
  type: "side-by-side";  // Side-by-side as a type means "next to each other along a single axis, the axis of which closest keeps 1:1 aspect ratio"
  // arrangement: "side-by-side";
}
type LensMode = {
  type: "lens";
  // arrangement: "overlay";
}
type BlinkMode = {
  type: "blink";
  // arrangement: "overlay";
}
type FadeMode = {
  type: "fade";
  // arrangement: "overlay";
}
// TODO: Blink - Radial (raking light simulator, basically)
export type ViewMode = SideBySideMode | LensMode | BlinkMode | FadeMode;

export type ViewKey = `view_${string}-${string}-${string}-${string}-${string}`;

// Preview states for nesting views, adding views, adding layers
export type Preview = {
  nest: number;
  addSibling: number;
  addChild: number;
}
// Cumalative layout of interface elements
export type ViewLayout = {
  preview: Preview,
  window: WindowState,
}

export class SingleView {
  name: string | undefined = $state(undefined);
  type = "single";
  layers: OrderedSvelteMap<OverrideMapLibreLayerKey, SyncedMapLibreLayerKey> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `override-maplibre-layer_${crypto.randomUUID()}` });
  surface: {
    overrideKey: OverrideMapLibreSurfaceKey | undefined;
    syncedSurfaceKey: SyncedMapLibreSurfaceKey | undefined;
  } = $state({ overrideKey: undefined, syncedSurfaceKey: undefined });
  layout: ViewLayout = $state({
    preview: {
      nest: 0,
      addSibling: 0,
      addChild: 0,
    },
    window: {
      state: "normal",
      frame: true,
      titlebar: true,
      title: "View",
      controls: true,
      clientArea: true,
    }
  });
}
export class MultiView {
  name: string | undefined = $state(undefined);
  type = "multi";
  mode: ViewMode = $state({
    type: "side-by-side",
  });
  views: OrderedSvelteMap<ViewKey, SingleView | MultiView> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `view_${crypto.randomUUID()}` });
  layout: ViewLayout = $state({
    preview: {
      nest: 0,
      addSibling: 0,
      addChild: 0,
    },
    window: {
      state: "normal",
      frame: true,
      titlebar: true,
      title: "Multiview",
      controls: true,
      clientArea: true,
    }
  });
}
