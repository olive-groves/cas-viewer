<script lang="ts">
  import { AxisDisplay } from "$lib/ColorbarHelper.svelte";

  const _flexGrowScale = 100;

  // TODO: Units as top label?

  let {
    min = 0,
    max = 1,
    manual_n = undefined,
  } = $props();

  let auto_n = $state(11);  // Stand-in value for axis init

  let axis = new AxisDisplay(() => min, () => max, () => manual_n ?? auto_n);

	let _colorbar: HTMLDivElement;
	let _colorbarClientHeight = $state();

	$effect(() => {
    const height = _colorbarClientHeight;
    // Use parent line-height because the ticks don't (yet) exist, they're calculated here!
    // Tick line-height is colorbar line-height. That's just how it works for now.
    const lineHeight = parseInt(window.getComputedStyle(_colorbar).lineHeight)
    auto_n = Math.floor(height / lineHeight);
	});

</script>

<div
  class=colorbar
  bind:this={_colorbar}  // FIXME: If we add a label to the top of the scale, maybe different reference for height?
	bind:clientHeight={_colorbarClientHeight}
>
  <div class=scale></div>
  {#if axis.displayTicks.length}
    <div class=ticks>
      <!-- (1 / interval) factor keeps numbers in a size that doesn't get rounded (0.0010 -> 0) vs ((1/0.0002)*0.0010 -> 5) -->
      {#each axis.displayTicks as displayTick, i}
        <div class=tick style:flex={`${(_flexGrowScale*1/axis.interval)*(i === 0 ? (axis.ticks[i] - axis.min) : axis.interval)} 1 0`}>
          <div class=mark></div>
          <div class=label style:position-anchor={`--tick${i}`}>
            {displayTick.scientific.toNumber().toFixed(Math.abs(axis.displayInterval.scientific.exponent))} {displayTick.unit.symbol}m
            <!-- {tick.scientific.significand.toFixed(axis.intervalScientific.exponent >= 0 ? 0 : Math.abs(axis.intervalScientific.exponent))} × 10<sup>{tick.scientific.exponent.toFixed()}</sup> -->
          </div>
        </div>
      {/each}
      <!-- Ticks max buffer -->
      <div style:height=100% style:flex={`${(_flexGrowScale*1/axis.interval)*Math.abs(axis.max - axis.ticks.at(-1))} 1 0px`}></div>
    </div>
  {/if}
</div>

<style>
  .colorbar {
    display: flex;
    line-height: var(
      --line-height,
      1.7em
    );
    /* border: 1px solid gray; */
    padding: 0.5em;  /* Half a line height */
    background-color: var(
      --background-color,
      gray
    );
    --scale-border-width: 1px;
    --mark-border-width: 1px;
    .scale {
      border: var(--scale-border-width) solid white;
      outline: 1px solid black;
      position: relative;
      width: 16px;
      background: var(
        --gradient,
        linear-gradient(
          to top,
          #440154,
          #3b528b,
          #21918c,
          #5ec962,
          #fde725
        )
      );
    }
    .ticks {
      display: flex;
      flex-wrap: nowrap;
      flex-direction: column-reverse;
      padding-top: var(--scale-border-width);
      padding-bottom: calc(var(--scale-border-width) - var(--mark-border-width));
      .tick {
        display: flex;
        width: 100%;
        height: 100%;
        min-height: 0;
        .mark {
          width: 10px;
          height: min-content;
          border-top: var(--mark-border-width) solid white;
          border-bottom: var(--mark-border-width) solid black;
          transform: translate(0, -50%);
        }
        .label {
          font-family: sans-serif;
          margin-left: 5px;
          height: min-content;
          transform: translate(0, -50%);
          filter: drop-shadow(0 0 0.05rem black);
        }
      }
    }
  }
</style>