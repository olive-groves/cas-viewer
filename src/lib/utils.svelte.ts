import { SvelteMap } from "svelte/reactivity";

type Key = string | `${string}-${string}-${string}-${string}-${string}`;

export class OrderedSvelteMap<V> {
  map: SvelteMap<string, V> = new SvelteMap();
  order: Key[] = $state([]);
  // Whether to reorder the key in place upon add and move, allowing tab focus to be retained* in #each blocks.
  // *This requires you to track the previously focused element, for which there is an example in /routes/lib.
  private reorderItemInPlace: boolean;

  // TODO: Add keys with initial values... like set?
  constructor(initialValues?: V[], options = {reorderItemInPlace: false}) {
    this.reorderItemInPlace = options.reorderItemInPlace;
    if (typeof initialValues !== 'undefined') {
      initialValues.forEach((value) => this.add(value));
    }
  }

  generateKey(): string {
    return crypto.randomUUID()
  }

  // Change to .set(), like a map? key, value, options
  add(value: V, options?: {key?: string, index?: number}) {
    const key = options?.key ?? this.generateKey();
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

  shiftByKey(key: string, shift: number) {
    const from = this.order.indexOf(key)
    if (from < 0) return
    this.move(from, from + shift)
  }

}
