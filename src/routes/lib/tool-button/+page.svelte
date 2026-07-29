<script lang="ts">
  import ToolButton from "$lib/v0.8/ToolButton.svelte";

</script>

<ol>
  <li>
    <ToolButton symbol=home/>
  </li>
  <li>
    toggle
    <ToolButton toggle symbol=home/>
  </li>
  <li>
    toggle, symbolOff
    <ToolButton toggle symbol=link symbolOff=link_off --on-fill=0/>
  </li>
  <li>
    --font-size
    <ToolButton symbol=drag_indicator --font-size=4rem/>
  </li>
</ol>

<style lang="css">
  ol {
    padding-inline-start: 1em;
  }
  li {
    list-style: none;
  }
</style>
