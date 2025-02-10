<script lang="ts">
  import { onMount } from "svelte";
  let {
    loaded,
    files = $bindable()
  } = $props();
  let drag = $state(-1)

  onMount(() => {
    // files.push("https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json");
  })
</script>

<div class="menu">
  <h2>PMTiles CAS Viewer</h2>

  <form>
    <!-- Separate label from input to disable pointer events -->
    <div>
      <label class="title" for="rgb">RGB (raster)</label>
      <input
        bind:files
        id="rgb"
        type="file"
        ondragenter={() => (drag = 0)}
        ondragover={() => (drag = 0)}
        ondragleave={() => (drag = -1)}
        ondrop={() => (drag = 0)}
        class="{drag === 0 ? 'dragged' : ''}"
      />
    </div>
    <div>
      <label class="title" for="height">Height (raster-dem)</label>
      <input
        id="height"
        type="file"
        ondragenter={() => (drag = 1)}
        ondragover={() => (drag = 1)}
        ondragleave={() => (drag = -1)}
        ondrop={() => (drag = 1)}
        class="{drag === 1 ? 'dragged' : ''}"
      />
    </div>
    <div>
      <label class="title" for="nan">NaNs (raster)</label>
      <input
        id="nan"
        type="file"
        ondragenter={() => (drag = 2)}
        ondragover={() => (drag = 2)}
        ondragleave={() => (drag = -1)}
        ondrop={() => (drag = 2)}
        class="{drag === 2 ? 'dragged' : ''}"
      />
    </div>
  </form>
  
  <button onclick={loaded}>
    Load
  </button>
</div>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  label.title {
    /* Padding https://stackoverflow.com/a/7168692/20921535 */
    display: inline-block;
    pointer-events:none;
    font-size: 1em;
    padding-top: 0.3em;
    padding-bottom: 0.3em;
  }
  input[type=file] {
    box-sizing: border-box;
    border: 1px dashed color-mix(in srgb, CanvasText, Canvas 50%);
    padding: 1em;
    width: 100%;
  }
  input[type=file]:hover {
    border-color: CanvasText;
  }
  input[type=file].dragged {
    border-color: CanvasText;
    border-style: solid;
  }
  div.menu {
    display: flex;
    flex-flow: column;
    justify-content: center;
    gap: 1em;
    padding: 1em;
    width: 300px;
  }
</style>