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
// TODO: Blink - Radial (raking light simulator, basically)
export type ViewMode = SideBySideMode | LensMode | BlinkMode | FadeMode;

export type ViewKey = `view_${string}-${string}-${string}-${string}-${string}`;

// Preview states for nesting views, adding views, adding layers
export type Preview = {
  nest: number;
  addSibling: number;
  addChild: number;
}
// Window states for the title, the close/minimize buttons, drag buttons
export type Window = {
  state: "normal" | "maximized" | "minimized";
  frame: boolean,  // Visual bordered area around the document
  titlebar: boolean,  // Title of the window
  control: boolean,  // Maximize, minimize, roll up, drag, and other window controls
  document: boolean,  // The content itself
}
// Cumalative layout of interface elements
export type ViewLayout = {
  preview: Preview,
  window: Window,
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
      control: true,
      document: true,
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
      control: true,
      document: true,
    }
  });
}
