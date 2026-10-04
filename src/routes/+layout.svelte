<script lang="ts">
  import '$lib/maplibre-gl.css'
  import '$lib/css/index.css'

  // import { base } from "$app/paths";
  let { children } = $props()
</script>

<nav class="unselectable">
  <h1>Impasto Viewer</h1>
  <button style:margin-inline-start=auto onclick={() => {window.location.reload(); window.location.href = '/';}}>Latest Version (v0.8-alpha)</button>
  <button onclick={() => {window.location.reload(); window.location.href = '/v/0.7';}}>v0.7</button>
  <a href="/almond-blossom">Harm Belt's <cite>Almond Blossom</cite></a>
</nav>

<style>
  nav {
    font-size: 1rem;
    display: flex;
    align-items: first baseline;
    gap: calc(2 * var(--gap));
    padding: 0 var(--gap);
    button {
      padding: 0 var(--gap);
      border: 1px solid color-mix(in srgb, currentColor, transparent 75%);
    }
    * {
      font-size: 1rem;
    }
  }
</style>

{@render children()}
