<script lang="ts">
  import type { Snippet } from "svelte";
  import ToolButton from "./ToolButton.svelte";
  import type {WindowState} from "./viewer-window";
  let {
    state = {
      state: "normal",
      frame: true,
      titlebar: true,
      control: true,
      clientArea: true,
    },
    children,
  }: {
    state: WindowState;
    children?: Snippet;
  } = $props();

</script>

<div class={["window", {frame: state.frame}]}>
  {#if state.titlebar}
    <div class=titlebar>
      <!-- <span class={["material-symbols-sharp", "unselectable"]}>
        drag_indicator
      </span> -->
      Titlebar
    </div>
  {/if}
  {#if state.control}
    <div class=control>
      <ToolButton symbol=horizontal_rule --width=1.5em/>
      <ToolButton symbol=close --width=1.5em/>
    </div>
  {/if}
  {#if state.clientArea}
    <div class=client-area>
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .window {
    flex: 1 1;
    display: grid;

    grid-template-rows: 0fr 1fr;
    grid-template-columns: 1fr;
    &.frame {
      border-radius: var(--gap);
      border: 1px solid color-mix(in srgb, Canvas, CanvasText 25%);
      padding: var(--gap);
      &:has(.titlebar, .control) {
        padding-top: 0;
      }
      /* Bundle titlebar and controls together into a topbar? */
      &:hover {
        border-color: color-mix(in srgb, Canvas, CanvasText 50%);
      }
      .client-area {
        border-radius: var(--gap);
        contain: paint;
      }
    }
    .titlebar {
      grid-area: 1 / 1;
    }
    .control {
      grid-area: 1 / 1;
      display: flex;
      justify-self: end;
      align-items: baseline;
    }
    .client-area {
      grid-area: 2 / 1;
      display: flex;
    }
  }
</style>
