<!-- Button that uses Material Symbols -->
<script lang="ts">
	let { toggleable = $bindable(true), symbol, symbol_on, ...buttonProps } = $props();

  let toggled = $state(true);
  // TODO: Hover state?
  // On toggle true, show filled
  function handleClick(event) {
    if (toggleable) {
      toggled = !toggled;
    }
    buttonProps?.onclick?.(event);
  }
</script>

<button onclick={handleClick}>
  <span class={["material-symbols-sharp", {fill: toggled}]}>
    {symbol}
  </span>
</button>

<style>
  button {
    font-size: 1.5em;
    display: flex;
    &:hover > span {
      font-weight: bolder;
    }
    span {
      line-height: 1;
    }
  }
  .fill {
    font-variation-settings:
      'FILL' 1;
  }
</style>
