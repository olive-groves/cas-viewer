<script lang="ts">
  import 'svelte-maplibre-gl/vite';
  import {
    MapLibre,
    BackgroundLayer
  } from 'svelte-maplibre-gl';

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
      // TODO: Only refresh if order is different than existing?
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
    const _ = layers;  // TODO: Is there a better way to trigger upon change in layers? (Maybe SvelteMap?)
    setTimeout(() => {
      // When `layers` changes (effect),
      // compare the order of the actual map layers with what it should be,
      // if different order (that is, the changes of layers has not propogated to the map),
      // then indeed refresh to ensure the order.
      const actualOrder = map?.getLayersOrder().filter(layer => !layer.includes("slot"))
      if (JSON.stringify(actualOrder) !== JSON.stringify(layers)) {
        refreshBeforeIds(map);
      }
    }, 20)
  })

</script>

<div style:display=flex style:flex-direction=column>

  <div style:display=flex>
    <button onclick={
      () => {
        const index = `${count++}`;
        backgrounds[index] = `hsla(${Math.floor(360 * Math.random())} 100% 50% / 100%)`;
        layers.push(index);
      }
    }>
      add (push)
    </button>
  </div>

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
