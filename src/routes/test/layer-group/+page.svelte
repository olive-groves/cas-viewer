<script lang="ts">
  import { untrack } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { flip } from "svelte/animate";
  import { fade, slide, fly } from "svelte/transition";

  class OrderedSvelteMap<V> {
    map: SvelteMap<string, V> = new SvelteMap();
    order: string[] = $state([]);
    private reorderItemInPlace: boolean;

    constructor(initialValues?: V[], options = {reorderItemInPlace: false}) {
      this.reorderItemInPlace = options.reorderItemInPlace;
      if (typeof initialValues !== 'undefined') {
        initialValues.forEach((value) => this.add(value));
      }
    }

    generateKey(): string {
      return crypto.randomUUID()
    }

    add(value: V, options?: {index?: number}) {
      const key = this.generateKey();
      this.map.set(key, value)

      const to = options?.index ?? this.order.length;
      const toRemainder = to % (this.order.length + 1);
      if (this.reorderItemInPlace) {
        this.order = this.order.toSpliced(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, key);
      } else {
        this.order.splice(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, key)
      }

      return key
    }

    delete(keyOrIndex: string | number): boolean {
      let key, index;
      if (typeof keyOrIndex === "number") {
        index = keyOrIndex;
        key = this.order.at(index);
      } else {
        key = keyOrIndex;
        index = this.order.indexOf(key);
      }
      if (index < 0) return false
      this.order.splice(index, 1);
      return key ? this.map.delete(key) : false;
    }

    move(from: number, to: number) {
      const toRemainder = to % this.order.length;
      if (toRemainder === from) return;
      if (this.reorderItemInPlace) {  // Slower (copies), but retains focus
        this.order = this.order.toSpliced(from, 1).toSpliced(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, this.order[from]);
      } else {  // Faster (mutates), but does not retain focus
        this.order.splice(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, this.order.splice(from, 1)[0])
      }
    }

  }

  class Value {
    id = crypto.randomUUID();
  }
  const initial_n = 5;
  const initial_values = Array.from(Array(initial_n), (_) => new Value());
  const valuesMap = new OrderedSvelteMap(initial_values, {reorderItemInPlace: true});

  // Keep tab focus on move
  let previousActiveElement: HTMLLIElement | null = $state(null);
	$effect(() => {
		void valuesMap.order;  // Array whose order may be rearranged.
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
  <button onclick={() => valuesMap.add(new Value(), {index: 0})}>Add to start</button>
  <button onclick={() => valuesMap.add(new Value())}>Add to end</button>
  {#each valuesMap.order as key, index (key)}
    {@const value = valuesMap.map.get(key)}
    <div style:display=flex animate:flip in:fly out:slide>
      <div>
        <button onclick={() => valuesMap.move(index, index - 1)} onfocusout={(e) => previousActiveElement = e.target}>
          ▲
        </button>
      </div>
      <div>
        <button onclick={() => {valuesMap.move(index, index + 1)}} onfocusout={(e) => previousActiveElement = e.target}>
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

