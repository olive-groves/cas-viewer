<script lang="ts">
  import '$lib/maplibre-gl.css'
  
    // import { base } from "$app/paths";
    let { children } = $props()
</script>

<nav style:margin="0" style:padding="0.3em">
  <button onclick={() => {window.location.reload(); window.location.href = '/';}}><h1>PMTiles Multi Viewer</h1></button>
  <a class=home href="/almond-blossom">Harm Belt's <em>Almond Blossom</em></a>
  <button onclick={() => {window.location.reload();}}><p>reset</p></button>
  <!-- <a href="{base}/test-openstreetmap">test</a> -->
  <!-- <button class="restart" onclick={() => {window.location.reload(); window.location.href = `${base}/`;}}>reset</button> -->
</nav>

<style>
  nav {
    display: flex;
    flex-wrap: nowrap;
  }
  a, h1, p {
    font-size: 0.88em;
    margin: 0.2em;
  }
  .home {
    margin-right: auto;
  }
</style>

{@render children()}
