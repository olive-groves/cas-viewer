<script lang="ts">
    import { getScientific, getSmallestGreaterThanOrEqualTo, range, type NumberScientific } from "$lib/Mathematics.svelte";

  let colorbar_length_pixels = $state(400)

  let min = $state(-0.542);
  let max = $state(0.387);
  let n_max = $state(12);

  let units_unrounded = $derived((max - min)/(n_max + 1))
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
  let ticks = $derived(range(n).map((i) => ticks_start + i * units))
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

<div class=figure>
  <div class=plot></div>
  <div class=colorbar style:height={`${colorbar_length_pixels}px`}>
    <div class=scale></div>
    {#if ticks.length}
      <div class=ticks>
        <!-- (1 / units) factor keeps numbers in a size that doesn't get rounded (0.0010 -> 0) vs ((1/0.0002)*0.0010 -> 5) -->
        {#each ticks as tick, i}
          <div class=tick style:flex={`${(1/units)*(i === 0 ? (tick - min) : units)} 1 0`}>
            <div class=mark></div>
            <div class=label style:position-anchor={`--tick${i}`}>
              {tick.toFixed(units_scientific.exponent >= 0 ? 0 : Math.abs(units_scientific.exponent))}
            </div>
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
      background-color: gray;
      .scale {
        border: 1px solid white;
        outline: 1px solid black;
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
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column-reverse;
        .tick {
          display: flex;
          width: 100%;
          height: 100%;
          min-height: 0;
          .mark {
            width: 10px;
            height: min-content;
            border-top: 1px solid white;
            border-bottom: 1px solid black;
            transform: translate(0, -50%);  /* Geometric center */
          }
          .label {
            font-family: sans-serif;
            margin-left: 5px;
            height: min-content;
            transform: translate(0, -45%);  /* Visual center */
            filter: drop-shadow(0 0 0.05rem black);
          }
        }
      }
    }
  }
</style>