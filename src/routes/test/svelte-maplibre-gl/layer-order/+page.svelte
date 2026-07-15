<script lang="ts">
  import {
    MapLibre,
    BackgroundLayer
  } from 'svelte-maplibre-gl';
  import { convertCompilerOptionsFromJson } from 'typescript';

  let map = $state.raw(undefined);

  let layers = $state([
    "2",
    "0",
    "1",
  ])
  // svelte-ignore state_referenced_locally
  let count = $state(layers.length)
  let backgrounds = $state({
    "0": "rgba(255, 0, 0, 1)",
    "1": "rgba(0, 255, 0, 1)",
    "2": "rgba(0, 0, 255, 1)",
  })

  // We'll need to run a 'refresh beforeIds' sesh to get those layers back in order
  function refreshBeforeIds(targetMap) {
    if (targetMap?.isStyleLoaded()) {
      // TODO: Only refresh if order is different than existing
      console.log("Refreshing")
      refreshing = true;
      // Set slot beforeId backwards, starting from second to last, because we "stack under"
      for (let i = layers.length - 2; i > -1; i--) {
        const id = `slot-${layers.at(i)}`;
        const beforeId = `slot-${layers.at(i + 1)}`;
        targetMap?.moveLayer(id, beforeId)
      }
      Object.keys(backgrounds).forEach(layer => {if (layers.indexOf(layer) >= 0) targetMap?.moveLayer(layer, "slot-" + layer)})
      setTimeout(() => {
        refreshing = false;
      }, 100)
    }
  }

  let refreshing = false;
  let refreshTimeout;

  function handleDataEvent(e) {
    if (refreshing) {
      return
    } else {
      if (e.target?.isStyleLoaded()) {
        refreshBeforeIds(e.target);
      } else {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout((e) => handleDataEvent(e), 100);
      }
    }
  }

  function move(from: number, to: number) {
    const toRemainder = to % layers.length;
    layers = layers.toSpliced(from, 1).toSpliced(toRemainder < 0 ? layers.length + toRemainder : toRemainder, 0, layers[from]);
  }

  $effect(() => {
    layers.at(0);
    setTimeout(() => {
      const actualOrder = map?.getLayersOrder().filter(layer => !layer.includes("slot"))
      console.log(actualOrder)
      // TODO COMPARE IF TRUE ORDER; IF NOT, DO EM
    }, 100)
  })

</script>

<button onclick={
  () => {
    const from = layers.length - 1;
    const to = 0;
    layers = layers.toSpliced(from, 1).toSpliced(to < 0 ? layers.length + to : to, 0, layers[from]);
  }
}>
  Move Top to Bottom
</button>

<button onclick={
  () => {
    const index = `${count++}`;
    layers.push(index);
    backgrounds[index] = `hsla(${Math.floor(360 * Math.random())} 100% 50% / 100%)`;
  }
}>
  add (push)
</button>
<button onclick={
  () => {
    const index = layers.at(-1);
    layers.pop();
  }
}>
  pop
</button>

<div style:display=flex style:flex-direction=column>
  {#each [...layers].reverse() as layer, reversedIndex (layer)}
    {@const index = layers.length - 1 - reversedIndex}
    <div style:display=flex>
      <div style:width=3rem style:background-color={backgrounds[layer]}></div>
      {layer}
      <button onclick={() => move(index, index + 1)}>up</button>
      <button onclick={() => move(index, index - 1)}>down</button>
      <button onclick={() => layers.splice(index, 1)}>x</button>
    </div>
  {/each}
</div>

<MapLibre
  bind:map
  inlineStyle="height: 100vh;"
  onload={handleDataEvent}
  ondata={handleDataEvent}
>
  {#each layers as layer (layer)}
    <BackgroundLayer
      id={`slot-${layer}`}
      layout={{visibility: "none"}}
    />
  {/each}
  {#each Object.entries(backgrounds) as [layer, color] (layer)}
    {#if layers.indexOf(layer) >= 0}
      <BackgroundLayer
        id={layer}
        paint={{"background-color": color}}
      />
    {/if}
  {/each}
</MapLibre>
