
<script lang="ts">
  import DualRangeInput from "$lib/DualRangeInput.svelte";
  import { COLORMAPS } from "$lib/ColorRelief.svelte";

  function interpolateColorHex(color1: string, color2: string, ratio = 0.5) {
    // https://stackoverflow.com/a/76126221/20921535
    // let color1Six: string = color1;
    // if (color1.length == 4) { // If 4-digit hex
    //   color1Six = "#" +
    //     `${color1Six.at(1)?.repeat(2)}` +
    //     `${color1Six.at(2)?.repeat(2)}` +
    //     `${color1Six.at(3)?.repeat(2)}`
    // }
    
    // TODO: Alpha channel support (8-digit hex)

    // Convert the hex colors to RGB values
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    // Convert the interpolated RGB values back to a hex color
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  let colormap = $state('inferno');
  let colormapColors = $derived(COLORMAPS[colormap])
  let trackFilledColor: string = $derived(colormapColors.at(0))
  let trackFilledGradientEndColor: string = $derived(colormapColors.at(-1))
  let trackFilledGradientMidColor: string = $derived.by(() => {
    if (colormapColors.length > 2) {
      return colormapColors.at(Math.ceil(colormapColors.length / 2));
    } else {
      return interpolateColorHex(colormapColors.at(0), colormapColors.at(-1));
    }
  });

  let show: boolean = $state(true)

  let low = $state(5);
  let high = $state(75);
  let min = $state(0);
  let max = $state(1000);
  let step = $state(5);
</script>

<input type="range"
  min={min}
>

<button onclick={() => (show = !show)}>
  Show
</button>

{#if show}
  <div style="display: flex; flex-direction: column;">
    <div>Hey</div>
    <div>No wait</div>
    <DualRangeInput
      bind:low
      bind:high
      bind:min
      bind:max
      bind:step
      --thumb-width=0.75rem
      --track-filled-color={trackFilledColor}
      --track-filled-gradient-mid-color={trackFilledGradientMidColor}
      --track-filled-gradient-end-color={trackFilledGradientEndColor}
    />
    <div style="display: flex; justify-content: space-between;">
      <div style="display: flex; justify-content: space-between; flex: 1 1 0; width: 0;">
        <span>{min}</span>
        <span>{low}</span>
      </div>
      <span>–</span>
      <div style="display: flex; justify-content: space-between; flex: 1 1 0; width: 0;">
        <span>{high}</span>
        <span>{max}</span>
      </div>
    </div>
  </div>
{/if}

