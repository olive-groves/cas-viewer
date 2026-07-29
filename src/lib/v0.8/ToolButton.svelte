<!-- Button that uses Material Symbols -->
<script lang="ts">
	let {
    toggle = false,
    toggleable = $bindable(true),
    toggled = $bindable(true),
    symbol,
    symbolOff = undefined,
    onclick,
    ontoggle,
    ...buttonProps
  } = $props();

  let _symbolOn = $derived(symbol)
  let _symbolOff = $derived(symbolOff ?? symbol)

  // On toggle true, show filled
  function handleClick(event) {
    if (toggleable) {
      toggled = !toggled;
      ontoggle?.(toggled);
    }
    onclick?.(event);
  }
</script>

<!-- Non-toggle buttons are stylistically toggled buttons -->
<button onclick={handleClick} {...buttonProps} class={["unselectable", {"toggled": toggle ? toggled : true}]}>
  <span class={["material-symbols-sharp"]}>
    {toggle ? (toggled ? _symbolOn : _symbolOff) : _symbolOn}
  </span>
</button>

<style>
  button {
    --grad: -100;
    --hover-grad: 100;
    font-size: var(--font-size, 1.25rem);
    display: inline-flex;
    > span {
      line-height: 1;
      font-variation-settings:
        'FILL' var(--off-fill, 0),
        'GRAD' var(--grad);
    }
    &.toggled > span {
      font-variation-settings:
        'FILL' var(--on-fill, 1),
        'GRAD' var(--grad);
    }
    &:hover > span {
      font-variation-settings:
        'FILL' var(--off-fill, 0),
        'GRAD' var(--hover-grad);
    }
    &.toggled:hover > span {
      font-variation-settings:
        'FILL' var(--on-fill, 1),
        'GRAD' var(--hover-grad);
    }
  }
</style>
