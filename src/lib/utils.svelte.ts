import { SvelteMap } from "svelte/reactivity";

export class OrderedSvelteMap<K extends string, V = any> {
  map: SvelteMap<K, V> = new SvelteMap();
  order: K[] = $state([]);
  // Whether to reorder the key in place upon add and move, allowing tab focus to be retained* in #each blocks.
  // *This requires you to track the previously focused element, for which there is an example in /routes/lib.
  #reorderItemInPlace: boolean;
  #keyGenerator: (() => K) | undefined;

  // TODO: Add keys with initial values... like set?
  constructor({
    reorderItemInPlace = false,
    keyGenerator,
  }: {
    reorderItemInPlace?: boolean;
    keyGenerator?: () => K;
    } = {}) {
    this.#keyGenerator = keyGenerator;
    this.#reorderItemInPlace = reorderItemInPlace;
  }

  generateKey(): K {
    if (this.#keyGenerator === undefined) {
      throw new Error("No key generator passed to constructor.")
    } else {
      return this.#keyGenerator();
    }
  }

  add(value: V, options?: { key?: K, index?: number }): K {
    if (options?.key === undefined && this.#keyGenerator === undefined) {
      throw new Error("No key specified and no key generator passed to constructor.")
    }
    const key = options?.key ?? this.generateKey();
    this.map.set(key, value)

    const to = options?.index ?? this.order.length;
    const toRemainder = to % (this.order.length + 1);
    if (this.#reorderItemInPlace) {
      this.order = this.order.toSpliced(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, key);
    } else {
      this.order.splice(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, key)
    }

    return key
  }

  get(key: K): V | undefined {
    return this.map.get(key)
  }

  // TODO: Add .set()?

  delete(keyOrIndex: K | number): boolean {
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

  clear() {
    this.order = [];
    this.map.clear();
  }

  move(from: number, to: number) {
    const toRemainder = to % this.order.length;
    if (toRemainder === from) return;
    if (this.#reorderItemInPlace) {  // Slower (copies), but retains focus
      this.order = this.order.toSpliced(from, 1).toSpliced(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, this.order[from]);
    } else {  // Faster (mutates), but does not retain focus
      this.order.splice(toRemainder < 0 ? this.order.length + toRemainder : toRemainder, 0, this.order.splice(from, 1)[0])
    }
  }

  shiftByKey(key: K, shift: number) {
    const from = this.order.indexOf(key)
    if (from < 0) return
    this.move(from, from + shift)
  }

}
