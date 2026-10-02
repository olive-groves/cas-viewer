<script lang="ts">
  import { SvelteMap } from "svelte/reactivity";

  function resolveWithinXRandomSeconds(x: any): Promise<string> {
    return new Promise((resolve) => {
      const milliseconds = Math.random() * x * 1000;
      setTimeout(() => {
        resolve(`myBounds-${milliseconds}ms`);
      }, milliseconds);
    });
  }

  interface Source {
    name: string;
    bounds: string | Promise<string>;
    getBounds(): string | Promise<string>;
  }

  class PseudoPMTiles implements Source {
    name;
    bounds: string | Promise<string>;  // Hold the initial Promise and then the resolved value after initalization.

    constructor(name: string) {
      this.name = $state(name);
      this.bounds = this._initializeBounds();  // Eagerly get Promise on instantiation allows us #await
    }

    private async _initializeBounds() {  // Private to load bounds
      const bounds = await this.getBounds();
      this.bounds = bounds;  // Set within to avoid #await refresh
      return bounds
    }

    async getBounds(): Promise<string> {
      return await resolveWithinXRandomSeconds(2);  // PMTiles header tech
    }
  }

  class PseudoImage implements Source {
    name;
    bounds: string;

    constructor(name: string) {
      this.name = name;
      this.bounds = `already known bounds for ${name}`;  // We already know it.
    }

    getBounds(): string {
      return this.bounds;
    }
  }

  const sources = $state({
    [crypto.randomUUID()]: new PseudoPMTiles("ABC"),
    [crypto.randomUUID()]: new PseudoPMTiles("!@#"),
    [crypto.randomUUID()]: new PseudoImage("123"),
  });

  const addSource = () => sources[crypto.randomUUID()] = new PseudoPMTiles(`source-${Object.keys(sources).length}`);

  console.log(Object.values(sources)[0].bounds)
</script>

<button onclick={addSource}>Another One</button>
{#each Object.entries(sources) as [key, source] (key)}
  <div>
    {key}
    {source.name}
    {#await source.bounds then bounds}
      {bounds}
    {/await}
  </div>
{/each}
