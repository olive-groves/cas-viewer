<script lang="ts">
    import { AxisDisplay } from "$lib/ColorbarHelper.svelte";

  let colorbar_length_pixels = $state(400)

  const flexGrowScale = 100;

  let min = $state(-2);
  let max = $state(-0.4);
  let n_max = $state(12);  // TODO: n_max = 1 fails, sometimes

  let axis = new AxisDisplay(() => min, () => max, () => n_max);
</script>

<label>
  Min:
  <input type=range bind:value={min} min={-2} max={axis.max} step={0.001}>
  {axis.min}
</label>
<label>
  Max:
  <input type=range bind:value={max} min={axis.min} max={2} step={0.001}>
  {axis.max}
</label>
<label>
  N ticks (max):
  <input type=range bind:value={n_max} min={0} max={50} step={1}>
  {axis.nMax}
</label>

<p>{axis.interval} interval</p>
<p>{axis.n} number of ticks</p>

<label>
  <input type=range bind:value={colorbar_length_pixels} min={0} max={1000} step={10}>
  {colorbar_length_pixels}px
</label>

<div class=figure>
  <div class=plot></div>
  <div class=colorbar style:height={`${colorbar_length_pixels}px`}>
    <div class=scale></div>
    {#if axis.displayTicks.length}
      <div class=ticks>
        <!-- (1 / interval) factor keeps numbers in a size that doesn't get rounded (0.0010 -> 0) vs ((1/0.0002)*0.0010 -> 5) -->
        {#each axis.displayTicks as displayTick, i}
          <div class=tick style:flex={`${(flexGrowScale*1/axis.interval)*(i === 0 ? (axis.ticks[i] - axis.min) : axis.interval)} 1 0`}>
            <div class=mark></div>
            <div class=label style:position-anchor={`--tick${i}`}>
              {displayTick.scientific.toNumber().toFixed(Math.abs(axis.displayInterval.scientific.exponent))} {displayTick.unit.symbol}m
              <!-- {tick.scientific.significand.toFixed(axis.intervalScientific.exponent >= 0 ? 0 : Math.abs(axis.intervalScientific.exponent))} × 10<sup>{tick.scientific.exponent.toFixed()}</sup> -->
            </div>
          </div>
        {/each}
        <!-- Ticks max buffer -->
        <div style:height=100% style:flex={`${(flexGrowScale*1/axis.interval)*Math.abs(axis.max - axis.ticks.at(-1))} 1 0px`}></div>
      </div>
    {/if}
  </div>
</div>

<!-- <div style:display=flex style:flex-direction=column-reverse style:width=250px style:height={`${colorbar_length_pixels}px`}>
  <div style:width=100% style:height=100% style:flex="1 1 0px" style:background-color=red></div>
  <div style:width=100% style:height=100% style:flex="1 1 0px" style:background-color=green></div>
  <div style:width=100% style:height=100% style:flex="1 1 0px" style:background-color=blue></div>
  <div style:width=100% style:height=100% style:flex="1 1 0px" style:background-color=white></div>
</div> -->

<style>
  .figure {
    box-sizing: border-box;
    display: flex;
    padding: 10px;
    width: 100%;
    flex-wrap: nowrap;
    border: 1px solid gray;
    .plot {
      flex-grow: 1;
      border: 1px solid gray;
      background-clip: content-box;
      background: radial-gradient(
          #fde725,
          #5ec962,
          #21918c,
          #3b528b,
          #440154
      )
    }
    .colorbar {
      display: flex;
      border: 1px solid gray;
      padding: 0.5em;  /* Half a line height */
      background-color: gray;
      --scale-border-width: 1px;
      --mark-border-width: 1px;
      .scale {
        border: var(--scale-border-width) solid white;
        outline: 1px solid black;
        position: relative;
        width: 16px;
        background: linear-gradient(
          #fde725,
          #5ec962,
          #21918c,
          #3b528b,
          #440154
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
  }
</style>