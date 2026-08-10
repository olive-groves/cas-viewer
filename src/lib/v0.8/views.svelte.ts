import type {
  SyncedMapLibreLayerKey,
  OverrideMapLibreLayerKey,
  SyncedMapLibreSurfaceKey,
  OverrideMapLibreSurfaceKey,
} from "$lib/synced-layer.svelte";
import { OrderedSvelteMap } from "$lib/utils.svelte";

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
type BlinkMode = {
  type: "blink";
}
type FadeMode = {
  type: "fade";
}
export type ViewMode = SideBySideMode | LensMode | BlinkMode | FadeMode;

export type ViewKey = `view_${string}-${string}-${string}-${string}-${string}`;

export type ViewLayout = {
  window: "normal" | "maximized" | "minimized";
}

// Preview states for nesting views, adding views, adding layers
export type ViewPreview = {
  nest: boolean;
  addSibling: boolean;
  addChild: boolean;
}

export class SingleView {
  name: string | undefined = $state(undefined);
  type = "single";
  layers: OrderedSvelteMap<OverrideMapLibreLayerKey, SyncedMapLibreLayerKey> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `override-maplibre-layer_${crypto.randomUUID()}` });
  surface: {
    overrideKey: OverrideMapLibreSurfaceKey | undefined;
    syncedSurfaceKey: SyncedMapLibreSurfaceKey | undefined;
  } = $state({ overrideKey: undefined, syncedSurfaceKey: undefined });
  layout: ViewLayout = $state({ window: "normal" });
  // FIXME: Not the best spot for this. Used to track each'd DropZones in MultiViewer.
  // Or make this part of SingleViewer instead? Because if I had one SingleViewer, I might want to add directly rather than rely on a MultiViewer for dropzone?
  preview: ViewPreview = $state({
    nest: false,
    addSibling: false,
    addChild: false,
  })
}
export class MultiView {
  name: string | undefined = $state(undefined);
  type = "multi";
  mode: ViewMode = $state({
    type: "side-by-side",
  });
  views: OrderedSvelteMap<ViewKey, SingleView | MultiView> = new OrderedSvelteMap({ reorderItemInPlace: true, keyGenerator: () => `view_${crypto.randomUUID()}` });
  layout: ViewLayout = $state({ window: "normal" });
  preview: ViewPreview = $state({
    nest: false,
    addSibling: false,
    addChild: false,
  })
}
