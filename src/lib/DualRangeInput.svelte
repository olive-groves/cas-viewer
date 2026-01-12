<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import DualRangeInput from '@stanko/dual-range-input';
  import '@stanko/dual-range-input/dist/index.css';

  let {
    // TODO: Style props?
    low = $bindable(25),
    high = $bindable(75),
    min = $bindable(1),
    max = $bindable(100),
    step = $bindable(1)
  }: {
    low?: number,
    high?: number,
    min?: number,
    max?: number,
    step?: number
  } = $props();

  let dualRangeInput: DualRangeInput;

  let lowElement: HTMLInputElement | undefined = $state();
  let highElement: HTMLInputElement | undefined = $state();

  onMount(() => {
    if (lowElement && highElement) {
      dualRangeInput = new DualRangeInput(lowElement, highElement);
    }
  });

  onDestroy(() => {
    dualRangeInput?.destroy?.();
  })

  $effect(() => {
    low;
    high;
    dualRangeInput.update("floor")
  })

  
</script>

<div class="dual-range-input">
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    bind:this={lowElement}
    bind:value={low}
    />
    <input
    type="range"
    min={min}
    max={max}
    step={step}
    bind:this={highElement}
    bind:value={high}
  />
</div>

<style>
  .dual-range-input {
    --dri-height: var(--height, 1.5rem);
    --dri-thumb-width: var(--thumb-width, 1.25rem);
    --dri-thumb-height: var(--thumb-height, 1.25rem);
    --dri-thumb-color: var(--thumb-color, #ddd);
    --dri-thumb-hover-color: var(--thumb-hover-color, #a8d5ff);
    --dri-thumb-active-color: var(--thumb-active-color, #4eaaff);
    --dri-thumb-border-color: var(--thumb-border-color, rgba(0, 0, 0, 0.1));
    --dri-thumb-border-hover-color: var(--thumb-border-hover-color, var(--dri-thumb-border-color));
    --dri-thumb-border-active-color: var(--thumb-border-active-color, var(--dri-thumb-border-color));
    --dri-thumb-border-radius: var(--thumb-border-radius, 1rem);
    --dri-thumb-border-width: var(--thumb-border-width, 1px);
    --dri-track-height: var(--track-height, 0.25rem);
    --dri-track-border-radius: var(--track-border-radius, 1rem);
    --dri-track-color: var(--track-color, #ccc);
    --dri-track-filled-color: var(--track-filled-color, #0084ff);
    --dri-track-filled-gradient-mid-color: var(--track-filled-gradient-mid-color, --dri-track-filled-color);
    --dri-track-filled-gradient-end-color: var(--track-filled-gradient-end-color, --dri-track-filled-color);
  }
  .dual-range-input > input[type=range] {
    padding-top: var(--padding-top, 0);
    padding-bottom: var(--padding-bottom, 0)
  }
</style>
