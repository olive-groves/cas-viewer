<script lang="ts">
    import { getScientific, getSmallestGreaterThanOrEqualTo, range } from "$lib/Mathematics.svelte";

  let min = $state(0);
  let max = $state(5);
  let n_major_max = $state(12);

  let units_major_unrounded = $derived((max - min)/(n_major_max + 1))
  let units_major = $derived.by(() => {
    let significand: number;
    let exponent: number;
    const unrounded_scientific = getScientific(units_major_unrounded)
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
    return significand * 10 ** exponent
  })
  let n_major = $derived(units_major === 0 ? 0 : Math.floor(1 + (max/units_major) - Math.ceil(min/units_major)))

  let major_ticks_start = $derived(Math.ceil(min/units_major) * units_major)
  let major_ticks = $derived(range(n_major).map((i) => major_ticks_start + i * units_major))
</script>

<label>
  <input type=range bind:value={min} min={0} max={max} step={0.01}>
  {min}
</label>
<label>
  <input type=range bind:value={max} min={min} max={10} step={0.01}>
  {max}
</label>

<p>{units_major_unrounded} major units unrounded</p>
<p>{units_major} major units</p>
<p>{n_major} number of major ticks</p>

<ul>
  {#each major_ticks as major_tick}
  <li>
    {major_tick}
  </li>
  {/each}
</ul>
