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

  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
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
    --opsz: 20;
    --grad: 0;
    --hover-grad: 100;
    --active-grad: 0;
    ---off-fill: var(--off-fill, 0);
    ---on-fill: var(--on-fill, 1);
    font-size: var(--font-size, 1.25rem);
    display: inline-flex;
    > span {
      line-height: 1;
      font-variation-settings:
        'opsz' var(--opsz),
        'FILL' var(--off-fill),
        'GRAD' var(--grad);
    }
    &.toggled > span {
      font-variation-settings:
        'opsz' var(--opsz),
        'FILL' var(---on-fill),
        'GRAD' var(--grad);
    }
    &:hover, &:focus-visible {
      > span {
        font-variation-settings:
          'opsz' var(--opsz),
          'FILL' var(---off-fill),
          'GRAD' var(--hover-grad);
      }
      &.toggled > span {
        font-variation-settings:
          'opsz' var(--opsz),
          'FILL' var(---on-fill),
          'GRAD' var(--hover-grad);
      }
      &:active {
        > span {
          font-variation-settings:
            'opsz' var(--opsz),
            'FILL' var(---off-fill),
            'GRAD' var(--active-grad);
        }
        &.toggled > span {
          font-variation-settings:
            'opsz' var(--opsz),
            'FILL' var(---on-fill),
            'GRAD' var(--active-grad);
        }
      }
    }
  }
</style>
