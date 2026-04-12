<script lang="ts">
  import Colorbar from "$lib/Colorbar.svelte";

  let min = $state(-2);
  let max = $state(-0.4);

  let use_manual_n = $state(false);
  let input_manual_n = $state(12);
  let manual_n = $derived(use_manual_n ? input_manual_n : undefined);
</script>

<label>
  Min:
  <input type=range bind:value={min} min={-2} max={max} step={0.001}>
  {min}
</label>
<label>
  Max:
  <input type=range bind:value={max} min={min} max={2} step={0.001}>
  {max}
</label>
<label>
  Use manual N:
  <input type=checkbox bind:checked={use_manual_n}>
  {use_manual_n}
</label>
<label>
  N ticks (max):
  <input type=range bind:value={input_manual_n} oninput={() => use_manual_n = true} min={0} max={50} step={1}>
  {input_manual_n}
</label>

<div class=figure style:height={`${300}px`}>
  <div class=plot></div>
  <Colorbar
    {min}
    {max}
    {manual_n}
    --gradient="linear-gradient(
      to top,
      #000,
      #fff
    )"
  />
</div>

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
        #fff,
        #000
      )
    }
  }
</style>