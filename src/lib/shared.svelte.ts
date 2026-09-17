import { SvelteMap } from "svelte/reactivity";
import { SourceManager } from "./source-manager.svelte";
import type { MapLibreSyncedLayer, AnyLayerSpec, SyncedMapLibreLayerKey, SyncedMapLibreSurfaceKey, MapLibreSyncedSurface } from "./synced-layer.svelte";
import { MultiView } from "./v0.8/views.svelte";
import {
  TerraDrawRenderMode,
  TerraDrawSelectMode,
  TerraDrawPolyLineMode,
  TerraDrawMarkerMode,
  ValidateNotSelfIntersecting,
} from "terra-draw";
import { SyncedTerraDraw, type Validator } from "./v0.8/synced-terra-draw.svelte";

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
  marker: defaultSelectFlags,
  polyline: defaultSelectFlags,
}
const primary = "#fff";
const shadow = "#000";
const secondary = "#000";
const fillOpacity = 0.3;
// const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-200v-400h80v264l464-464 56 56-464 464h264v80H200Z"/></svg>`;
const svg = `
<svg
  width="200px" height="200px"
  viewBox="0 0 200 200"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMaxYMax meet"
>
  <defs>
    <marker
      id="marker-arrow"
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="4"
      markerHeight="4"
      orient="auto-start-reverse"
      fill="${primary}"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>

    <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
      <feDropShadow
        dx="1"
        dy="1"
        stdDeviation="2"
        flood-color="${shadow}"
        flood-opacity="1"
      />
    </filter>

    <mask id="mask-inner-outer">
      <circle cx="100" cy="100" r="100" fill="${primary}" />
      <circle cx="100" cy="100" r="10" fill="black" />
    </mask>

  </defs>

  <!-- A line with a marker -->
  <g filter="url(#filter-shadow)">
    <g mask="url(#mask-inner-outer)">
      <rect
        id="_square-spanner"
        x="0"
        y="0"
        width="200"
        height="200"
        fill="transparent"
      />
      <line
        x1="200"
        y1="0"
        x2="100"
        y2="100"
        stroke="${primary}"
        stroke-width="4"
      />
    </g>
    <line
      x1="200"
      y1="0"
      x2="100"
      y2="100"
      stroke-width="4"
      stroke="transparent"
      marker-end="url(#marker-arrow)"
    />
  </g>
</svg>
`;
const svgBlob = new Blob([svg], { type: "image/svg+xml" });
const svgBlobUrl = URL.createObjectURL(svgBlob);
const markerUrl = svgBlobUrl;

const selectedSvg = `
<svg
  width="200px" height="200px"
  viewBox="0 0 200 200"
  xmlns="http://www.w3.org/2000/svg"
  preserveAspectRatio="xMaxYMax meet"
>
  <defs>
    <marker
      id="marker-arrow"
      viewBox="0 0 10 10"
      refX="10"
      refY="5"
      markerWidth="4"
      markerHeight="4"
      orient="auto-start-reverse"
      fill="${primary}"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" />
    </marker>

    <filter filterUnits="userSpaceOnUse" id="filter-shadow" x="0" y="0" width="100%" height="100%">
      <feDropShadow
        dx="2"
        dy="2"
        stdDeviation="0"
        flood-color="${shadow}"
        flood-opacity="1"
      />
    </filter>

    <mask id="mask-inner-outer">
      <circle cx="100" cy="100" r="100" fill="${primary}" />
      <circle cx="100" cy="100" r="10" fill="black" />
    </mask>

  </defs>

  <!-- A line with a marker -->
  <g filter="url(#filter-shadow)">
    <g mask="url(#mask-inner-outer)">
      <rect
        id="_square-spanner"
        x="0"
        y="0"
        width="200"
        height="200"
        fill="transparent"
      />
      <line
        x1="200"
        y1="0"
        x2="100"
        y2="100"
        stroke="${primary}"
        stroke-width="4"
      />
    </g>
    <line
      x1="200"
      y1="0"
      x2="100"
      y2="100"
      stroke-width="4"
      stroke="transparent"
      marker-end="url(#marker-arrow)"
    />
  </g>
  <circle cx="100" cy="100" r="6" fill="${primary}" stroke="black" stroke-width="2" />
</svg>
`;
const selectedSvgBlob = new Blob([selectedSvg], { type: "image/svg+xml" });
const selectedSvgBlobUrl = URL.createObjectURL(selectedSvgBlob);
const selectedMarkerUrl = selectedSvgBlobUrl;

const markerWidth = svg.match(`(width.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
const markerHeight = svg.match(`(height.*?px)`)?.at(0)?.split(`"`)?.at(1)?.split("px")?.at(0);
const validator: Validator = (feature, { updateType }) => {
  return { valid: SyncedTerraDraw.outOfBoundsValidator(feature, { updateType }).valid && ValidateNotSelfIntersecting(feature).valid };
}
const modeFactory = () => {
  {
    return [
      new TerraDrawRenderMode({
        modeName: "view-only",
        styles: {},
      }),
      new TerraDrawSelectMode({
        flags: selectFlags,
        styles: {
          selectedMarkerUrl: selectedMarkerUrl,
          selectedMarkerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          selectedMarkerHeight: markerHeight ? parseInt(markerHeight) : undefined,
        },
      }),
      new TerraDrawMarkerMode({
        validation: SyncedTerraDraw.outOfBoundsValidator,
        styles: {
          markerUrl: markerUrl,
          markerWidth: markerWidth ? parseInt(markerWidth) : undefined,
          markerHeight: markerHeight ? parseInt(markerHeight) : undefined,
        },
      }),
      new TerraDrawPolyLineMode({
        validation: validator,
        styles: {
          lineStringColor: primary,
          // lineStringOpacity: ,
          // lineStringWidth: ,
          polygonFillColor: primary,
          polygonFillOpacity: fillOpacity,
          polygonOutlineColor: primary,
          // polygonOutlineOpacity: ,
          // polygonOutlineWidth: ,
          closingPointColor: primary,
          // closingPointOpacity: ,
          // closingPointWidth: ,
          closingPointOutlineColor: secondary,
          // closingPointOutlineOpacity: ,
          // closingPointOutlineWidth: ,
          snappingPointColor: primary,
          // snappingPointOpacity: ,
          // snappingPointWidth: ,
          snappingPointOutlineColor: secondary,
          // snappingPointOutlineOpacity: ,
          // snappingPointOutlineWidth: ,
          // @ts-ignore FIXME: Remove after bumping terra-draw
          coordinatePointColor: primary,
          // coordinatePointOpacity: ,
          // coordinatePointWidth: ,
          coordinatePointOutlineColor: secondary,
          // coordinatePointOutlineOpacity: ,
          // coordinatePointOutlineWidth: ,
        }
      }),
    ];
  }
}
export const syncedTerraDraw = new SyncedTerraDraw(modeFactory);

// All the views
// TODO: ViewManager?
export const multiView: MultiView = new MultiView();
