<script lang="ts">
    import { getScientific, getSmallestGreaterThanOrEqualTo, range, type NumberScientific } from "$lib/Mathematics.svelte";

  let colorbar_length_pixels = $state(400)

  let min = $state(-1.1);
  let max = $state(0.387);
  let n_max = $state(15);

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
  <div class=plot>
    <!-- <div class=axes>
    </div> -->
  </div>
  <div class=colorbar style:height={`${colorbar_length_pixels}px`}>
    <div class=scale>
    </div>
    <div class=ticks>
      {#each ticks as tick}
        <div class=tick>
          {tick.toFixed(units_scientific.exponent >= 0 ? 0 : Math.abs(units_scientific.exponent))}
            <!-- {tick} -->
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- <ul class=ticks>
  {#each ticks.toReversed() as tick}
  <li>
    {tick.toFixed(units_scientific.exponent >= 0 ? 0 : Math.abs(units_scientific.exponent))}
  </li>
  {/each}
</ul> -->

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
      padding: 10px;
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
      .ticks {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: column-reverse;
        background-color: gray;
      }
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
    }
  }
</style>