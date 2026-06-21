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

  // Apparently we need DeepPartial on nested objects?
  type DeepPartial<T> = T extends any[] ? T : { [P in keyof T]?: DeepPartial<T[P]> }

  // Generic Background for layers, not as a MapLibre spec, though it is meant for adding backgrounds to slots.
  type Background = {
    color: string;  // Could restrict to MapLibre background type, but not for now...
    opacity: number;
    visibilty: boolean;
  }

  type LayerType = maplibregl.LayerSpecification["type"];


  type DistributiveOmit<T, K extends PropertyKey> = T extends
    unknown
    ? Omit<T, Extract<keyof T, K>>
    : never;

  type DistributiveMakeOptional<T, K extends PropertyKey> = T extends
    unknown
    ? Omit<T, Extract<keyof T, K>> & Partial<Pick<T, Extract<keyof T, K>>>
    : never;

  type LayerSpecByType<TType extends LayerType> = DistributiveMakeOptional<
    Extract<maplibregl.LayerSpecification, { type: TType }>,
    "id"
  >;

  type LayerOverride<TType extends LayerType> = {
    // spec: DeepPartial<DistributiveOmit<LayerSpecByType<TType>, "type">>;  // Don't omit type for now...
    spec: DeepPartial<LayerSpecByType<TType>>;
    background?: DeepPartial<Background>;
  };

  export class MapLibreSharedLayer<TType extends LayerType> {
    spec: LayerSpecByType<TType>;
    background?: Background = $state();
    overrides: SvelteMap<string, LayerOverride<TType>> = new SvelteMap();

    constructor(spec: LayerSpecByType<TType>, background?: Background, overrides: [string, LayerOverride<TType>][] = []) {
      this.spec = $state(spec);
      this.background = background;
      overrides.forEach(([key, override]) => this.addOverride(key, override))
    }

    addOverride(key: string, override: LayerOverride<TType>) {
      let spec = $state(override?.spec ?? {});
      spec.type ??= this.spec.type;
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
  const mapLibreSharedLayers: SvelteMap<string, MapLibreSharedLayer<LayerType>> = new SvelteMap();

  const hillshadeSharedLayer = new MapLibreSharedLayer(
    {
      source: "0",  // source will be the key to the sources.map
      type: "hillshade",
      paint: {
        "hillshade-exaggeration": 0.3,
        "hillshade-illumination-direction": 180,
      }
    } satisfies LayerSpecByType<"hillshade">,
    undefined,
    [
      ["00", {spec: {}}],
      ["11", {spec: {}}],
      ["22", {spec: {}}],
    ]
    // defineLayer({
    //   source: "0",  // source will be the key to the sources.map
    //   type: "hillshade",
    // }),
  )

  hillshadeSharedLayer.addOverride(
    "33",
    {spec: {paint: {"hillshade-exaggeration": 0.8}}},
  )
  mapLibreSharedLayers.set(crypto.randomUUID(), hillshadeSharedLayer)

</script>

{#each mapLibreSharedLayers as [sharedLayerKey, sharedLayer] (sharedLayerKey)}
<div>Shared layer: {sharedLayerKey}</div>
<div>spec: {sharedLayer.spec.type}</div>
{#each sharedLayer.overrides as [overrideKey, override] (overrideKey)}
  <div style:user-select=none>Layer: {overrideKey}</div>
  {#if sharedLayer.spec.type === "hillshade"}
  {#each Object.keys(sharedLayer.spec?.paint) as property (property)}
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
