<script lang="ts">
  import { TerraDraw } from "@svelte-maplibre-gl/terradraw";
  import { onMount } from "svelte";

  let {
    mode,
    instance,
  } = $props();

  onMount(() => {
    return () => {
      // if (instance)
      //   instance.snapshot = instance.draw?.getSnapshot();
    };
  })
</script>


<TerraDraw
  {mode}
  {...instance}
  bind:draw={instance.draw}
  modes={instance.modeFactory()}
/>
