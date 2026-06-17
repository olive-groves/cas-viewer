<script lang="ts">
  class IdLayer {
    layer = {type: "raster"};
    id = crypto.randomUUID();  // Key is essential for non-rerenders
  }
  const initial_n = 5;
  const layerGroupArray = $state([...Array(initial_n).keys()].map(() => new IdLayer()));

  // Class that manages a list of ID'd layers,
</script>

<div>
  {#each {length: layerGroupArray.length}, z }
    {z}
  {/each}
</div>

<div style:display=flex style:flex-direction=column>
  {#each layerGroupArray as layer, z (layer.id)}
    <div>{layer.id}</div>
  {/each}
</div>

<div>
  <button onclick={() => layerGroupArray.unshift(new IdLayer())}>Add to start</button>
</div>
<div>
  <button onclick={() => layerGroupArray.splice(0, 0, layerGroupArray.splice(Math.floor(layerGroupArray.length/2), 1)[0])}>Move middle to start</button>
</div>
<div style:display=flex style:flex-direction=column>
  {#each layerGroupArray as layer, z (layer.id)}
    <div style:display=flex>
      <div>
        <button onclick={() => layerGroupArray.splice(z > 0 ? z - 1 : 0, 0, layerGroupArray.splice(z, 1)[0])}>▲</button>
      </div>
      <div>
        <button onclick={() => layerGroupArray.splice(z < layerGroupArray.length - 1 ? z + 1 : layerGroupArray.length - 1, 0, layerGroupArray.splice(z, 1)[0])}>▼</button>
      </div>
      <!-- <div>
        <button onclick={() => layerGroup.move(layer, (z < layerGroup.map.size - 1) ? z + 1 : layerGroup.map.size - 1)}></button>
      </div> -->
      <div style:margin="0px 8px">{z}</div>
      <div style:flex=1>{layer.id}</div>
      <div>
        <button onclick={() => layerGroupArray.splice(z, 1)}>X</button>
      </div>
    </div>
  {/each}
</div>
