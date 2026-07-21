<script lang="ts">
  import { untrack } from "svelte";
  import { flip } from "svelte/animate";
  import { slide, fly } from "svelte/transition";

  import { OrderedSvelteMap } from "$lib/utils.svelte";

  class Value {
    id = crypto.randomUUID();
  }
  const initial_n = 5;
  const initial_values = Array.from(Array(initial_n), (_) => new Value());
  const valuesMap = new OrderedSvelteMap({reorderItemInPlace: true, keyGenerator: () => crypto.randomUUID()});
  initial_values.forEach((value) => valuesMap.add(value))

  // Keep tab focus on move
  let previousActiveElement: HTMLElement | HTMLLIElement | null = $state(null);
	$effect(() => {
		void valuesMap.order;  // $state array(s) whose order will be rearranged
    let gaveFocusToPrevious = false;
		untrack(() => {
      if ((document?.activeElement === document?.body) && previousActiveElement) {  // Reorder moves focus to body, so we set to previous
        previousActiveElement.focus();
        gaveFocusToPrevious = true;
      }
		});
    if (gaveFocusToPrevious) previousActiveElement = null;
	});
</script>

<div style:display=flex style:flex-direction=column>
  <button onclick={() => valuesMap.move(0, -1)}>Move top to bottom</button>
  <button onclick={() => valuesMap.add(new Value(), {index: 0})}>Add to start</button>
  <button onclick={() => valuesMap.add(new Value())}>Add to end</button>
  {#each valuesMap.order as key, index (key)}
    {@const value = valuesMap.map.get(key)}
    <div style:display=flex animate:flip in:fly out:slide>
      <div>
        <button onclick={() => valuesMap.move(index, index - 1)} onfocusout={(e) => previousActiveElement = e.target as HTMLButtonElement}>
          ▲
        </button>
      </div>
      <div>
        <button onclick={() => {valuesMap.move(index, index + 1)}} onfocusout={(e) => previousActiveElement = e.target as HTMLButtonElement}>
          ▼
        </button>
      </div>
      <div>
        <button onclick={() => {valuesMap.delete(index)}}>
          ×
        </button>
      </div>
      <div style:margin="0px 8px">{index}</div>
      <div style:flex=1>{value.id}</div>
    </div>
  {/each}
</div>

