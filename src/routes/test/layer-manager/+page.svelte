<script lang="ts">
  // layer.ts
  import type * as maplibregl from 'maplibre-gl';
  import { SvelteMap } from 'svelte/reactivity';

  // TODO:
  // Manage position in viewer?
  // For this layer, is there also a position? Ask my ViewerManager/LayerManager!
  // LayerManager is responsible for positioning a set of layers.
  // We need placeholders to position layers.
  // If I move a layer to position 1, then the earlier position 1 needs to shift up to 2.
  // 2 shifts to 3. 3 to 4. 4 to 5. Etc.
  // That must be managed a Map:
  //  Given a layer ID (key), give me the position.
  // Since we're managing layer positions, that sounds a bit like a Viewer.
  // Or at least a LayerGroup, which we define as a specific ordering of layers.
  // We could have different groups that point to the same layers, managing their orders independently.
  // This manages placeholder/slot backgrounds
  // {
  //   "id": "my-slot",
  //   "type": "background",
  //   "layout": {"visibility": "none"}
  // }
  // id={`slot-{i}`}
  // Each Viewer has a LayerGroup / LayerManager?

  // For nested objects
  type DeepPartial<T> = T extends any[] ? T : { [P in keyof T]?: DeepPartial<T[P]> }

  // Generic Background for layers, not as a MapLibre spec, though it is meant for adding backgrounds to slots.
  type Background = {
    color: string;  // Could restrict to MapLibre background type, but not for now...
    opacity: number;
    visibilty: boolean;
  }

  type LayerType = maplibregl.LayerSpecification["type"];

  type MakeOptional<T, K extends PropertyKey> = T extends
    unknown
    ? Omit<T, Extract<keyof T, K>> & Partial<Pick<T, Extract<keyof T, K>>>
    : never;

  type LayerSpecByType<TType extends LayerType> = MakeOptional<
    Extract<maplibregl.LayerSpecification, { type: TType }>,
    "id"
  >;

  type AnyLayerSpec = LayerSpecByType<LayerType>;

  type LayerOverride<TSpec> = {
    spec: DeepPartial<Omit<TSpec, "type">>;
    background?: DeepPartial<Background>;
  };

  export class MapLibreSharedLayer<TSpec extends AnyLayerSpec> {
    spec: TSpec;
    background?: Background = $state();
    overrides: SvelteMap<string, LayerOverride<TSpec>> = new SvelteMap();

    constructor(spec: TSpec, background?: Background, overrides: [string, LayerOverride<TSpec>][] = []) {
      this.spec = $state(spec);
      this.background = background;
      overrides.forEach(([key, override]) => this.addOverride(key, override))
    }

    addOverride(key: string, override: LayerOverride<TSpec>) {
      let spec = $state(override?.spec ?? {});
      let background = $state(override?.background);
      this.overrides.set(key, {spec, background});
    }
  }

  // export function createSharedLayerByType<TType extends maplibregl.LayerSpecification["type"]>(
  //   sourceKey: string,
  //   spec: LayerSpecByType<TType>,
  //   background?: Background,
  // ) {
  //   const layer = new MapLibreSharedLayer<TType>(sourceKey, spec, background);
  //   return layer;
  // }


  // I have some source URLs, I wanna make some shared layers
  // createLayerFromSource() --> given a MapLibreSource, create a layer spec, feed into sharedlayer
  const mapLibreSharedLayers: SvelteMap<string, MapLibreSharedLayer<AnyLayerSpec>> = new SvelteMap();

  const spec: LayerSpecByType<"hillshade"> = {
    source: "0",  // source will be the key to the sources.map
    type: "hillshade",
    paint: {
      "hillshade-exaggeration": 0.3,
      "hillshade-illumination-direction": 180,
    }
  }
  const hillshadeSharedLayer = new MapLibreSharedLayer(
    spec,
    undefined,
    [
      ["00", {spec: {
        paint: {
          "raster-opacity": 0.3
        }
      }}],
      ["11", {spec: {}}],
      ["22", {spec: {}}],
    ]
  )

  hillshadeSharedLayer.addOverride(
    "33",
    {
      spec: {
        paint: {
          "hillshade-exaggeration": 0.8,
          "raster-opacity": 0.3,
        }
      }
    },
  )
  mapLibreSharedLayers.set(crypto.randomUUID(), hillshadeSharedLayer)

</script>

{#each mapLibreSharedLayers as [sharedLayerKey, sharedLayer] (sharedLayerKey)}
<div>Shared layer: {sharedLayerKey}</div>
<div>spec: {sharedLayer.spec.type}</div>
{#each sharedLayer.overrides as [overrideKey, override] (overrideKey)}
  <div style:user-select=none>Layer: {overrideKey}</div>
  {#if sharedLayer.spec.type === "hillshade"}
  {#each sharedLayer.spec?.paint ? Object.keys(sharedLayer.spec?.paint) : [] as property (property)}
  <div style:display=flex>
    <p>{property}</p>
    {#if typeof override.spec?.paint?.[property] !== "undefined"}
      <input type=range bind:value={override.spec.paint[property]} style:user-select=none/>
    {:else if typeof sharedLayer.spec.paint?.[property] !== "undefined"}
      <input type=range bind:value={sharedLayer.spec.paint[property]} style:user-select=none/>
    {/if}
    <input type=checkbox checked={override.spec?.paint?.[property] === undefined} onchange={(e) => {
      if (e.target.checked) {
        delete override.spec.paint[property];
      } else {
        override.spec.paint = {...override.spec?.paint, [property]: sharedLayer.spec.paint[property]}
      }
    }}>
  </div>
  {/each}
  {/if}
{/each}
{/each}
