<script lang="ts">
  import type { Snippet } from "svelte";
  import ToolButton from "./ToolButton.svelte";
  import type {WindowState} from "./viewer-window";
  let {
    state = $bindable({
      state: "normal",
      frame: true,
      titlebar: true,
      title: "Title",
      controls: true,
      clientArea: true,
    }),
    children,
  }: {
    state: WindowState;
    children?: Snippet;
  } = $props();

</script>

<div class={["window", {frame: state.frame}]}>
  {#if state.titlebar}
    <div class=titlebar>
      <div class=drag>
        <span class={["material-symbols-sharp", "unselectable"]}>
          drag_indicator
        </span>
      </div>
      {#if state.title}
        <div class=title>
          <span>{state.title}</span>
        </div>
      {/if}
      {#if state.controls}
        <div class=controls>
          <ToolButton symbol=horizontal_rule --width=1.5em/>
          <ToolButton symbol=close --width=1.5em/>
        </div>
      {/if}
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

    grid-template: 0fr 1fr / 1fr;
    &.frame {
      border-radius: var(--gap);
      border: 1px solid color-mix(in srgb, Canvas, CanvasText 25%);
      padding: var(--gap);
      &:has(.titlebar) {
        padding-top: 0;
      }
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
      display: grid;
      grid-template: 1fr / 0fr 1fr 0fr;
      align-items: center;
      .drag {
        grid-area: 1 / 1;
        display: flex;
        justify-self: end;
        align-items: baseline;
        padding-right: 0.2em;
        span {
          margin-left: -0.2em;
        }
      }
      .title {
        grid-area: 1 / 2;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .controls {
        align-self: start;
        grid-area: 1 / 3;
        display: flex;
        justify-self: end;
        align-items: baseline;
      }
    }
    .client-area {
      grid-area: 2 / 1;
      display: flex;
    }
  }
</style>
