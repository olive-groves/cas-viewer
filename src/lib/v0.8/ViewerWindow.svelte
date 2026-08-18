<script lang="ts">
  import ToolButton from "./ToolButton.svelte";

  let { children } = $props();
</script>

<div class=window>
  <div class=titlebar>
    Titlebar
  </div>
  <div class=control>
    <ToolButton symbol=horizontal_rule --width=1.5em/>
    <ToolButton symbol=close --width=1.5em/>
  </div>
  <div class=client-area>
    {@render children?.()}
  </div>
</div>

<style>
  .window {
    border-radius: var(--gap);
    flex: 1 1;
    display: grid;
    grid-template-rows: 24px 1fr var(--gap);
    grid-template-columns: var(--gap) 1fr var(--gap);
    border: 1px solid color-mix(in srgb, Canvas, CanvasText 25%);
    /* background: color-mix(in srgb, color-mix(in srgb, Canvas, CanvasText 10%), transparent 50%); */
    &:hover {
      border: 1px solid color-mix(in srgb, Canvas, CanvasText 50%);
      /* background: color-mix(in srgb, color-mix(in srgb, Canvas, CanvasText 10%), transparent 20%); */
    }
    .titlebar {
      grid-area: 1 / 2;
    }
    .control {
      grid-area: 1 / 2;
      display: flex;
      justify-self: end;
      align-items: baseline;
    }
    .client-area {
      grid-area: 2 / 2;
      display: flex;
      border-radius: var(--gap);
      contain: paint;
    }
  }
</style>
