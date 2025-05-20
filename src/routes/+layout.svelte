<script lang="ts">
  import '$lib/maplibre-gl.css'
  
    // import { base } from "$app/paths";
    let { children } = $props()
</script>

<nav style:margin="0" style:padding="0.3em">
  <h1>PMTiles Multi Viewer</h1>
  <a href="/almond-blossom">Almond Blossom</a>
  <button class="restart" onclick={() => {window.location.reload(); window.location.href = '/';}}>reset</button>
  <!-- <a href="{base}/test-openstreetmap">test</a> -->
  <!-- <button class="restart" onclick={() => {window.location.reload(); window.location.href = `${base}/`;}}>reset</button> -->
</nav>

<style>
  nav {
    display: flex;
    flex-wrap: nowrap;
  }
  a, h1 {
    font-size: 1em;
    margin: 0.3em;
  }
  h1 {
    margin-right: auto;
  }
</style>

{@render children()}
