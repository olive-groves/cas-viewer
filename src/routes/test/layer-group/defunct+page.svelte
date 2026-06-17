<!-- FIXME: Using z to set order changes tab order AND arrays are shown to not rerender as bad as tested, meaning the entire premise here is defunct. -->

<script lang="ts">
  import { SvelteMap } from "svelte/reactivity";

  class Layer {
    id = crypto.randomUUID();
  }
  class IndexedValue {
    value: any;
    index: number = $state(0);
    constructor(value: any, z: number) {
      this.value = value;
      this.index = z;
    }
  }

  // SvelteMap keyed by value with index, allowing us to #each "out of order" while still referencing a known order via its index.
  // Used for managing layer Z index.
  class IndexedSvelteMap {
    map: SvelteMap<any, IndexedValue> = new SvelteMap();

    constructor(values?: Array<any> | Record<any, any>) {
      if (typeof values !== 'undefined') {
        values.forEach((value: any) => this.add(value));
      }
    }

    add(value: any, options?: {index?: number}) {
      // TODO: Support for negative indexing?
      const index = options?.index ?? this.map.size;
      const indexedValue = new IndexedValue(value, index);
      // Each existing indexedValue shifts up in index if at or above the index to be added.
      if (index < this.map.size) {  // Skip if at end
        this.map.forEach((indexedValue) => {if (indexedValue.index >= index) indexedValue.index += 1});
      }
      this.map.set(value, indexedValue);
      return indexedValue
    }
    delete(value: any): boolean {
      const originalSize = this.map.size;
      const index = this.map.get(value)?.index;
      if (index === undefined) {  // Like Map, don't throw error on non-existance?
        // throw Error("Value does not exist in map.")
        return false
      }
      const deleted = this.map.delete(value);
      if (!deleted) {
        return false
      }
      if (index < originalSize) {  // Skip if at end
        this.map.forEach((indexedValue) => {if (indexedValue.index >= index) indexedValue.index -= 1});
      }
      return deleted
    }
    move(value: any, index: number) {
      const existingIndexedValue = this.map.get(value);
      if (existingIndexedValue === undefined) {
        throw Error("Value does not exist in map.")
      }
      const oldIndex = existingIndexedValue.index;
      if (oldIndex === index) {
        return
      }
      // Temporarily set to impossible out-of-bounds index
      existingIndexedValue.index = this.map.size + 1;

      const minIndex = Math.min(oldIndex, index);
      const maxIndex = Math.max(oldIndex, index);
      this.map.forEach((indexedValue) => {
        // Skip if outside affected indices
        if (minIndex <= indexedValue.index && indexedValue.index <= maxIndex) {
          if (index < oldIndex) {  // Insert earlier means we shift everything up
            indexedValue.index += 1;
          } else {  // Insert later means we shift everything down
            indexedValue.index -= 1;
          }
        }
      })
      existingIndexedValue.index = index;
    }
  }

  // Don't rely on array for quiet reorders based on index!
  // Changing order still rerenders preceding/following DOM elements.
  const initial_n = 5;
  const layerGroupArray = $state([...Array(initial_n).keys()].map(() => new Layer()));
  const layers = Array.from(Array(initial_n), (_) => new Layer());
  const layerGroup = new IndexedSvelteMap(layers);
</script>

<button onclick={() => layerGroup.add(new Layer(), {index: 0})}>
  Add to start
</button>
<button onclick={() => layerGroup.add(new Layer())}>
  Add to end
</button>

<!-- Safe. Can use for slot (background) layers. -->
<!-- {#each {length: layerGroup.map.size}, i}
  <div>{i}</div>
{/each} -->

<!-- Mock MapLibre z index setting -->
<!-- Show that listing in #each order does not get spammed if changed -->
<div style:border-bottom="1px solid red">
  {#each layerGroup.map as [key, {value: layer, index: z}] (key)}
  <div style:display=flex>
    <div>{z}</div>
    <div> · </div>
    <div>{layer.id}</div>
  </div>
  {/each}
</div>


<!-- Show that z index can be used for flex box ordering -->
<div style:display=flex style:flex-direction=column>
  {#each layerGroup.map as [key, {value: layer, index: z}] (key)}
    <div style:order={z} style:display=flex>
      <div>
        <button onclick={() => layerGroup.move(layer, (z > 0) ? z - 1 : 0)}>▲</button>
      </div>
      <div>
        <button onclick={() => layerGroup.move(layer, (z < layerGroup.map.size - 1) ? z + 1 : layerGroup.map.size - 1)}>▼</button>
      </div>
      <div style:margin="0px 8px">{z}</div>
      <div style:flex=1>{layer.id}</div>
      <div>
        <button onclick={() => layerGroup.delete(layer)}>X</button>
      </div>
    </div>
  {/each}
</div>

<!-- Unsafe for arrays. Will need object with z property. -->
<div>
  <button onclick={() => layerGroupArray.unshift(new Layer())}>Add to start</button>
</div>
<div>
  <button onclick={() => layerGroupArray.splice(0, 0, layerGroupArray.splice(Math.floor(layerGroupArray.length/2), 1)[0])}>Move middle to start</button>
</div>
<div>
{#each layerGroupArray as layer, i (layer.id)}
  <div>
    {i}
  </div>
  <div>
    {layer.id}
  </div>
  {/each}
</div>
