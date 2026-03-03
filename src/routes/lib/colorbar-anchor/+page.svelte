<script lang="ts">
    import { getScientific, getSmallestGreaterThanOrEqualTo, range, type NumberScientific } from "$lib/Mathematics.svelte";

  let colorbar_length_pixels = $state(200)

  let min = $state(-0.542);
  let max = $state(0.387);
  let n_max = $state(8);

  let units_unrounded = $derived((max - min)/(n_max))
  let units_scientific: NumberScientific = $derived.by(() => {
    let significand: number;
    let exponent: number;
    const unrounded_scientific = getScientific(units_unrounded)
    if (unrounded_scientific.significand === 0) {
        significand = 0;
        exponent = 0;
    } else {
      significand = getSmallestGreaterThanOrEqualTo([1, 2, 5], unrounded_scientific.significand)[0];
      exponent = unrounded_scientific.exponent;
      if (significand === undefined) {  // Guard if above the highest
          significand = [1, 2, 5].at(0)!;
          exponent += 1;
      }
    }
    return {significand, exponent}
  })
  let units = $derived(units_scientific.significand * 10 ** units_scientific.exponent)
  let n = $derived(units === 0 ? 0 : Math.floor(1 + (max/units) - Math.ceil(min/units)))

  let ticks_start = $derived(Math.ceil(min/units) * units)
  let ticks = $derived(n ? range(n).map((i) => ticks_start + i * units) : [])
</script>

<label>
  <input type=range bind:value={min} min={-2} max={max} step={0.001}>
  {min}
</label>
<label>
  <input type=range bind:value={max} min={min} max={2} step={0.001}>
  {max}
</label>

<p>{units_unrounded} units unrounded</p>
<p>{units} units</p>
<p>{n} number of ticks</p>

<label>
  <input type=range bind:value={colorbar_length_pixels} min={0} max={1000} step={10}>
  {colorbar_length_pixels}px
</label>
<!--
  Tick position as a percentage of the length of a div?
  [0.271] [0.3, 0.4, 0.5] [0.5]
  0.3 -> 12.6%
  0.4 -> 56.3%
  0.5 -> 100.0%
  The idea is to define a div (a colorbar) where the start is the min, the end is max,
  and the ticks are placed relative to the start and end.
-->


<div class=figure>
  <div class=plot></div>
  <div class=colorbar style:height={`${colorbar_length_pixels}px`}>
    <div class=scale></div>
    {#if ticks.length}
      <div class=ticks>
        <!-- (1 / units) factor keeps numbers in a size that doesn't get rounded (0.0010 -> 0) vs ((1/0.0002)*0.0010 -> 5) -->
        {#each ticks as tick, i}
          <div class=tick style:flex={`${(1/units)*(i === 0 ? (tick - min) : units)} 1 0`} style:anchor-name={`--tick${i}`}></div>
          <div class=label style:position-anchor={`--tick${i}`}>
            {tick.toFixed(units_scientific.exponent >= 0 ? 0 : Math.abs(units_scientific.exponent))}
          </div>
        {/each}
        <!-- Ticks max buffer -->
        <div style:height=100% style:flex={`${(1/units)*(max - ticks.at(-1))} 1 0px`}></div>
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
      padding: 10px;
      .scale {
        border: 1px solid white;
        width: 10px;
        background: linear-gradient(
          #fde725,
          #5ec962,
          #21918c,
          #3b528b,
          #440154
        );
      }
      .ticks {
        width: 10px;
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column-reverse;
        .tick {
          width: 100%;
          height: 100%;
          min-height: 0%;
          border-top: 1px solid white;
        }
        .label {
          position: fixed;
          top: anchor(top);
          left: anchor(right);
          margin-left: 2px;
          /* Centered on top edge */
          transform: translate(0, -50%);
          min-height: 0;
          min-width: 0;
        }
      }
    }
  }
</style>