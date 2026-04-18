<script lang="ts">
  import maplibregl from 'maplibre-gl';

  import {
    MapLibre,
    CustomControl,
    NavigationControl,
  } from 'svelte-maplibre-gl';

  let map: maplibregl.Map | undefined = $state()

  let collapseVisible = $state(true)

</script>

<div class=container id=main style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; margin: none; background-color: black;">
  <MapLibre
    bind:map={map}
    inlineStyle="height: 100%; width: 100%;"
    renderWorldCopies={false}
    maxPitch={87}
    aroundCenter={false}
    hash={true}
    attributionControl={false}
  >
    <CustomControl position=top-left class=collapse>
      <div class=my-div style:display={`${collapseVisible ? "revert" : "none"}`}>
        <h1>Heading 1</h1>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
        <p>Here's some text.</p>
      </div>
      <button type="button" onclick={() => collapseVisible = !collapseVisible}>Toggle</button>
    </CustomControl>
    <NavigationControl />
  </MapLibre>
</div>

<style>
	.container {
    :global(.maplibregl-ctrl.collapse) {
      display: grid;
      grid-template: auto 1fr / auto 1fr;
      background-color: transparent;
      overflow: hidden;
      .my-div {
        box-sizing: border-box;
        /* width: 240px; */
        /* height: 180px; */
        grid-area: 1 / 1 / -1 / -1;
        background-color: oklch(0.7 0.5 40);
      }
      button {
        width: fit-content;
        padding-left: 4px;
        padding-right: 4px;
        color: #333;
        background-color: #fff;
        grid-area: 1 / 1;
        border-radius: 4px;
      }
    }
  }
</style>
