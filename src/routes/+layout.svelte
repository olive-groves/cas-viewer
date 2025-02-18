<script lang="ts">
    let { children } = $props()
</script>

<nav style:margin="0" style:padding="0.3em">
  <h1>Viewer</h1>
  <a href="/test">test</a>
  <button class="restart" onclick={() => {window.location.reload(); window.location.href = '/';}}>reset</button>
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
  .restart {
    margin-left: auto;
  }
</style>

{@render children()}
